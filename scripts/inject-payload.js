const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject-post-message.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen on post message event and store the content inside the Chrome runtime event cue
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  window.sessionStorage.setItem("__FEDERATION__", event.data.payload)
  chrome.runtime.sendMessage({
    type: "__FEDERATION__",
    payload: event.data.payload
  },
    (response) => console.log("[Content Script] Sent data to extension: ", response)
  )
});
