import React from "react";
import GlobalContext from "../../[locale]/context";
import styles from "./index.module.scss";

export default function Empyt({ buttonProps }) {
  const { LANG } = React.useContext(GlobalContext);
  return (
    <div className={styles.container}>
      <img
        width={100}
        height={100}
        alt="empyt"
        src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-utils-empyt.svg`}
      />
      <p>{LANG["common.other.no_data"]}</p>
      {buttonProps ? <a href={buttonProps.href}>{buttonProps.text}</a> : null}
    </div>
  );
}
