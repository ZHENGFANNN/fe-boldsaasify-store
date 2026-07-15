"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import GlobalContext from "@/[locale]/context";
import { track } from "@/utils/analytics";
import Api from "@/components/Layout/api";
import { UserIcon } from "@/components/Icon";
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

function IconSignIn({ className }) {
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
      <path d="M10 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H8" />
    </svg>
  );
}

function IconUserPlus({ className }) {
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
      <circle cx="10" cy="8" r="4" />
      <path d="M2 20c0-3.3 3.6-6 8-6 1.4 0 2.7.3 3.8.8" />
      <path d="M19 14v6" />
      <path d="M16 17h6" />
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
        <UserIcon className={styles.triggerIcon} />
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
            <ul className={styles.menu}>
              <li
                className={styles.item}
                role="menuitem"
                onClick={() => go("/user/login")}
              >
                <IconSignIn className={styles.itemIcon} />
                <span className={styles.itemLabel}>
                  {LANG["common.nav.log_in"]}
                </span>
              </li>
              <li
                className={styles.item}
                role="menuitem"
                onClick={() => go("/user/register")}
              >
                <IconUserPlus className={styles.itemIcon} />
                <span className={styles.itemLabel}>
                  {LANG["common.nav.register"]}
                </span>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
