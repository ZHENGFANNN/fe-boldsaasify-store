"use client";

import React from "react";

import { countryMap } from "@/config/marketSettings";
import Skeleton from "@/components/Skeleton";
import useArea from "@/hooks/useArea";

import Modal from "./Modal";
import styles from "./index.module.scss";

function CountryList({ children }) {
  const { area, areaReady } = useArea();
  const areaModalRef = React.useRef(null);
  const resolvedArea = area || "us";

  const countryText = React.useMemo(() => {
    return `${countryMap[resolvedArea]?.country} (${countryMap[resolvedArea]?.currency_symbol}${countryMap[resolvedArea]?.currency})`;
  }, [resolvedArea]);

  if (!areaReady) {
    return (
      <div className={styles.input_item} aria-hidden="true">
        <span className={styles.area_loading}>
          <Skeleton variant="circular" className={styles.area_loading_flag} />
          <Skeleton variant="text" className={styles.area_loading_text} />
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={styles.input_item}
        onClick={() => areaModalRef.current.show()}
      >
        {children ? (
          React.cloneElement(children, { value: countryText })
        ) : (
          <>
            <img
              className={styles.icon}
              alt={resolvedArea}
              src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/flags/${resolvedArea}.svg`}
            />
            <div>{countryText}</div>
          </>
        )}
      </div>
      <Modal ref={areaModalRef} />
    </>
  );
}

export default CountryList;
