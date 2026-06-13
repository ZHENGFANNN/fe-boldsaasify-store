/** @format */

import Skeleton from "@/components/Skeleton";

import styles from "./index.module.scss";

export default function BtnListSkeleton() {
  return (
    <div className={styles.container} aria-hidden="true">
      <Skeleton variant="rect" className={styles.btn_loading} />
    </div>
  );
}
