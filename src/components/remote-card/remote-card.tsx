import React from "react";
import styles from "./remote-card.module.scss";
import type { RemoteInfo } from "../popup/popup";

type RemoteCardProps = {
  remote: RemoteInfo;
};

export const RemoteCard: React.FC<RemoteCardProps> = ({ remote }) => {
  const displayName = remote.alias || remote.name;
  const ownerLabel = remote.loadedBy ? `Loaded by ${remote.loadedBy}` : `Host ${remote.hostName}`;

  return (
    <article className={styles.card} aria-label={`Remote ${displayName}`}>
      <div className={styles.header}>
        <h4 className={styles.name}>{displayName}</h4>
        {remote.alias && (
          <span className={styles.alias} title={`Internal name: ${remote.name}`}>
            Internal id: {remote.name}
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
          aria-label={`Open remote entry URL for ${displayName}`}
        >
          {remote.entry}
        </a>
      </div>
      {(remote.hostName || remote.loadedBy) && (
        <div className={styles.host} aria-label={ownerLabel}>
          {ownerLabel}
        </div>
      )}
    </article>
  );
};
