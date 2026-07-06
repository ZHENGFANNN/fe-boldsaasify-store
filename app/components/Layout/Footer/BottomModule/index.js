"use client";

import React from "react";
import GlobalContext from "@/[locale]/context";

import Skeleton from "@/components/Skeleton";
import { countryMap } from "@/config/marketSettings";

import styles from "./index.module.scss";

const FULLYEAR = new Date().getFullYear();

function ShowLanguageItem() {
  const { area, areaReady, showAreaModal } = React.useContext(GlobalContext);
  const resolvedArea = area || "us";

  if (!areaReady) {
    return (
      <div className={styles.show_item} aria-hidden="true">
        <Skeleton variant="circular" className={styles.area_loading_flag} />
        <Skeleton variant="text" className={styles.area_loading_text} />
      </div>
    );
  }

  return (
    <div
      className={styles.show_item}
      data-event="FooterArea"
      onClick={() => {
        showAreaModal();
      }}
    >
      <img
        className={styles.icon}
        alt={resolvedArea}
        src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/flags/${resolvedArea}.svg`}
      />
      <div>{`${countryMap[resolvedArea]?.country} (${countryMap[resolvedArea]?.currency_symbol}${countryMap[resolvedArea]?.currency})`}</div>
    </div>
  );
}

export default function BottomModule() {
  const { CONFIG, LANG } = React.useContext(GlobalContext);
  return (
    <section className={styles.footer}>
      <div className={styles.footer_container}>
        <div className={styles.footer_copyright}>
          Copyright &copy; <time dateTime={FULLYEAR}>{FULLYEAR}</time>
          {` ${CONFIG["common.base"]?.company_name} `}
          {LANG["common.footer.right_reserved"]}
        </div>
        <div className={styles.footer_filing}>
          <ShowLanguageItem />
        </div>
      </div>
    </section>
  );
}
