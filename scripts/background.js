// Intercepts the Chrome runtime message type of "__FEDERATION__"
// and stores the content of the key in the internal browser storage

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "__FEDERATION__") {
  chrome.storage.local.set({ "__FEDERATION__": message });
  }
});
