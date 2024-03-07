export class Mutex {
  private _promiseChain: Promise<unknown> = Promise.resolve();

  async acquire() {
    let resolveLock!: () => void;

    // Create a new promise and chain it to the existing lock
    // eslint-disable-next-line prefer-const
    let newLock = new Promise<void>((resolve) => (resolveLock = resolve));
    this._promiseChain = this._promiseChain.then(() => newLock);

    return resolveLock;
  }
}
