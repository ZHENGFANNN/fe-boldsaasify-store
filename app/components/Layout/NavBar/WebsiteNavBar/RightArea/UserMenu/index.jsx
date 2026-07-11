"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import GlobalContext from "@/[locale]/context";
import { track } from "@/utils/analytics";
import Api from "@/components/Layout/api";
import styles from "./index.module.scss";

/* 内联 SVG 图标（stroke=currentColor，随 hover 变色，不依赖远程文件） */
function IconUser({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

function IconOrder({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12l1.5 4H4.5L6 3Z" />
      <path d="M4.5 7h15v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7Z" />
      <path d="M9 12h6" />
    </svg>
  );
}

function IconSupport({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Z" />
      <path d="M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z" />
      <path d="M17 17v1a3 3 0 0 1-3 3h-2" />
    </svg>
  );
}

function IconSignOut({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 8l-4 4 4 4" />
      <path d="M6 12h10" />
    </svg>
  );
}

export default function UserMenu({ isLogin }) {
  const router = useRouter();
  const { LANG } = React.useContext(GlobalContext);
  const [open, setOpen] = React.useState(false);

  // LANG 兜底：新增项若命名空间无 key，回退英文
  const t = (key, fallback) => (LANG && LANG[key]) || fallback;

  const go = (path) => {
    track("NavIcon-User");
    setOpen(false);
    router.push(path);
  };

  const handleSignOut = () => {
    track("NavIcon-User");
    setOpen(false);
    Api.loginOut();
    Cookies.remove("token");
    location.href = "/";
  };

  return (
    <div
      className={styles.root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      data-role="user-menu"
    >
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={LANG["common.nav.my_account"]}
        onClick={() => setOpen((v) => !v)}
      >
        <img
          alt="account"
          width={24}
          height={24}
          src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-user.svg`}
        />
      </button>

      <div className={`${styles.dropdown} ${open ? styles.open : ""}`}>
        <div className={styles.card} role="menu">
          {isLogin ? (
            <>
              <div className={styles.account}>
                <span className={styles.avatar}>
                  <IconUser className={styles.avatarIcon} />
                </span>
                <span className={styles.accountText}>
                  <span className={styles.accountTitle}>
                    {t("common.nav.account_greeting", "Welcome back")}
                  </span>
                  <span className={styles.accountSub}>
                    {t("common.nav.account_subtitle", "Manage your account")}
                  </span>
                </span>
              </div>

              <ul className={styles.menu}>
                <li
                  className={styles.item}
                  role="menuitem"
                  onClick={() => go("/user/account")}
                >
                  <IconUser className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {LANG["common.nav.my_account"]}
                  </span>
                </li>
                <li
                  className={styles.item}
                  role="menuitem"
                  onClick={() => go("/user/account?type=orderInfo")}
                >
                  <IconOrder className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {t("common.nav.my_order", "My Orders")}
                  </span>
                </li>
                <li
                  className={styles.item}
                  role="menuitem"
                  onClick={() => go("/support/after-sales/progress")}
                >
                  <IconSupport className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {t("common.nav.after_sales", "After-Sales")}
                  </span>
                </li>
              </ul>

              <div className={styles.divider} />

              <ul className={styles.menu}>
                <li
                  className={`${styles.item} ${styles.danger}`}
                  role="menuitem"
                  onClick={handleSignOut}
                >
                  <IconSignOut className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {LANG["common.nav.sign_out"]}
                  </span>
                </li>
              </ul>
            </>
          ) : (
            <div className={styles.guest}>
              <p className={styles.guestTip}>
                {t(
                  "common.nav.guest_tip",
                  "Sign in to track orders and manage after-sales"
                )}
              </p>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => go("/user/login")}
              >
                {LANG["common.nav.log_in"]}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => go("/user/register")}
              >
                {LANG["common.nav.register"]}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
