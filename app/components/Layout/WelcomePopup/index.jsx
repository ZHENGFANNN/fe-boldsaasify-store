/** @format */
"use client";

import React from "react";
import ReactDOM from "react-dom";
import GlobalContext from "@/[locale]/context";

import { isEmail } from "@/utils/pattern";
import Api from "@/components/Layout/api";
import {
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
} from "@/utils/discount-codes";
import styles from "./index.module.scss";

const STORAGE_KEY_SHOWN = "welcome_popup_shown";
const SHOW_DELAY_MS = 5000;

// 商家在 ERP 创建对应 code 后，把码值写到环境变量 NEXT_PUBLIC_WELCOME_DISCOUNT_CODE。
// 默认 'WELCOME10'。当字段为空时不展示码（仅展示订阅成功）。
const WELCOME_CODE = (process.env.NEXT_PUBLIC_WELCOME_DISCOUNT_CODE || "WELCOME10").trim();

// 把 Welcome 折扣码写入购物车共享 localStorage，购物车/结算页自动应用。
function autoApplyWelcomeCode(code) {
  if (!code) return;
  try {
    const existing = readStoredDiscountCodes();
    if (existing.includes(code)) return;
    writeStoredDiscountCodes([...existing, code]);
  } catch {}
}

export default function WelcomePopup() {
  const { LANG, locale, area } = React.useContext(GlobalContext);
  const [show, setShow] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [stage, setStage] = React.useState("form"); // "form" | "success"
  const [error, setError] = React.useState("");

  // 仅首次访问展示：localStorage 记不再弹。延迟 5s 出现，给用户先看页面体验。
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY_SHOWN) === "1") return;
    } catch {
      return;
    }
    const t = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const closePopup = React.useCallback(() => {
    setShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY_SHOWN, "1");
    } catch {}
  }, []);

  const onSubscribe = React.useCallback(async () => {
    if (!email) return;
    if (!isEmail.exec(email)) {
      setError(LANG?.["common.footer.email_error"] || "Invalid email");
      return;
    }
    try {
      const data = await Api.contactForm({
        type: "subscribe",
        email,
        path: typeof window !== "undefined" ? location.pathname : "",
        language: locale,
        area,
        content: "welcome_popup",
      });
      if (data?.code !== 0) throw new Error("subscribe failed");
      // 订阅成功：自动应用 Welcome 折扣码（购物车/结算页共用 localStorage）。
      if (WELCOME_CODE) autoApplyWelcomeCode(WELCOME_CODE);
      setStage("success");
      setError("");
    } catch (e) {
      setError(LANG?.["common.footer.subscribe_error"] || "Subscribe failed, please retry.");
    }
  }, [email, locale, area, LANG]);

  if (!show || typeof document === "undefined") return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={closePopup}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          aria-label="Close"
          onClick={closePopup}
        >
          ×
        </button>
        {stage === "form" ? (
          <>
            <h2 className={styles.title}>
              {LANG?.["common.welcome.title"] || "Welcome — Get 10% Off"}
            </h2>
            <p className={styles.subtitle}>
              {LANG?.["common.welcome.subtitle"] ||
                "Subscribe to our newsletter and unlock a special discount on your first order."}
            </p>
            <div className={styles.row}>
              <input
                type="email"
                value={email}
                placeholder={
                  LANG?.["common.footer.email_placeholder"] || "Your email"
                }
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSubscribe();
                  }
                }}
              />
              <button type="button" onClick={onSubscribe} disabled={!email}>
                {LANG?.["common.welcome.subscribe"] || "Subscribe"}
              </button>
            </div>
            {error ? <div className={styles.error}>{error}</div> : null}
            <div className={styles.skip} onClick={closePopup}>
              {LANG?.["common.welcome.skip"] || "No thanks"}
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.title}>
              {LANG?.["common.welcome.success_title"] || "You're In!"}
            </h2>
            <p className={styles.subtitle}>
              {LANG?.["common.welcome.success_subtitle"] ||
                "Use this code at checkout — we've also added it to your cart."}
            </p>
            {WELCOME_CODE ? (
              <div className={styles.code_box}>
                <span className={styles.code}>{WELCOME_CODE}</span>
              </div>
            ) : null}
            <button
              type="button"
              className={styles.cta}
              onClick={closePopup}
            >
              {LANG?.["common.welcome.start_shopping"] || "Start Shopping"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
