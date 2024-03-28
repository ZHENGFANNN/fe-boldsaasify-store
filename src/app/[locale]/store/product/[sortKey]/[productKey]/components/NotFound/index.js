"use client";

import React from "react";
import { useRouter } from "next/navigation";
import styles from "./index.module.scss";

export default function NotFound({ LANG }) {
  const [secord, setSecord] = React.useState(10);
  const router = useRouter();
  React.useEffect(() => {
    const t = setInterval(() => {
      setSecord((old) => {
        if (old < 2) {
          clearInterval(t);
          router.replace("/");
        }
        return old - 1;
      });
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [router]);

  const htmlContext = React.useMemo(() => {
    return LANG["common.not_found.navigator_link"]
      ?.split("${second}")
      .join(`<span class=${styles.secord}>${secord}</span>`);
  }, [secord, LANG]);

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
