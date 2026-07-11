"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";

import Skeleton from "@/components/Skeleton";
import UserMenu from "./UserMenu";
import styles from "./index.module.scss";
import Cookies from "js-cookie";

export default function RightArea() {
  const { productNum, area, areaReady, showCartModal, showAreaModal } =
    React.useContext(GlobalContext);
  const resolvedArea = area || "us";

  const [isLogin, setIsLogin] = React.useState(false);
  React.useEffect(() => {
    const token = Cookies.get("token");
    setIsLogin(!!token);
  }, []);

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
          <img
            alt={resolvedArea}
            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/flags/${resolvedArea}.svg`}
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
          <img
            alt="avatar"
            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-cart.svg`}
          />
        </div>
      </li>
      {/* 用户ICON */}
      <li className={styles.header_user}>
        <UserMenu isLogin={isLogin} />
      </li>
    </ul>
  );
}
