/** @format */

import styles from "./PriceSkeleton.module.scss";

export default function PriceSkeleton() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.block} />
      <div className={`${styles.block} ${styles.blockWide}`} />
    </div>
  );
}
