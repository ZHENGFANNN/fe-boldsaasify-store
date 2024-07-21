import React from "react";
import styles from "./index.module.scss";
import { formateTime } from "@/app/[locale]/blog/utils";
import { headers } from "next/headers";
import ShareIconList from "@/components/ShareIconList";

export default function ArticleInfo({ article, sort, locale }) {
  const headersList = headers();
  const currentUrl = headersList.get("x-request-url");
  return (
    <div className={styles.container}>
      <div className={styles.left_container}>
        <div className={styles.time}>
          {formateTime({ time: article.created_time, locale })}
        </div>
        <div className={styles.nav}>
          <a href="/blog">Home</a>
          <span>{` > `}</span>
          <a href={`/blog/${sort.key}`}>{sort.name}</a>
        </div>
      </div>
      <div className={styles.right_container}>
        <ShareIconList url={currentUrl} text={article.title} />
      </div>
    </div>
  );
}
