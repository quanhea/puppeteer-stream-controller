import { Page } from 'puppeteer-core';

import { EXTENSION_ID } from './constants';

export const getExtensionPage = async (page: Page): Promise<Page> => {
  const context = page.browserContext();
  const extensionTarget = await context.waitForTarget(
    (target) =>
      target.type() === 'page' &&
      target.url() === `chrome-extension://${EXTENSION_ID}/index.html`,
  );
  if (!extensionTarget) throw new Error('cannot load extension');
  return (await extensionTarget.page()) as Page;
};
