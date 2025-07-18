const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject-post-message.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

window.addEventListener('message', (event) => {
  console.log('Message received in content script:', event);
  if (event.source !== window) return;
  console.log('Received __FEDERATION__ data:', event.data.payload);
  window.sessionStorage.setItem("__FEDERATION__", event.data.payload)
  chrome.runtime.sendMessage({
    type: "__FEDERATION__",
    payload: event.data.payload
  },
    (response) => console.log("[Content Script] Sent data to extension: ", response)
  )
});
