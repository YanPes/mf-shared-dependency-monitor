import styles from "./sync-badge.module.scss";

type SyncBadgeProps = {
    isInSync: boolean;
}

export const SyncBadge = ({isInSync}: SyncBadgeProps) => {
    return (
        <div className={`${styles.syncBadge} ${isInSync ? styles.inSync : styles.outOfSync}`}>{isInSync ? "In Sync" : "Out of Sync"}</div>
    )
}