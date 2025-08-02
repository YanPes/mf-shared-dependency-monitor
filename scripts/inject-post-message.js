(function () {
  const payload = {
    __PRELOADED_MAP__: window.__FEDERATION__.__PRELOADED_MAP__,
    __SHARE__: window.__FEDERATION__.__SHARE__

  }
  window.postMessage({ payload: JSON.stringify(payload) }, '*');
})();
