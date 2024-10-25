/** @format */

import styles from "./index.module.scss";
import { formateTime } from "../../utils";
import Link from "next/link";

export default function ArticleCard({ item, locale }) {
  return (
    <Link
      scroll={true}
      href={`/blog/${item.sort_key}/${item.key}`}
      className={styles.card}
    >
      <div className={styles.img_wrapper}>
        <img src={item.image} alt={item.title} />
      </div>
      <h3 className={styles.article_title}>{item.title}</h3>
      <div className={styles.article_info}>
        <div className={styles.article_info_time}>
          {formateTime({ time: item.updated_time, locale })}
        </div>
      </div>
    </Link>
  );
}
