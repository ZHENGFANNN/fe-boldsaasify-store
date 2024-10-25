/** @format */

"use client";

import React from "react";
import ProductContext from "../../ProductContext";
import styles from "./index.module.scss";
import "@/styles/richtext.scss";

export default function GoodContent() {
  const {
    productInfo: { content },
  } = React.useContext(ProductContext);

  const hide = React.useMemo(() => {
    return content?.replace(/<[^>]+>/g, "").trim().length < 1;
  }, [content]);

  if (hide) return null;

  return (
    <div className={styles.container}>
      <div
        className="wangeditor-rich-text-css"
        dangerouslySetInnerHTML={{
          __html: content,
        }}
      ></div>
    </div>
  );
}
