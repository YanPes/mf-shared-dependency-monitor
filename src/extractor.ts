/**
 * Self-contained extraction logic for executeScript with world: "MAIN".
 * Must be a plain function with no external references (gets serialized).
 */
export type ExtractedRemote = {
  hostName: string;
  name: string;
  entry: string;
  alias: string | null;
  loadedBy?: string;
};

export type SharedDepUsage = { moduleName: string; version: string };

export type ExtractedSharedDep = {
  sharedName: string;
  versions: string[];
  modules: SharedDepUsage[];
  hasMismatch: boolean;
};

export type ExtractorResult = {
  remotesFromHost: ExtractedRemote[];
  remotesFromRemotes: ExtractedRemote[];
  sharedDependencies: ExtractedSharedDep[];
  fetchedEntryUrls: string[];
  hostName: string | null;
  hasFederation: boolean;
  pageUrl: string;
};

export function createExtractor(): () => ExtractorResult {
  return function extractRemotesInPage(): ExtractorResult {
    const fromHost = new Map<string, ExtractedRemote>();
    const fromRemotes = new Map<string, ExtractedRemote>();

    function addToHost(r: ExtractedRemote) {
      if (r.entry && !fromHost.has(r.entry) && !fromRemotes.has(r.entry))
        fromHost.set(r.entry, r);
    }

    function addToRemotes(r: ExtractedRemote, loadedBy: string) {
      if (!r.entry || fromHost.has(r.entry)) return;
      const withLoadedBy = { ...r, loadedBy };
      if (!fromRemotes.has(r.entry)) fromRemotes.set(r.entry, withLoadedBy);
    }

    const federation = typeof (window as any).__FEDERATION__ !== "undefined" ? (window as any).__FEDERATION__ : null;

    if (federation && typeof federation === "object") {
      // __INSTANCES__: instance.options.remotes = host's direct remotes
      const instances = federation.__INSTANCES__;
      if (instances && typeof instances === "object") {
        for (const instanceId of Object.keys(instances)) {
          const instance = instances[instanceId];
          if (!instance) continue;
          const hostName = instance.options?.name || instance.name || instanceId;
          const remotesConfig = instance.options?.remotes || instance.remotes;
          if (!remotesConfig) continue;
          if (Array.isArray(remotesConfig)) {
            for (const r of remotesConfig) {
              addToHost({
                hostName,
                name: r.name || r.alias || "unknown",
                entry: r.entry || "",
                alias: r.alias || null,
              });
            }
          } else if (typeof remotesConfig === "object") {
            for (const [alias, value] of Object.entries(remotesConfig)) {
              let name = alias;
              let entry = "";
              if (typeof value === "string") {
                const at = value.indexOf("@");
                name = at !== -1 ? value.slice(0, at).trim() : alias;
                entry = at !== -1 ? value.slice(at + 1).trim() : value;
              } else if (value && typeof value === "object") {
                const v = value as { name?: string; alias?: string; entry?: string; url?: string };
                name = v.name || v.alias || alias;
                entry = v.entry || v.url || "";
              }
              addToHost({ hostName, name, entry, alias: name !== alias ? alias : null });
            }
          }
        }
      }

      // moduleInfo: host (key without ":") = host remotes; producers (key with ":") = nested remotes
      const moduleInfo = federation.moduleInfo;
      if (moduleInfo && typeof moduleInfo === "object") {
        for (const [key, info] of Object.entries(moduleInfo)) {
          const remotesInfo = (info as any)?.remotesInfo;
          if (!remotesInfo || typeof remotesInfo !== "object") continue;

          const isProducer = key.includes(":");
          const consumerName = key.includes(":") ? key.split(":")[0] : key;

          for (const [remoteName, remoteData] of Object.entries(remotesInfo)) {
            const d = remoteData as { matchedVersion?: string; url?: string } | string;
            const entry = typeof d === "string" ? d : (d?.matchedVersion || d?.url || "");
            const remote = { hostName: consumerName, name: remoteName, entry, alias: null as string | null };
            if (isProducer) {
              addToRemotes(remote, consumerName);
            } else {
              addToHost(remote);
            }
          }
        }
      }
    }

    const fetchedEntryUrls: string[] = [];
    try {
      const entries = (performance as Performance).getEntriesByType?.("resource") || [];
      for (const e of entries) {
        const url = ((e as PerformanceResourceTiming).name || String(e)).toString();
        if (url.includes("mf-manifest.json") || url.includes("remoteEntry.js")) {
          fetchedEntryUrls.push(url);
        }
      }
    } catch (_) {}

    if (fromHost.size === 0 && fromRemotes.size === 0) {
      try {
        const entries = (performance as Performance).getEntriesByType?.("resource") || [];
        for (const e of entries) {
          const url = ((e as PerformanceResourceTiming).name || String(e)).toString();
          if (!url.includes("mf-manifest.json") && !url.includes("remoteEntry.js")) continue;
          let name = "remote";
          try {
            const u = new URL(url, location.origin);
            const path = u.pathname;
            const idx = path.indexOf("mf-manifest.json") !== -1 ? path.indexOf("mf-manifest.json") : path.indexOf("remoteEntry.js");
            if (idx !== -1) {
              const before = path.slice(0, idx).replace(/\/$/, "");
              const parts = before.split("/").filter(Boolean);
              const staticIdx = parts.indexOf("static");
              name = staticIdx > 0 ? parts[staticIdx - 1] : parts[parts.length - 1] || "remote";
            }
          } catch (_) {}
          addToHost({ hostName: "page", name, entry: url, alias: null });
        }
      } catch (_) {}
    }

    const sharedDeps = (function extractSharedDeps(fed: any) {
      const byName = new Map<string, Map<string, { moduleName: string; version: string }[]>>();
      function add(sharedName: string, moduleName: string, version: string) {
        if (!sharedName) return;
        let perVersion = byName.get(sharedName);
        if (!perVersion) {
          perVersion = new Map();
          byName.set(sharedName, perVersion);
        }
        let list = perVersion.get(version);
        if (!list) {
          list = [];
          perVersion.set(version, list);
        }
        if (!list.some((u) => u.moduleName === moduleName)) list.push({ moduleName, version });
      }
      if (fed && typeof fed === "object") {
        const moduleInfo = fed.moduleInfo;
        if (moduleInfo && typeof moduleInfo === "object") {
          for (const [key, info] of Object.entries(moduleInfo)) {
            const shared = (info as any)?.shared;
            if (!Array.isArray(shared)) continue;
            const moduleName = key.includes(":") ? key.split(":")[0] : key;
            for (const s of shared) {
              const name = s?.sharedName;
              const version = s?.version ?? "";
              add(name, moduleName, version);
            }
          }
        }
        const share = fed.__SHARE__;
        if (share && typeof share === "object") {
          for (const [instanceName, scopes] of Object.entries(share)) {
            if (!scopes || typeof scopes !== "object") continue;
            for (const scopeData of Object.values(scopes)) {
              if (!scopeData || typeof scopeData !== "object") continue;
              for (const [pkgName, versions] of Object.entries(scopeData)) {
                if (!versions || typeof versions !== "object") continue;
                for (const [ver, meta] of Object.entries(versions)) {
                  const m = meta as { useIn?: string[] };
                  const consumers = m?.useIn ?? [instanceName];
                  for (const mod of consumers) add(pkgName, mod, ver);
                }
              }
            }
          }
        }
      }
      const result: { sharedName: string; versions: string[]; modules: { moduleName: string; version: string }[]; hasMismatch: boolean }[] = [];
      for (const [sharedName, perVersion] of byName) {
        const versions = Array.from(perVersion.keys());
        const modules: { moduleName: string; version: string }[] = [];
        for (const list of perVersion.values()) modules.push(...list);
        result.push({ sharedName, versions, modules, hasMismatch: versions.length > 1 });
      }
      return result.sort((a, b) => {
        const aMis = a.hasMismatch ? 1 : 0;
        const bMis = b.hasMismatch ? 1 : 0;
        if (bMis !== aMis) return bMis - aMis;
        return a.sharedName.localeCompare(b.sharedName);
      });
    })(federation);

    return {
      remotesFromHost: Array.from(fromHost.values()),
      remotesFromRemotes: Array.from(fromRemotes.values()),
      sharedDependencies: sharedDeps,
      fetchedEntryUrls,
      hostName: (Array.from(fromHost.values())[0] ?? Array.from(fromRemotes.values())[0])?.hostName ?? null,
      hasFederation: !!federation || fromHost.size > 0 || fromRemotes.size > 0,
      pageUrl: location.href,
    };
  };

}
