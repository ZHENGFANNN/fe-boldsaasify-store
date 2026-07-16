"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { UserIcon, AddressIcon, ClipboardIcon } from "@/components/Icon";
import { defaultLocale } from "@/config/languageSettings";
import styles from "./index.module.scss";

// useSelectedLayoutSegment 返回 null 表示当前是父段本身（/user/account 主页），
// 返回 "address" / "order" 表示对应子路由，App Router 官方语义，无动态 API 副作用。
const SEGMENT_TO_KEY = {
  __root__: "accountInfo",
  address: "addressInfo",
  order: "orderInfo",
};

export default function SideNav({ LANG, locale }) {
  const segment = useSelectedLayoutSegment();
  const activeKey = SEGMENT_TO_KEY[segment ?? "__root__"] || "accountInfo";

  const buildHref = React.useCallback(
    (path) =>
      locale && locale !== defaultLocale ? `/${locale}${path}` : path,
    [locale]
  );

  const items = [
    {
      key: "accountInfo",
      href: buildHref("/user/account"),
      Icon: UserIcon,
      label: LANG["user_account.account_info"],
      aria: "account",
    },
    {
      key: "addressInfo",
      href: buildHref("/user/account/address"),
      Icon: AddressIcon,
      label: LANG["user_account.shipping_address"],
      aria: "address",
    },
    {
      key: "orderInfo",
      href: buildHref("/user/account/order"),
      Icon: ClipboardIcon,
      label: LANG["user_account.my_order"],
      aria: "order",
    },
  ];

  return (
    <nav className={styles.nav}>
      {items.map(({ key, href, Icon, label, aria }) => (
        <Link
          key={key}
          href={href}
          prefetch={false}
          className={`${styles.item} ${activeKey === key ? styles.active : ""}`}
          aria-current={activeKey === key ? "page" : undefined}
        >
          <Icon className={styles.img_container} aria-label={aria} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
