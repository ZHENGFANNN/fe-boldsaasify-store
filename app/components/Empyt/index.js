import React from "react";
import GlobalContext from "../../[locale]/context";
import { InboxIcon } from "@/components/Icon";
import styles from "./index.module.scss";

export default function Empyt({ buttonProps }) {
  const { LANG } = React.useContext(GlobalContext);
  return (
    <div className={styles.container}>
      <InboxIcon width={100} height={100} aria-label="empty" />
      <p>{LANG["common.other.no_data"]}</p>
      {buttonProps ? <a href={buttonProps.href}>{buttonProps.text}</a> : null}
    </div>
  );
}
