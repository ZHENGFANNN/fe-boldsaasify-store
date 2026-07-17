"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import GlobalContext from "@/[locale]/context";
import { track } from "@/utils/analytics";
import Api from "@/components/Layout/api";
import { UserIcon } from "@/components/Icon";
import { defaultLocale } from "@/config/languageSettings";
import verifyLogin from "@/utils/verifyLogin";
import styles from "./index.module.scss";

// 账号胶囊展示脱敏：邮箱保留首 2 位本地名 + 域名，手机保留前 3 后 4。
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email || "";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0] || ""}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};
const maskPhone = (phone) => {
  if (!phone) return "";
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
};

function IconAddress({ className }) {
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
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
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
  const { LANG, locale } = React.useContext(GlobalContext);
  const [open, setOpen] = React.useState(false);
  const [accountLabel, setAccountLabel] = React.useState("");

  // LANG 兜底：新增项若命名空间无 key，回退英文
  const t = (key, fallback) => (LANG && LANG[key]) || fallback;

  // 已登录时拉一次用户信息，把邮箱/手机号显示在抽屉顶部（图1参考样式）。
  // 未登录清空；避免登出后残留上一次账号。
  React.useEffect(() => {
    let cancelled = false;
    if (!isLogin) {
      setAccountLabel("");
      return;
    }
    verifyLogin().then((r) => {
      if (cancelled || r.status !== "ok" || !r.data) return;
      // 优先用后端返回的脱敏值，否则本地脱敏；邮箱/手机都不暴露完整明文。
      const label =
        r.data.email_masked ||
        (r.data.email ? maskEmail(r.data.email) : "") ||
        r.data.phone_masked ||
        (r.data.phone ? maskPhone(r.data.phone) : "") ||
        r.data.nickname ||
        "";
      setAccountLabel(label);
    });
    return () => {
      cancelled = true;
    };
  }, [isLogin]);

  const go = (path) => {
    track("NavIcon-User");
    setOpen(false);
    const href =
      locale && locale !== defaultLocale ? `/${locale}${path}` : path;
    router.push(href);
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
                {/* <span className={styles.accountIconBox}>
                  <UserIcon className={styles.accountIcon} />
                </span> */}
                <span
                  className={styles.accountText}
                  title={accountLabel || undefined}
                >
                  {accountLabel}
                </span>
              </div>

              <ul className={styles.menu}>
                <li
                  className={styles.item}
                  role="menuitem"
                  onClick={() => go("/user/account")}
                >
                  <UserIcon className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {t("common.nav.my_account", "My Account")}
                  </span>
                </li>
                <li
                  className={styles.item}
                  role="menuitem"
                  onClick={() => go("/user/account/address")}
                >
                  <IconAddress className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {t("user_account.shipping_address", "Address")}
                  </span>
                </li>
                <li
                  className={styles.item}
                  role="menuitem"
                  onClick={() => go("/user/account/order")}
                >
                  <IconOrder className={styles.itemIcon} />
                  <span className={styles.itemLabel}>
                    {t("user_account.my_order", "Orders")}
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
