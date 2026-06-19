"use client";

import React from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import styles from "../../page.module.scss";
import AfterSaleInfo from "@/[locale]/user/account/components/AfterSaleInfo";

const T = (LANG, key, fallback) => LANG?.[key] || fallback;

export default function AfterSaleClient({ LANG }) {
  const [isLogin, setIsLogin] = React.useState(null);

  React.useEffect(() => {
    setIsLogin(!!Cookies.get("token"));
  }, []);

  const features = [
    {
      title: T(LANG, "user_account.after_sale.type.return", "Return"),
      desc: T(
        LANG,
        "user_account.after_sale.feature.return",
        "Not satisfied? Request a return."
      ),
    },
    {
      title: T(LANG, "user_account.after_sale.type.refund", "Refund"),
      desc: T(
        LANG,
        "user_account.after_sale.feature.refund",
        "Get your money back."
      ),
    },
    {
      title: T(LANG, "user_account.after_sale.type.exchange", "Exchange"),
      desc: T(
        LANG,
        "user_account.after_sale.feature.exchange",
        "Swap for another item."
      ),
    },
    {
      title: T(LANG, "user_account.after_sale.type.repair", "Repair"),
      desc: T(
        LANG,
        "user_account.after_sale.feature.repair",
        "Lifetime care for your jewelry."
      ),
    },
  ];

  return (
    <>
      <div className={styles.hero}>
        <h1>{T(LANG, "user_account.after_sale", "After-Sales Service")}</h1>
        <p>
          {T(
            LANG,
            "user_account.after_sale.intro",
            "We stand behind every piece. Submit a return, refund, exchange or repair request and our team will take care of the rest."
          )}
        </p>
      </div>

      <div className={styles.features}>
        {features.map((f, i) => (
          <div key={i} className={styles.feature}>
            <div className={styles.feature_title}>{f.title}</div>
            <div className={styles.feature_desc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {isLogin === null ? null : isLogin ? (
        <AfterSaleInfo LANG={LANG} />
      ) : (
        <div className={styles.login_cta}>
          <p>
            {T(
              LANG,
              "user_account.after_sale.login_tip",
              "Please log in to submit and track your after-sales requests."
            )}
          </p>
          <Link href="/user/login?redirect=/support/after-sale">
            {T(LANG, "common.nav.log_in", "Log In")}
          </Link>
        </div>
      )}
    </>
  );
}
