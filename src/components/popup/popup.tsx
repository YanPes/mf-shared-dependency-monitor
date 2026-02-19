import React, { useEffect, useState } from "react";
import styles from "./popup.module.scss";
import { RemoteCard } from "../remote-card/remote-card";
import { createExtractor } from "../../extractor";

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
  hostName: string | null;
  hasFederation: boolean;
  pageUrl?: string;
}

export const Popup = () => {
  const [data, setData] = useState<MFRemotesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      }
      const payload: MFRemotesPayload = {
        remotesFromHost: Array.from(fromHostByEntry.values()),
        remotesFromRemotes: Array.from(fromRemotesByEntry.values()),
        hostName: (Array.from(fromHostByEntry.values())[0] ?? Array.from(fromRemotesByEntry.values())[0])?.hostName ?? null,
        hasFederation,
        pageUrl: (results[0]?.result as MFRemotesPayload)?.pageUrl,
      };
      setData(payload ?? { remotesFromHost: [], remotesFromRemotes: [], hostName: null, hasFederation: false });
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

  const remotesFromHost = data?.remotesFromHost ?? [];
  const remotesFromRemotes = data?.remotesFromRemotes ?? [];
  const hasFederation = data?.hasFederation ?? false;
  const totalRemotes = remotesFromHost.length + remotesFromRemotes.length;

  return (
    <div className={styles.popup}>
      <header className={styles.header}>
        <h1 className={styles.title}>Module Federation Remotes</h1>
        <button
          className={styles.refreshBtn}
          onClick={refresh}
          disabled={loading}
          title="Refresh"
        >
          {loading ? "…" : "↻"}
        </button>
      </header>

      <main className={styles.main}>
        {error && (
          <p className={styles.error}>{error}</p>
        )}
        {!error && !hasFederation && !loading && (
          <p className={styles.empty}>
            No Module Federation runtime detected on this page.
          </p>
        )}
        {!error && hasFederation && totalRemotes === 0 && !loading && (
          <p className={styles.empty}>
            No remotes connected. The host may not have remotes configured.
          </p>
        )}
        {!error && totalRemotes > 0 && (
          <section className={styles.remotes}>
            <p className={styles.count}>
              {totalRemotes} remote{totalRemotes !== 1 ? "s" : ""} connected
            </p>
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
          </section>
        )}
      </main>
    </div>
  );
};
