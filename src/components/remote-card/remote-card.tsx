import React from "react";
import styles from "./remote-card.module.scss";
import type { RemoteInfo } from "../popup/popup";

type RemoteCardProps = {
  remote: RemoteInfo;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({ remote }) => {
  const displayName = remote.alias || remote.name;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{displayName}</span>
        {remote.alias && (
          <span className={styles.alias} title={`Internal name: ${remote.name}`}>
            → {remote.name}
          </span>
        )}
      </div>
      <div className={styles.entry}>
        <a
          href={remote.entry}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          title={remote.entry}
        >
          {remote.entry}
        </a>
      </div>
      {(remote.hostName || remote.loadedBy) && (
        <div className={styles.host}>
          {remote.loadedBy ? `Loaded by: ${remote.loadedBy}` : `Host: ${remote.hostName}`}
        </div>
      )}
    </div>
  );
};
