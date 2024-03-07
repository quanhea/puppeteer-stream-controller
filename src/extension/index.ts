interface RecordingOptions extends MediaRecorderOptions {
  tabId: number;
  timeslice?: number;
  delay?: number;
  audio?: boolean;
  video?: boolean;
  wsUrl: string;
}

class RecorderService {
  private recorders: Record<string, MediaRecorder> = {};

  public async startRecording(options: RecordingOptions) {
    const {
      tabId,
      video,
      audio,
      audioBitsPerSecond,
      videoBitsPerSecond,
      bitsPerSecond,
      mimeType,
      timeslice,
      delay,
      wsUrl,
    } = options;

    const ws = await this.setupWebSocket(wsUrl);
    const streamId = await this.fetchStreamId(tabId);
    const stream = await this.getMediaStream(streamId, video, audio);

    if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));

    const recorder = this.createMediaRecorder(
      stream,
      { audioBitsPerSecond, videoBitsPerSecond, bitsPerSecond, mimeType },
      ws,
    );

    this.recorders[tabId.toString()] = recorder;
    recorder.start(timeslice);

    ['error', 'pause', 'resume'].forEach((event) =>
      recorder.addEventListener(event, () => this.updateStatus(tabId, event)),
    );

    this.updateStatus(tabId, 'recording');
  }

  public stopRecording(tabId: number) {
    const recorder = this.recorders[tabId.toString()];
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      delete this.recorders[tabId.toString()];
    }
  }

  public pauseRecording(tabId: number) {
    const recorder = this.recorders[tabId.toString()];
    if (recorder && recorder.state === 'recording') {
      recorder.pause();
    }
  }

  public resumeRecording(tabId: number) {
    const recorder = this.recorders[tabId.toString()];
    if (recorder && recorder.state === 'paused') {
      recorder.resume();
    }
  }

  private async setupWebSocket(wsUrl: string): Promise<WebSocket> {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve) =>
      ws.readyState === WebSocket.OPEN
        ? resolve()
        : ws.addEventListener('open', () => resolve()),
    );
    return ws;
  }

  private fetchStreamId(tabId: number): Promise<string> {
    return new Promise<string>((resolve, reject) =>
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) =>
        streamId ? resolve(streamId) : reject(),
      ),
    );
  }

  private async getMediaStream(
    streamId: string,
    video?: boolean,
    audio?: boolean,
  ): Promise<MediaStream> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (<any>navigator.mediaDevices.getUserMedia)({
      video: video && {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
      audio: audio && {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
    });
  }

  private createMediaRecorder(
    stream: MediaStream,
    options: MediaRecorderOptions,
    ws: WebSocket,
  ): MediaRecorder {
    const recorder = new MediaRecorder(stream, options);
    recorder.ondataavailable = async (e) =>
      e.data.size && ws.send(await e.data.arrayBuffer());
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      ws.readyState === WebSocket.OPEN && ws.close();
    };
    return recorder;
  }

  private updateStatus(tabId: number, state: string) {
    const recordersElem = document.getElementById('recorders');
    let recorderElem = document.getElementById(`recorder-${tabId}`);
    if (!recorderElem) {
      recorderElem = document.createElement('div');
      recorderElem.id = `recorder-${tabId}`;
      recordersElem?.appendChild(recorderElem);
    }
    recorderElem.innerText = `Recorder ${tabId} is ${state}`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-var
var recorderService = new RecorderService();
