/** @format */

"use client";
import React from "react";
import styles from "./index.module.scss";
import Link from "next/link";

export default function BaseLayout({ children, BLOG, sortKey }) {
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
            Blog
          </a>
          {BLOG.length > 1 ? (
            <div className={styles.right_content}>
              <div
                ref={arrowRef}
                onClick={() => setActiveMobNav((state) => !state)}
                className={styles.arrow_icon}
              ></div>
              <div className={styles.blog_sort_list}>
                <Link
                  href="/blog"
                  className={styles.blog_sort_item}
                  data-active={!sortKey}
                >
                  All
                </Link>
                {BLOG.map((item, index) => {
                  return (
                    <Link
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
      {children}
    </>
  );
}
