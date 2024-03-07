import { Browser, BrowserContext } from 'puppeteer-core';

import { EXTENSION_ID } from './constants';

export const allowInInCogito = async (browser: Browser | BrowserContext) => {
  const settings = await browser.newPage();
  await settings.goto(`chrome://extensions/?id=${EXTENSION_ID}`);
  await settings.evaluate(() => {
    document
      ?.querySelector('extensions-manager')
      ?.shadowRoot?.querySelector(
        '#viewManager > extensions-detail-view.active',
      )
      ?.shadowRoot?.querySelector(
        'div#container.page-container > div.page-content > div#options-section extensions-toggle-row#allow-incognito',
      )
      ?.shadowRoot?.querySelector('label#label input')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      ?.click();
  });
};
