/** @format */

import Skeleton from "@/components/Skeleton";

import styles from "./index.module.scss";

export default function ComboListSkeleton() {
  return (
    <div className={styles.container} aria-hidden="true">
      <Skeleton variant="rect" className={styles.combo_title} />
      <div className={styles.list} style={{ marginTop: 16 }}>
        <Skeleton variant="rect" className={styles.combo_block} />
      </div>
    </div>
  );
}
