import React from "react";
import styles from "./shared-deps-tab.module.scss";
import type { ExtractedSharedDep } from "../../extractor";

type SharedDepsTabProps = {
  sharedDeps: ExtractedSharedDep[];
};

export const SharedDepsTab: React.FC<SharedDepsTabProps> = ({ sharedDeps }) => {
  const mismatches = sharedDeps.filter((s) => s.hasMismatch);
  const inSync = sharedDeps.filter((s) => !s.hasMismatch);

  return (
    <div className={styles.tab}>
      {sharedDeps.length === 0 && (
        <p className={styles.empty}>No shared dependencies detected in the runtime.</p>
      )}
      {sharedDeps.length > 0 && (
        <>
          {mismatches.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitleMismatch}>
                Version mismatches ({mismatches.length})
              </h3>
              <p className={styles.hint}>
                Teams may need to align on these versions.
              </p>
              <ul className={styles.list}>
                {mismatches.map((dep) => (
                  <SharedDepCard key={dep.sharedName} dep={dep} isMismatch />
                ))}
              </ul>
            </div>
          )}
          {inSync.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitleOk}>
                In sync ({inSync.length})
              </h3>
              <ul className={styles.list}>
                {inSync.map((dep) => (
                  <SharedDepCard key={dep.sharedName} dep={dep} isMismatch={false} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function SharedDepCard({
  dep,
  isMismatch,
}: {
  dep: ExtractedSharedDep;
  isMismatch: boolean;
}) {
  return (
    <li className={`${styles.card} ${isMismatch ? styles.mismatch : styles.ok}`}>
      <div className={styles.name}>{dep.sharedName}</div>
      <div className={styles.versions}>
        {dep.versions.join(" ≠ ")}
      </div>
      <div className={styles.modules}>
        {dep.modules.map((u) => (
          <span key={`${u.moduleName}-${u.version}`} className={styles.module}>
            {u.moduleName}: {u.version}
          </span>
        ))}
      </div>
    </li>
  );
}
