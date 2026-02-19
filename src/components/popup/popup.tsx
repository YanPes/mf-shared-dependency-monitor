import React, { useEffect, useState } from "react";
import styles from "./popup.module.scss";
import { RemoteCard } from "../remote-card/remote-card";
import { SharedDepsTab } from "../shared-deps-tab/shared-deps-tab";
import { createExtractor } from "../../extractor";
import type { ExtractedSharedDep } from "../../extractor";

export type TabId = "remotes" | "shared-deps";

export interface RemoteInfo {
  hostName: string;
  name: string;
  entry: string;
  alias: string | null;
  loadedBy?: string;
}

export interface MFRemotesPayload {
  remotesFromHost: RemoteInfo[];
  remotesFromRemotes: RemoteInfo[];
  sharedDependencies: ExtractedSharedDep[];
  fetchedEntryUrls: string[];
  hostName: string | null;
  hasFederation: boolean;
  pageUrl?: string;
}

export const Popup = () => {
  const [data, setData] = useState<MFRemotesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("remotes");
  const [showConfigured, setShowConfigured] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) {
        setError("No active tab");
        setData(null);
        return;
      }
      const url = tab.url || "";
      if (url.startsWith("chrome://") || url.startsWith("about:") || url.startsWith("moz-extension://")) {
        setError("Cannot scan browser or extension pages");
        setData(null);
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: createExtractor(),
        world: "MAIN",
      }).catch(() => null);

      if (!results?.length) {
        setError("Cannot access this page");
        setData(null);
        return;
      }

      const fromHostByEntry = new Map<string, RemoteInfo>();
      const fromRemotesByEntry = new Map<string, RemoteInfo>();
      const sharedByName = new Map<string, ExtractedSharedDep>();
      const fetchedUrls = new Set<string>();
      let hasFederation = false;
      for (const r of results) {
        const p = r?.result as MFRemotesPayload | undefined;
        if (!p) continue;
        hasFederation = hasFederation || p.hasFederation;
        for (const remote of p.remotesFromHost || []) {
          if (remote.entry && !fromHostByEntry.has(remote.entry) && !fromRemotesByEntry.has(remote.entry))
            fromHostByEntry.set(remote.entry, remote);
        }
        for (const remote of p.remotesFromRemotes || []) {
          if (remote.entry && !fromHostByEntry.has(remote.entry) && !fromRemotesByEntry.has(remote.entry))
            fromRemotesByEntry.set(remote.entry, remote);
        }
        for (const url of p.fetchedEntryUrls || []) fetchedUrls.add(url);
        for (const sd of p.sharedDependencies || []) {
          const existing = sharedByName.get(sd.sharedName);
          if (!existing) {
            sharedByName.set(sd.sharedName, { ...sd });
          } else {
            const versionSet = new Set([...existing.versions, ...sd.versions]);
            const modMap = new Map(existing.modules.map((m) => [`${m.moduleName}:${m.version}`, m]));
            for (const m of sd.modules) modMap.set(`${m.moduleName}:${m.version}`, m);
            sharedByName.set(sd.sharedName, {
              sharedName: sd.sharedName,
              versions: Array.from(versionSet),
              modules: Array.from(modMap.values()),
              hasMismatch: versionSet.size > 1,
            });
          }
        }
      }
      const sharedDeps = Array.from(sharedByName.values()).sort((a, b) => {
        const aMis = a.hasMismatch ? 1 : 0;
        const bMis = b.hasMismatch ? 1 : 0;
        if (bMis !== aMis) return bMis - aMis;
        return a.sharedName.localeCompare(b.sharedName);
      });
      const payload: MFRemotesPayload = {
        remotesFromHost: Array.from(fromHostByEntry.values()),
        remotesFromRemotes: Array.from(fromRemotesByEntry.values()),
        sharedDependencies: sharedDeps,
        fetchedEntryUrls: Array.from(fetchedUrls),
        hostName: (Array.from(fromHostByEntry.values())[0] ?? Array.from(fromRemotesByEntry.values())[0])?.hostName ?? null,
        hasFederation,
        pageUrl: (results[0]?.result as MFRemotesPayload)?.pageUrl,
      };
      setData(payload ?? { remotesFromHost: [], remotesFromRemotes: [], sharedDependencies: [], fetchedEntryUrls: [], hostName: null, hasFederation: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scan");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes.mfRemotes?.newValue) {
        setData(changes.mfRemotes.newValue as MFRemotesPayload);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const allRemotesFromHost = data?.remotesFromHost ?? [];
  const allRemotesFromRemotes = data?.remotesFromRemotes ?? [];
  const fetchedEntryUrls = new Set(data?.fetchedEntryUrls ?? []);
  const sharedDeps = data?.sharedDependencies ?? [];
  const hasFederation = data?.hasFederation ?? false;
  const mismatchCount = sharedDeps.filter((s) => s.hasMismatch).length;

  const isFetched = (entry: string) => fetchedEntryUrls.has(entry);
  const remotesFromHost = showConfigured
    ? allRemotesFromHost
    : allRemotesFromHost.filter((r) => isFetched(r.entry));
  const remotesFromRemotes = showConfigured
    ? allRemotesFromRemotes
    : allRemotesFromRemotes.filter((r) => isFetched(r.entry));
  const totalRemotes = remotesFromHost.length + remotesFromRemotes.length;

  return (
    <div className={styles.popup}>
      <header className={styles.header}>
        <h1 className={styles.title}>Module Federation</h1>
        <button
          className={styles.refreshBtn}
          onClick={refresh}
          disabled={loading}
          title="Refresh"
        >
          {loading ? "…" : "↻"}
        </button>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "remotes" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("remotes")}
        >
          Remotes
        </button>
        <button
          className={`${styles.tab} ${activeTab === "shared-deps" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("shared-deps")}
        >
          Shared deps
          {mismatchCount > 0 && (
            <span className={styles.badge}>{mismatchCount}</span>
          )}
        </button>
      </nav>

      <main className={styles.main}>
        {error && (
          <p className={styles.error}>{error}</p>
        )}
        {!error && !hasFederation && !loading && (
          <p className={styles.empty}>
            No Module Federation runtime detected on this page.
          </p>
        )}
        {!error && hasFederation && activeTab === "remotes" && (
          <div className={styles.remotesContent}>
            <div className={styles.remotesHeader}>
              <p className={styles.count}>
                {totalRemotes > 0
                  ? `${totalRemotes} remote${totalRemotes !== 1 ? "s" : ""} ${showConfigured ? "configured" : "fetched"}`
                  : "Remotes"}
              </p>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showConfigured}
                  onChange={(e) => setShowConfigured(e.target.checked)}
                />
                <span>Include configured</span>
              </label>
            </div>
            {totalRemotes === 0 && (
              <p className={styles.empty}>
                {showConfigured
                  ? "No remotes configured."
                  : allRemotesFromHost.length + allRemotesFromRemotes.length > 0
                    ? "No remotes fetched yet. Enable “Include configured” to see all configured remotes."
                    : "No remotes connected. The host may not have remotes configured."}
              </p>
            )}
            {totalRemotes > 0 && (
              <>
                {remotesFromHost.length > 0 && (
                  <div className={styles.group}>
                    <h3 className={styles.groupTitle}>From host</h3>
                    <ul className={styles.list}>
                      {remotesFromHost.map((r, i) => (
                        <li key={`host-${r.entry}-${i}`}>
                          <RemoteCard remote={r} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {remotesFromRemotes.length > 0 && (
                  <div className={styles.group}>
                    <h3 className={styles.groupTitle}>Loaded by remotes</h3>
                    <ul className={styles.list}>
                      {remotesFromRemotes.map((r, i) => (
                        <li key={`remote-${r.entry}-${i}`}>
                          <RemoteCard remote={r} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {!error && hasFederation && activeTab === "shared-deps" && (
          <SharedDepsTab sharedDeps={sharedDeps} />
        )}
      </main>
    </div>
  );
};
