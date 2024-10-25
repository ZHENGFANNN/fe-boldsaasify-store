"use client";

import React from "react";
import styles from "./main.module.scss";

export default function Main({ LANG }) {
  const [second, setSecond] = React.useState(10);
  React.useEffect(() => {
    const t = setInterval(() => {
      setSecond((old) => {
        if (old < 2) {
          clearInterval(t);
          location.href = "/";
        }
        return old - 1;
      });
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, []);

  const htmlContext = React.useMemo(() => {
    return LANG["common.not_found.navigator_link"]
      ?.split("${second}")
      .join(`<span class=${styles.second}>${second}</span>`);
  }, [second, LANG]);
  return (
    <div className={styles.container}>
      <h1>404</h1>
      <h2>{LANG["common.not_found.content_title"]}</h2>
      <p
        dangerouslySetInnerHTML={{
          __html: htmlContext,
        }}
      ></p>
    </div>
  );
}
