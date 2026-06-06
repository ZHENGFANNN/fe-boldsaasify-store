"use client";

import React from "react";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";
import { useSearchParams } from "next/navigation";
import styles from "../../page.module.scss";

import AddressInfo from "../AddressList";
import OrderInfo from "../OrderInfo";
import AccountInfo from "../AccountInfo";

export default function Main({ LANG }) {
  const searchType = useSearchParams().get("type");
  const tipRef = React.useRef();
  const [type, setType] = React.useState(searchType ?? "accountInfo");
  const showTip = React.useCallback(
    ({ text, type }) => {
      tipRef.current.show({ text, type });
    },
    [searchType]
  );
  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <div
          className={`${styles.item} ${
            type === "accountInfo" ? styles.active : ""
          }`}
          onClick={() => {
            setType("accountInfo");
          }}
        >
          <img
            alt="avatar-icon"
            className={styles.img_container}
            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-user.svg`}
          />
          <span>{LANG["user_account.account_info"]}</span>
        </div>
        <div
          className={`${styles.item} ${
            type === "addressInfo" ? styles.active : ""
          }`}
          onClick={() => {
            setType("addressInfo");
          }}
        >
          <img
            alt="address"
            className={styles.img_container}
            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-address.svg`}
          />
          <span>{LANG["user_account.shipping_address"]}</span>
        </div>
        <div
          className={`${styles.item} ${
            type === "orderInfo" ? styles.active : ""
          }`}
          onClick={() => {
            setType("orderInfo");
          }}
        >
          <img
            alt="order"
            className={styles.img_container}
            src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-order.svg`}
          />
          <span>{LANG["user_account.my_order"]}</span>
        </div>
      </div>
      <div className={styles.content}>
        {type === "accountInfo" ? (
          <>
            <div>
              <AccountInfo
                LANG={LANG}
                showTip={({ text, type }) => {
                  showTip({ text, type });
                }}
              />
            </div>
          </>
        ) : null}
        {type === "addressInfo" ? (
          <>
            <div>
              <AddressInfo
                LANG={LANG}
                showTip={({ text, type }) => {
                  showTip({ text, type });
                }}
              />
            </div>
          </>
        ) : null}
        {type === "orderInfo" ? (
          <>
            <div>
              <OrderInfo
                LANG={LANG}
                showTip={({ text, type }) => {
                  showTip({ text, type });
                }}
              />
            </div>
          </>
        ) : null}
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
