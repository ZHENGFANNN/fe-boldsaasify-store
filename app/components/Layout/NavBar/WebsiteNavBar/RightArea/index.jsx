"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";

import Skeleton from "@/components/Skeleton";
import { CartIcon, GlobalIcon } from "@/components/Icon";
import UserMenu from "./UserMenu";
import styles from "./index.module.scss";
import { useAuthGate } from "@/components/Auth/AuthGateContext";

export default function RightArea() {
  const { productNum, area, areaReady, showCartModal, showAreaModal } =
    React.useContext(GlobalContext);
  const resolvedArea = area || "us";

  // 登录态改为消费全局 AuthGateContext：挂载后按 cookie 判定，且监听 auth:session-expired，
  // token 失效（axios 收到 10014 / verifyLogin 判 invalid）时 authed 翻 false，
  // 用户菜单同步从「Welcome back」变回「Log in / Register」。
  // authed===null（SSG 首帧未判定）按未登录渲染，与原先初始 false 行为一致。
  const { authed } = useAuthGate();
  const isLogin = authed === true;

  return (
    <ul className={styles.header_right}>
      {/* 国家ICON */}
      <li
        className={styles.header_country}
        data-event={areaReady ? "NavIcon-Area" : undefined}
        onClick={
          areaReady
            ? () => {
                showAreaModal();
              }
            : undefined
        }
        aria-busy={!areaReady}
      >
        {areaReady ? (
          <GlobalIcon
            className={styles.svg_icon}
            width={20}
            height={20}
            aria-label={resolvedArea}
          />
        ) : (
          <Skeleton variant="circular" className={styles.country_loading} />
        )}
      </li>
      {/* 购物车ICON */}
      <li
        className={styles.header_cart}
        data-event="NavIcon-Cart"
        onClick={() => {
          showCartModal();
        }}
      >
        <div>
          {productNum !== 0 ? (
            <div className={styles.num}>{productNum}</div>
          ) : null}
          <CartIcon className={styles.svg_icon} />
        </div>
      </li>
      {/* 用户ICON */}
      <li className={styles.header_user}>
        <UserMenu isLogin={isLogin} />
      </li>
    </ul>
  );
}
