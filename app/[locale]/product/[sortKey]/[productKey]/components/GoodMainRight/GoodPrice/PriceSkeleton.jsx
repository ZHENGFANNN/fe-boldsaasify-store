/** @format */

import Skeleton from "@/components/Skeleton";

import styles from "./PriceSkeleton.module.scss";

export default function PriceSkeleton() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <Skeleton variant="rect" className={styles.price} />
      <Skeleton variant="rect" className={styles.priceSub} />
    </div>
  );
}
