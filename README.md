# puppeteer-stream-controller

[![npm latest][0]][1] [![node compatibility][2]][3]

`puppeteer-stream-controller` is a library that provides an easy-to-use API for managing media streams within a Puppeteer context. This library is particularly useful when building applications that handle audio and video streams, enabling developers to control the flow of media programmatically.

## Installation

Install the library:

```bash
npm install puppeteer-stream-controller
# or
yarn add puppeteer-stream-controller
```

## Features

- Start, pause, resume, and stop media streams within a puppeteer page.
- Manage multiple media streams simultaneously.
- Stream media over WebSocket server.
- Supports both audio and video streams.
- Configurable options for media types and frame sizes.

## Usage

Here's a simple example of how to use `puppeteer-stream-controller`:

```javascript
import puppeteer from 'puppeteer';
import {
  StreamController,
  getLaunchArgs,
  allowInIncognito,
} from 'puppeteer-stream-controller';

const opts = {
  audio: true,
  video: true,
  mimeType: 'video/webm',
  timeSlice: 20,
};

(async () => {
  // ****** REQUIRED ******
  // This will load the extension. If omitted, the extension won't be loaded and nothing will work.
  const extensionLaunchArgs = getLaunchArgs(); // ** required **
  const browser = await puppeteer.launch({ args: extensionLaunchArgs }); // ** required **

  // ****** OPTIONAL ******
  // Allow the extension to run in incognito mode
  await allowInIncognito(browser);

  const page = await browser.newPage();
  await page.goto('https://example.com');

  const streamController = new StreamController(page, {
    audio: true,
    video: true,
  });

  // getStream() returns a Node.js Transform stream
  const stream = await streamController.getStream();

  // Attach a 'data' event handler to the stream
  stream.on('data', (chunk) => {
    console.log('Received new stream data:', chunk);
  });

  // Pause or resume stream
  streamController.pauseStream();
  streamController.resumeStream();

  // Don't forget to stop the stream and close the browser when you're done.
  await streamController.stopStream();
  await browser.close();
})();
```

## API

### `StreamController`

`StreamController` is a class responsible for controlling the streaming process. It provides methods to start, pause, resume and stop the stream.

#### `constructor(page: Page, opts: StreamOptions, wss?: Server)`

Creates a new instance of `StreamController`.

- `page`: A Puppeteer [Page](https://pptr.dev/#?product=Puppeteer&version=v10.4.0&show=api-class-page) instance.
- `opts`: An object with the following properties:
  - `audio`: A boolean indicating whether to include audio in the stream.
  - `video`: A boolean indicating whether to include video in the stream.
  - `mimeType`: The MIME type of the stream ('audio/webm' or 'video/webm').
  - `timeSlice`: The number of milliseconds to record into each [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob).
- `wss`: An optional WebSocket server to handle the streaming.

#### `getStream(): Promise<Transform | null>`

Initializes the stream and returns it. The stream is a Node.js Transform stream.

#### `pauseStream(): Promise<void>`

Pauses the stream.

#### `resumeStream(): Promise<void>`

Resumes the stream.

#### `stopStream(): Promise<void>`

Stops the stream.

### `getLaunchArgs(): string[]`

Returns the launch arguments for Puppeteer.

### `allowInIncognito(browser: Browser | BrowserContext): Promise<void>`

Allows the extension to run in incognito mode.

## Contributing

Contributions are welcomed and appreciated. Please feel free to open an issue or submit a pull request.

## Acknowledgements

This project is inspired by [puppeteer-stream](https://github.com/SamuelScheit/puppeteer-stream). Portions of the codebase are derived from this project and are covered under their original [MIT License](https://github.com/SamuelScheit/puppeteer-stream/blob/main/LICENSE).

## License

`puppeteer-stream-controller` is [Apache-2.0 licensed](https://github.com/quanhea/puppeteer-stream-controller/blob/main/LICENSE).

[0]: https://img.shields.io/npm/v/puppeteer-stream-controller.svg?style=flat-square
[1]: https://www.npmjs.com/package/puppeteer-stream-controller
[2]: https://img.shields.io/node/v/puppeteer-stream-controller.svg
[3]: https://nodejs.org/en/about/previous-releases
