import { Transform } from 'stream';

export const createTransformStream = (): Transform => {
  return new Transform({
    highWaterMark: 1024 * 1024 * 8,
    transform(chunk, _, callback) {
      callback(null, chunk);
    },
  });
};
