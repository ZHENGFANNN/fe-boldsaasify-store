"use client";

import React from "react";
import ShowTipModal from "../../../../../components/Modal/ShowTipModal";
import styles from "../../page.module.scss";

import AddressInfo from "../AddressList";
import OrderInfo from "../OrderInfo";
import AccountInfo from "../AccountInfo";

export default function Main({ LANG, locale }) {
  const tipRef = React.useRef();
  // type 来自 URL query，改为挂载后从 window 读取，避免 useSearchParams 触发
  // cacheComponents 的「非缓存数据需 Suspense」约束，使本页可整页静态化。
  const [type, setType] = React.useState("accountInfo");
  React.useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    if (t) setType(t);
  }, []);
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current.show({ text, type });
  }, []);
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
                locale={locale}
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
