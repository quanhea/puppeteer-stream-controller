import { Server } from 'ws';

class WebSocketServer {
  private static instance: WebSocketServer;
  private wss: Server | null = null;
  private port: number;

  private constructor(port: number) {
    this.port = port;
    this.init();
  }

  static configure(port: number) {
    if (!WebSocketServer.instance) {
      WebSocketServer.instance = new WebSocketServer(port);
    }
    return this;
  }

  static getInstance() {
    WebSocketServer.assertWss();
    return WebSocketServer.instance;
  }

  static getPort() {
    WebSocketServer.assertWss();
    return WebSocketServer.instance.port;
  }

  init(): void {
    if (this.wss) {
      this.wss.close();
    }
    this.wss = new Server({ port: this.port });
  }

  getServer(): Server {
    WebSocketServer.assertWss();
    return this.wss as Server;
  }

  private static assertWss(): void {
    if (!WebSocketServer.instance?.port) {
      throw new Error('WebSocketServer not configured');
    }
  }
}

export { WebSocketServer };
