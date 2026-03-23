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
  const sharedDepsDisabled = !loading && !hasFederation;
  const mismatchCount = sharedDeps.filter((s) => s.hasMismatch).length;

  const isFetched = (entry: string) => fetchedEntryUrls.has(entry);
  const remotesFromHost = showConfigured
    ? allRemotesFromHost
    : allRemotesFromHost.filter((r) => isFetched(r.entry));
  const remotesFromRemotes = showConfigured
    ? allRemotesFromRemotes
    : allRemotesFromRemotes.filter((r) => isFetched(r.entry));
  const totalRemotes = remotesFromHost.length + remotesFromRemotes.length;
  const remotesTabId = "mf-tab-remotes";
  const sharedDepsTabId = "mf-tab-shared-deps";
  const remotesPanelId = "mf-panel-remotes";
  const sharedDepsPanelId = "mf-panel-shared-deps";

  return (
    <div className={styles.popup} aria-label="Module Federation inspector">
      <header className={styles.header}>
        <h1 className={styles.title}>Module Federation Inspector</h1>
        <button
          className={styles.refreshBtn}
          onClick={refresh}
          disabled={loading}
          title="Refresh scan results"
          aria-label="Refresh scan results"
        >
          {loading ? "Scanning..." : "Refresh"}
        </button>
      </header>

      <nav className={styles.tabs} role="tablist" aria-label="Inspector sections">
        <button
          className={`${styles.tab} ${activeTab === "remotes" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("remotes")}
          id={remotesTabId}
          role="tab"
          aria-selected={activeTab === "remotes"}
          aria-controls={remotesPanelId}
        >
          Remotes
        </button>
        <button
          className={`${styles.tab} ${activeTab === "shared-deps" ? styles.tabActive : ""}`}
          onClick={() => {
            if (!sharedDepsDisabled) setActiveTab("shared-deps");
          }}
          id={sharedDepsTabId}
          role="tab"
          aria-selected={activeTab === "shared-deps"}
          aria-controls={sharedDepsPanelId}
          aria-disabled={sharedDepsDisabled}
          disabled={sharedDepsDisabled}
        >
          Shared dependencies
          {mismatchCount > 0 && (
            <span className={styles.badge} aria-label={`${mismatchCount} version mismatches`}>
              {mismatchCount}
            </span>
          )}
        </button>
      </nav>

      <main className={styles.main} aria-live="polite">
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!error && !hasFederation && !loading && (
          <section className={styles.emptyState} aria-label="No runtime detected">
            <p className={styles.empty}>
              No Module Federation runtime was detected on this page.
            </p>
            <p className={styles.emptyDetail}>
              This extension can only inspect pages that expose Module Federation runtime data.
            </p>
            <ul className={styles.emptyList}>
              <li>The app exposes <code>window.__FEDERATION__</code> at runtime (for example from <code>@module-federation/enhanced</code>).</li>
              <li>Or the page fetches federation files such as <code>remoteEntry*.js</code> or <code>mf-manifest*.json</code>.</li>
            </ul>
            <p className={styles.emptyDetail}>
              If your app loads remotes after navigation or login, wait for the app to finish booting and press Refresh.
            </p>
          </section>
        )}
        {!error && hasFederation && activeTab === "remotes" && (
          <section
            className={`${styles.remotesContent} ${styles.tabPanel}`}
            role="tabpanel"
            id={remotesPanelId}
            aria-labelledby={remotesTabId}
          >
            <div className={styles.remotesHeader}>
              <p className={styles.count}>
                {totalRemotes > 0
                  ? `Showing ${totalRemotes} ${showConfigured ? "configured" : "fetched"} remote${totalRemotes !== 1 ? "s" : ""}`
                  : "No remotes to show"}
              </p>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showConfigured}
                  onChange={(e) => setShowConfigured(e.target.checked)}
                  aria-describedby="show-configured-help"
                />
                <span>Show configured remotes too</span>
              </label>
            </div>
            <p id="show-configured-help" className={styles.toggleHelp}>
              Useful when remotes are configured but have not been fetched yet.
            </p>
            {totalRemotes === 0 && (
              <p className={styles.empty}>
                {showConfigured
                  ? "No remotes are configured."
                  : allRemotesFromHost.length + allRemotesFromRemotes.length > 0
                    ? "No remotes have been fetched yet. Turn on “Show configured remotes too” to inspect configured entries."
                    : "No remotes are connected. The host application may not define remotes."}
              </p>
            )}
            {totalRemotes > 0 && (
              <>
                {remotesFromHost.length > 0 && (
                  <div className={styles.group}>
                    <h3 className={styles.groupTitle}>Defined by the host application</h3>
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
                    <h3 className={styles.groupTitle}>Loaded by other remotes</h3>
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
          </section>
        )}
        {!error && hasFederation && activeTab === "shared-deps" && (
          <section
            className={styles.tabPanel}
            role="tabpanel"
            id={sharedDepsPanelId}
            aria-labelledby={sharedDepsTabId}
          >
            <SharedDepsTab sharedDeps={sharedDeps} />
          </section>
        )}
      </main>
    </div>
  );
};
