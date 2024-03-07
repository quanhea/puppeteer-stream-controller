import { Page } from 'puppeteer-core';

export const getTab = async (
  extension: Page | null,
  query: chrome.tabs.QueryInfo,
): Promise<chrome.tabs.Tab> => {
  const tab = await extension?.evaluate(
    async (query) => chrome.tabs.query(query),
    query,
  );
  if (!tab) throw new Error(`Cannot find tab: ${JSON.stringify(query)}`);
  return tab[0];
};
