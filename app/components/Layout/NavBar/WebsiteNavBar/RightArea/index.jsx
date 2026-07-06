"use client";
import React from "react";
import { useRouter } from "next/navigation";
import GlobalContext from "@/[locale]/context";
import { track } from "@/utils/analytics";

import Skeleton from "@/components/Skeleton";
import DropSelect from "@/components/DropSelect";
import Api from "@/components/Layout/api";
import styles from "./index.module.scss";
import Cookies from "js-cookie";

export default function RightArea() {
  const router = useRouter();
  const { LANG, productNum, area, areaReady, showCartModal, showAreaModal } =
    React.useContext(GlobalContext);
  const resolvedArea = area || "us";

  const [isLogin, setIsLogin] = React.useState(false);
  React.useEffect(() => {
    const token = Cookies.get("token");
    setIsLogin(!!token);
  }, []);

  return (
    <ul className={styles.header_right}>
      {/* 用户ICON */}
      <li className={styles.header_user}>
        <DropSelect
          options={
            isLogin
              ? [
                  {
                    label: LANG["common.nav.my_account"],
                    value: "account",
                  },
                  {
                    label:
                      LANG["common.nav.after_sale"] || "After-Sales Service",
                    value: "after_sale",
                  },
                  {
                    label: LANG["common.nav.sign_out"],
                    value: "loginOut",
                  },
                ]
              : [
                  {
                    label: LANG["common.nav.log_in"],
                    value: "login",
                  },
                  {
                    label: LANG["common.nav.register"],
                    value: "register",
                  },
                ]
          }
          tanslatefromX={-4}
          position="bottom"
          selectValue={async (e) => {
            track("NavIcon-User");
            if (e === "loginOut") {
              Api.loginOut();
              Cookies.remove("token");
              location.href = "/";
            } else if (e === "after_sale") {
              router.push(`/user/account?type=afterSaleInfo`);
            } else {
              router.push(`/user/${e}`);
            }
          }}
        >
          <img
            alt="avatar"
            width={24}
            height={24}
            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-user.svg`}
          />
        </DropSelect>
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
    </ul>
  );
}
