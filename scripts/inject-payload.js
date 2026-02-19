// Content script - injects page-context script and forwards MF remote data

function injectExtractor() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject-post-message.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

injectExtractor();

window.addEventListener("message", (event) => {
  if (event.source !== window || event.data?.type !== "MF_REMOTES_DATA") return;

  chrome.runtime.sendMessage(
    {
      type: "MF_REMOTES_DATA",
      payload: event.data.payload,
    },
    () => {}
  );
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "MF_REFRESH") {
    injectExtractor();
    sendResponse({ ok: true });
  }
  return true;
});
