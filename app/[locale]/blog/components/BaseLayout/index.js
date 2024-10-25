/** @format */

"use client";
import React from "react";
import styles from "./index.module.scss";
import Link from "next/link";

export default function BaseLayout({ blogSortList, sortKey, LANG }) {
  const [activeMobNav, setActiveMobNav] = React.useState(false);
  const arrowRef = React.useRef(null);

  React.useEffect(() => {
    function clickEvent(e) {
      if (!arrowRef.current?.contains(e.target)) {
        setActiveMobNav(false);
      }
    }
    window.addEventListener("click", clickEvent);
    return () => window.removeEventListener("click", clickEvent);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = activeMobNav ? "hidden" : "auto";
  }, [activeMobNav]);
  return (
    <>
      <div className={styles.header_container} data-active-nav={activeMobNav}>
        <div className={styles.header}>
          <a className={styles.left_content} href="/blog">
            {LANG["store.blog_index.title"]}
          </a>
          {blogSortList.length > 1 ? (
            <div className={styles.right_content}>
              <div
                ref={arrowRef}
                onClick={() => setActiveMobNav((state) => !state)}
                className={styles.arrow_icon}
              ></div>
              <div className={styles.blog_sort_list}>
                <Link
                  scroll={true}
                  href="/blog"
                  className={styles.blog_sort_item}
                  data-active={!sortKey}
                >
                  {LANG["store.blog_index.all"]}
                </Link>
                {blogSortList.map((item, index) => {
                  return (
                    <Link
                      scroll={true}
                      href={`/blog/${item.key}`}
                      className={styles.blog_sort_item}
                      data-active={sortKey === item.key}
                      key={index}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
