"use client";
import React from "react";

import RightArea from "./RightArea";
import LeftArea from "./LeftArea";

import styles from "./index.module.scss";

export default function WebsiteNavBar() {
  const [navActive, setNavActive] = React.useState(false);
  return (
    <>
      {/* 网页导航栏 */}
      <nav className={styles.nav}>
        <div className={styles.header + ` ${navActive ? styles.active : ""}`}>
          {/* 左边区域 */}
          <LeftArea navActive={navActive} setNavActive={setNavActive} />
          {/* 右边区域 */}
          <RightArea />
        </div>
      </nav>
    </>
  );
}
