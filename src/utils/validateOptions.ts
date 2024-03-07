import type { StreamOptions } from '../types';

export const validateOptions = (opts: StreamOptions): StreamOptions => {
  if (!opts.audio && !opts.video)
    throw new Error('Audio and/or video must be enabled');

  opts.mimeType = opts.mimeType
    ? opts.mimeType
    : opts.video
      ? 'video/webm'
      : 'audio/webm';
  opts.timeslice = opts.timeslice ? opts.timeslice : 100;
  return opts;
};
