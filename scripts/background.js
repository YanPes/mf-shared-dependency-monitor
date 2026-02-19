// Background service worker - stores MF remote data from content script

const api = typeof chrome !== "undefined" ? chrome : typeof browser !== "undefined" ? browser : null;
if (!api) return;

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MF_REMOTES_DATA") {
    api.storage.local.set({
      mfRemotes: message.payload,
      mfRemotesTabId: sender.tab?.id,
    });
    sendResponse({ ok: true });
  }
  return true; // Keep channel open for async sendResponse
});
