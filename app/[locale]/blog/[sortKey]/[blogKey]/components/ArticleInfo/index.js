import React from "react";
import styles from "./index.module.scss";
import { formateTime } from "../../../../utils";
import { headers } from "next/headers";
import ShareIconList from "../../../../../../components/ShareIconList";

export default async function ArticleInfo({ article, locale }) {
  const headersList = await headers();
  const currentUrl = headersList.get("x-request-url");
  return (
    <div className={styles.container}>
      <div className={styles.left_container}>
        <div className={styles.time}>
          {formateTime({ time: article.updated_time, locale })}
        </div>
        <div className={styles.nav}>
          <a href="/blog">Home</a>
          <span>{` > `}</span>
          <a href={`/blog/${article.blogSortInfo.key}`}>
            {article.blogSortInfo.name}
          </a>
        </div>
      </div>
      <div className={styles.right_container}>
        <ShareIconList url={currentUrl} text={article.title} />
      </div>
    </div>
  );
}
