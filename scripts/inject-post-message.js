// Runs in page context - extracts Module Federation remotes from window.__FEDERATION__ and Performance API fallback

(function () {
  function extractFromInstances(federation) {
    const instances = federation.__INSTANCES__;
    if (!instances || typeof instances !== "object") return [];

    const remotes = [];
    const seen = new Set();

    for (const instanceId of Object.keys(instances)) {
      const instance = instances[instanceId];
      if (!instance) continue;

      const hostName = instance.options?.name || instance.name || instanceId;
      const remotesConfig = instance.options?.remotes || instance.remotes;
      if (!remotesConfig) continue;

      if (Array.isArray(remotesConfig)) {
        for (const r of remotesConfig) {
          const name = r.name || r.alias || "unknown";
          const entry = r.entry || "";
          const key = entry;
          if (!seen.has(key) && entry) {
            seen.add(key);
            remotes.push({ hostName, name, entry, alias: r.alias || null });
          }
        }
      } else if (typeof remotesConfig === "object") {
        for (const [alias, value] of Object.entries(remotesConfig)) {
          let name = alias;
          let entry = "";
          if (typeof value === "string") {
            const at = value.indexOf("@");
            if (at !== -1) {
              name = value.slice(0, at).trim();
              entry = value.slice(at + 1).trim();
            } else {
              entry = value;
            }
          } else if (value && typeof value === "object") {
            name = value.name || value.alias || alias;
            entry = value.entry || value.url || "";
          }
          const key = entry;
          if (!seen.has(key) && entry) {
            seen.add(key);
            remotes.push({ hostName, name, entry, alias: alias !== name ? alias : null });
          }
        }
      }
    }
    return remotes;
  }

  function extractFromModuleInfo(federation) {
    const moduleInfo = federation.moduleInfo;
    if (!moduleInfo || typeof moduleInfo !== "object") return [];

    const remotes = [];
    const seen = new Set();

    for (const [key, info] of Object.entries(moduleInfo)) {
      const remotesInfo = info?.remotesInfo;
      if (!remotesInfo || typeof remotesInfo !== "object") continue;

      const hostName = key.includes(":") ? key.split(":")[0] : key;

      for (const [remoteName, remoteData] of Object.entries(remotesInfo)) {
        const entry = remoteData?.matchedVersion || remoteData?.url || (typeof remoteData === "string" ? remoteData : "");
        if (!entry) continue;
        const k = entry;
        if (seen.has(k)) continue;
        seen.add(k);
        remotes.push({ hostName, name: remoteName, entry, alias: null });
      }
    }
    return remotes;
  }

  function extractFromPerformanceApi() {
    try {
      const entries = performance.getEntriesByType("resource") || [];
      const remotes = [];
      const seen = new Set();

      for (const e of entries) {
        const url = (e.name || e).toString();
        const isManifest = url.includes("mf-manifest.json");
        const isRemoteEntry = url.includes("remoteEntry.js");
        if (!isManifest && !isRemoteEntry) continue;
        if (seen.has(url)) continue;
        seen.add(url);

        const name = deriveRemoteNameFromUrl(url);
        remotes.push({
          hostName: "page",
          name,
          entry: url,
          alias: null,
        });
      }
      return remotes;
    } catch (_) {
      return [];
    }
  }

  function deriveRemoteNameFromUrl(url) {
    try {
      const u = new URL(url, window.location.origin);
      const path = u.pathname;
      const manifestIdx = path.indexOf("mf-manifest.json");
      const remoteEntryIdx = path.indexOf("remoteEntry.js");
      const idx = manifestIdx !== -1 ? manifestIdx : remoteEntryIdx !== -1 ? remoteEntryIdx : -1;
      if (idx === -1) return "remote";

      const before = path.slice(0, idx).replace(/\/$/, "");
      const parts = before.split("/").filter(Boolean);
      const staticIdx = parts.indexOf("static");
      if (staticIdx > 0) {
        return parts[staticIdx - 1] || "remote";
      }
      return parts[parts.length - 1] || "remote";
    } catch (_) {
      return "remote";
    }
  }

  function extractRemotes() {
    const federation = typeof window !== "undefined" ? window.__FEDERATION__ : null;

    let allRemotes = [];
    const byEntry = new Map();

    if (federation && typeof federation === "object") {
      const fromInstances = extractFromInstances(federation);
      const fromModuleInfo = extractFromModuleInfo(federation);
      for (const r of [...fromInstances, ...fromModuleInfo]) {
        if (!byEntry.has(r.entry)) byEntry.set(r.entry, r);
      }
      allRemotes = Array.from(byEntry.values());
    }

    if (allRemotes.length === 0) {
      const fromPerf = extractFromPerformanceApi();
      for (const r of fromPerf) {
        if (!byEntry.has(r.entry)) byEntry.set(r.entry, r);
      }
      allRemotes = Array.from(byEntry.values());
    }

    const hasFederation = !!federation || allRemotes.length > 0;

    return {
      remotes: allRemotes,
      hostName: allRemotes[0]?.hostName || null,
      hasFederation,
      pageUrl: window.location.href,
    };
  }

  const result = extractRemotes();
  window.postMessage({ type: "MF_REMOTES_DATA", payload: result }, "*");
})();
