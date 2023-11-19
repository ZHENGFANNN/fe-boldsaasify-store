import styles from "./index.module.scss";
import React from "react";
import getAllConfigData from "@/utils/getAllConfigData";

export default async function Empyt({ buttonProps }) {
  const { LANG } = await getAllConfigData();
  return (
    <div className={styles.container}>
      <img
        width={100}
        height={100}
        alt="empyt"
        src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-utils-empyt.svg`}
      />
      <p>{LANG["common.other.no_data"]}</p>
      {buttonProps ? (
        <a href={buttonProps.href} rel="noreferrer" target="_blank">
          {buttonProps.text}
        </a>
      ) : null}
    </div>
  );
}
