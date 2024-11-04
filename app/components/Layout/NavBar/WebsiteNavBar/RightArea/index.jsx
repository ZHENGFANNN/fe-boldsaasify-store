"use client";
import React from "react";
import { useRouter } from "next/navigation";
import GlobalContext from "@/[locale]/context";
import { trackingCustomClick } from "@/utils";

import DropSelect from "@/components/DropSelect";
import Api from "@/components/Layout/api";
import styles from "./index.module.scss";

export default function RightArea() {
  const router = useRouter();
  const { LANG, userInfo, productNum, area, showCartModal, showAreaModal } =
    React.useContext(GlobalContext);
  return (
    <ul className={styles.header_right}>
      {/* 用户ICON */}
      <li className={styles.header_user}>
        <DropSelect
          options={
            userInfo
              ? [
                  {
                    label: LANG["common.nav.my_account"],
                    value: "account",
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
            trackingCustomClick({ click_type: `NavIcon-User` });
            if (e === "loginOut") {
              Api.loginOut();
              location.reload();
            } else {
              router.push(`/user/${e}`);
            }
          }}
        >
          <img
            alt="avatar"
            width={24}
            height={24}
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-user.svg`}
          />
        </DropSelect>
      </li>
      {/* 购物车ICON */}
      <li
        className={styles.header_cart}
        onClick={() => {
          trackingCustomClick({ click_type: `NavIcon-Cart` });
          showCartModal();
        }}
      >
        <div>
          {productNum !== 0 ? (
            <div className={styles.num}>{productNum}</div>
          ) : null}
          <img
            alt="avatar"
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/min-cart.svg`}
          />
        </div>
      </li>
      {/* 国家ICON */}
      <li
        className={styles.header_country}
        onClick={() => {
          showAreaModal();
          trackingCustomClick({ click_type: `NavIcon-Area` });
        }}
      >
        <img
          alt={area}
          src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/flags/${area}.svg`}
        />
      </li>
    </ul>
  );
}
