// This function is invoked inside the host tab.
// It sends the __FEDERATION__ window runtime object via post message event.

// Safely stringify __FEDERATION__ avoiding circular refs
function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, function(key, value) {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  }, 2); // 2 for pretty-printing
}

window.postMessage({ payload: safeStringify(window?.__FEDERATION__) }, '*');
