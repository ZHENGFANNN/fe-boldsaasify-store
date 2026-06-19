"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";
export default function ContactModal({ item, styles, LANG }) {
  const { showContactModal } = React.useContext(GlobalContext);
  return (
    <div
      className={styles.content_row_description + " " + styles.blue}
      onClick={showContactModal}
    >
      {LANG["www.company_contact.click_view"]}
    </div>
  );
}
