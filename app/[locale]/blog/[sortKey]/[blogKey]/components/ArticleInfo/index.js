import React from "react";
import styles from "./index.module.scss";
import { formateTime } from "../../../../utils";
import ShareIconList from "../../../../../../components/ShareIconList";
import Link from "next/link";

export default function ArticleInfo({ article, locale }) {
  return (
    <div className={styles.container}>
      <div className={styles.left_container}>
        <div className={styles.time}>
          {formateTime({ time: article.updated_time, locale })}
        </div>
        <div className={styles.nav}>
          <Link href="/blog">Home</Link>
          <span>{` > `}</span>
          <Link href={`/blog/${article.blogSortInfo.key}`}>
            {article.blogSortInfo.name}
          </Link>
        </div>
      </div>
      <div className={styles.right_container}>
        <ShareIconList text={article.title} />
      </div>
    </div>
  );
}
