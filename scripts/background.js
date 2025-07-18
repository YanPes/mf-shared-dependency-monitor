const storeData = (data) => {
  chrome.storage.local.set({ "__FEDERATION__": data });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "__FEDERATION__") {
    console.log("Data is here", message)
    storeData(message)
  }
}); 
