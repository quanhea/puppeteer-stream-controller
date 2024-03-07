import type { Transform } from 'stream';

import { Page } from 'puppeteer-core';
import { RawData, Server, WebSocket } from 'ws';

import type { StreamOptions } from './types';
import { WebSocketServer } from './WebSocketServer';
import { getExtensionPage } from './utils/getExtensionPage';
import { getTab } from './utils/getTab';
import { validateOptions } from './utils/validateOptions';
import { createTransformStream } from './utils/createTransformStream';
import { Mutex } from './utils/Mutex';

const mutex = new Mutex();

class StreamController {
  private extension: Page | null = null;
  private tab: chrome.tabs.Tab | null = null;
  private stream: Transform | null = null;
  private wss: Server;

  constructor(
    private page: Page,
    private opts: StreamOptions,
    wss?: Server,
  ) {
    // Validate the provided options
    this.opts = validateOptions(opts);
    this.wss = wss ?? WebSocketServer.configure(8080).getInstance().getServer();
    this.handleConnection = this.handleConnection.bind(this);
  }

  // Get the media stream
  public async getStream() {
    if (!this.stream) {
      await this.initStream();
    }

    return this.stream;
  }

  // Pause the media stream
  public async pauseStream() {
    if (!this.extension || !this.tab) {
      throw new Error('Extension or Tab not loaded');
    }

    await this.extension.evaluate((tabId) => {
      recorderService.pauseRecording(tabId);
    }, this.tab.id as number);
  }

  // Resume the media stream
  public async resumeStream() {
    if (!this.extension || !this.tab) {
      throw new Error('Extension or Tab not loaded');
    }

    await this.extension.evaluate((tabId) => {
      recorderService.resumeRecording(tabId);
    }, this.tab.id as number);
  }

  // Stop the media stream
  public async stopStream() {
    if (!this.extension || !this.tab) {
      throw new Error('Extension or Tab not loaded');
    }

    await this.extension.evaluate(
      (tabId) => recorderService.stopRecording(tabId),
      this.tab.id as number,
    );
  }

  // Load the extension page in the context of the browser
  private async loadExtension() {
    this.extension = await getExtensionPage(this.page);
  }

  // Select the tab where we want to start the media stream
  private async selectTab() {
    const releaseLock = await mutex.acquire();
    await this.page.bringToFront();
    this.tab = await getTab(this.extension, {
      active: true,
    });
    releaseLock();
  }

  // Initiate media stream
  private async initStream() {
    this.createStream();

    this.setupConnection();

    await this.loadExtension();

    await this.selectTab();

    if (!this.extension || !this.tab) {
      throw new Error('Extension or Tab not loaded');
    }

    // Start the media stream
    await this.extension.evaluate(
      (opts) => {
        return new Promise((resolve, reject) => {
          recorderService.startRecording(opts).then(resolve).catch(reject);
        });
      },
      {
        tabId: this.tab.id as number,
        wsUrl: this.constructWebSocketUrl(this.tab.id as number),
        ...this.opts,
      },
    );
  }

  // Create a transform stream to handle the media stream data
  private createStream() {
    this.stream = createTransformStream();
  }

  // Setup the WebSocketServer handlers
  private setupConnection() {
    this.wss.on('connection', this.handleConnection);
  }

  private handleConnection(ws: WebSocket, req: Request) {
    if (!this.assertWsConnection(req)) {
      return;
    }

    const stream = this.stream;

    if (!stream) return;

    ws.on('message', this.onMessage);
    ws.on('error', this.onError);
    ws.on('close', this.onClose);
  }

  private assertWsConnection(req: Request) {
    const searchParams = new URLSearchParams(req.url.slice(1));

    if (searchParams.get('tabId') !== this.tab?.id?.toString()) {
      return false;
    }

    return true;
  }

  private onMessage = (data: RawData) => {
    this.stream?.write(data);
  };

  private onError = (err: Error) => {
    console.error('WebSocket Error:', err);
  };

  private onClose = () => {
    if (this.stream && !this.stream.readableEnded && !this.stream.writableEnded)
      this.stream.end();

    if (!this.extension || !this.tab) {
      throw new Error('Extension or Tab not loaded');
    }

    if (!this.extension.isClosed()) {
      // eslint-disable-next-line no-undef
      this.extension.evaluate(
        (tabId) => recorderService.stopRecording(tabId),
        this.tab.id as number,
      );
    }

    this.wss.off('connection', this.handleConnection);
  };

  // Construct the WebSocket URL
  private constructWebSocketUrl(tabId: number) {
    return `ws://localhost:${WebSocketServer.getPort()}?tabId=${tabId}`;
  }
}

export { StreamController };
