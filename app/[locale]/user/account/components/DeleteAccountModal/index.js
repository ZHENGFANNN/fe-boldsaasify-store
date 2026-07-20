"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { defaultLocale } from "@/config/languageSettings";
import Api from "../../api";
import styles from "./index.module.scss";

// 账号注销弹窗：警告 + 注销协议链接 + 邮箱验证码(60s 冷却) + 二次确认。
// 提交成功=进入 15 天冷静期(期内重新登录即撤销)，由上层 onSuccess 处理登出。
export default function DeleteAccountModal({
  open,
  LANG,
  locale,
  onClose,
  onSuccess,
}) {
  const t = React.useCallback((k, f) => (LANG && LANG[k]) || f, [LANG]);
  const [code, setCode] = React.useState("");
  const [err, setErr] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // 关闭时重置输入/错误（放在回调里而非 effect，避免同步 setState-in-effect）。
  const close = React.useCallback(() => {
    setCode("");
    setErr("");
    onClose?.();
  }, [onClose]);

  const buildHref = (path) =>
    locale && locale !== defaultLocale ? `/${locale}${path}` : path;

  const handleSend = React.useCallback(async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    setErr("");
    try {
      const res = await Api.sendDeletionCode();
      if (res.code !== 0) throw new Error("code");
      setCooldown(60);
    } catch {
      setErr(
        t(
          "user_account.delete_account.send_fail",
          "Failed to send code. Please try again."
        )
      );
    } finally {
      setSending(false);
    }
  }, [sending, cooldown, t]);

  const errorByCode = React.useCallback(
    (c) => {
      switch (c) {
        case 10093:
          return t(
            "user_account.delete_account.active_order",
            "You have an order in progress and cannot delete your account yet."
          );
        case 10094:
          return t(
            "user_account.delete_account.active_ticket",
            "You have an after-sales request in progress and cannot delete your account yet."
          );
        case 10091:
          return t(
            "user_account.delete_account.code_invalid",
            "The code has expired. Please request a new one."
          );
        case 10092:
          return t(
            "user_account.delete_account.code_mismatch",
            "Incorrect verification code."
          );
        default:
          return t(
            "user_account.delete_account.fail",
            "Failed to submit. Please try again."
          );
      }
    },
    [t]
  );

  const handleConfirm = React.useCallback(async () => {
    if (submitting) return;
    if (!code.trim()) {
      setErr(
        t(
          "user_account.delete_account.code_required",
          "Please enter the verification code."
        )
      );
      return;
    }
    setSubmitting(true);
    setErr("");
    try {
      const res = await Api.requestAccountDeletion({ code: code.trim() });
      if (res.code === 0) {
        onSuccess?.(res.data);
        return;
      }
      setErr(errorByCode(res.code));
    } catch {
      setErr(
        t("user_account.delete_account.fail", "Failed to submit. Please try again.")
      );
    } finally {
      setSubmitting(false);
    }
  }, [submitting, code, onSuccess, errorByCode, t]);

  return (
    <div className={`${styles.modal} ${open ? styles.show : ""}`}>
      <div className={styles.modal_content}>
        <h2>{t("user_account.delete_account.title", "Delete account")}</h2>
        <p className={styles.warn}>
          {t(
            "user_account.delete_account.desc",
            "Your account will be deactivated immediately and permanently deleted after a 15-day cooling-off period. Signing in again within this period cancels the deletion."
          )}
        </p>
        <Link
          href={buildHref("/article/legal/account-deletion-agreement")}
          prefetch={false}
          target="_blank"
          className={styles.agreement}
        >
          {t(
            "user_account.delete_account.agreement",
            "Account Deletion Agreement"
          )}
        </Link>

        <div className={styles.form_item}>
          <label>
            {t("user_account.delete_account.code_label", "Email verification code")}
          </label>
          <div className={styles.code_row}>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("user_account.delete_account.code_ph", "6-digit code")}
            />
            <Button
              variant="secondary"
              size="small"
              className={styles.send_btn}
              disabled={cooldown > 0}
              loading={sending}
              onClick={handleSend}
            >
              {cooldown > 0
                ? `${cooldown}s`
                : t("user_account.delete_account.send_code", "Send code")}
            </Button>
          </div>
          {err ? <p className={styles.err}>{err}</p> : null}
        </div>

        <div className={styles.btn_container}>
          <Button
            variant="secondary"
            className={styles.action_btn}
            onClick={close}
          >
            {LANG["user_account.account_info.close"]}
          </Button>
          <Button
            variant="primary"
            className={styles.action_btn}
            loading={submitting}
            onClick={handleConfirm}
          >
            {t("user_account.delete_account.confirm", "Delete account")}
          </Button>
        </div>
      </div>
    </div>
  );
}
