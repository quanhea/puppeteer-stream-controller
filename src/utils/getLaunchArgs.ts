import path from 'path';

import { EXTENSION_ID } from './constants';

export const getLaunchArgs = (): string[] => {
  const extensionDir = path.resolve(__dirname, '../dist/extension');

  const args = [
    '--load-extension=' + extensionDir,
    '--disable-extensions-except=' + extensionDir,
    '--allowlisted-extension-id=' + EXTENSION_ID,
    '--autoplay-policy=no-user-gesture-required',
  ];

  return args;
};
