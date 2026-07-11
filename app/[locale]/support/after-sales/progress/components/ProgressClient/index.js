"use client";

import React from "react";
import Cookies from "js-cookie";
import styles from "../../page.module.scss";
import AfterSaleInfo from "@/[locale]/user/account/components/AfterSaleInfo";
import AuthRedirectGuard from "@/components/AuthRedirectGuard";
import Loading from "@/components/Loading";

// 文案兜底：语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

export default function ProgressClient({ LANG }) {
  const [isLogin, setIsLogin] = React.useState(null);

  // cookie 仅挂载后可读（SSR 无 window），故在 effect 内同步 setState。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setIsLogin(!!Cookies.get("token"));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLogin === null) {
    return <Loading height={400} />;
  }

  if (!isLogin) {
    return <AuthRedirectGuard LANG={LANG} />;
  }

  return (
    <>
      <div className={styles.hero}>
        <h1>
          {T(
            LANG,
            "user_account.after_sale.progress_page_title",
            "Track Your After-Sales Requests"
          )}
        </h1>
        <p>
          {T(
            LANG,
            "user_account.after_sale.progress_page_desc",
            "View the status and history of all your after-sales requests here."
          )}
        </p>
      </div>

      <AfterSaleInfo LANG={LANG} />
    </>
  );
}
