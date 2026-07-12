"use client";

import React from "react";
import Api from "../../../../api";
import styles from "../index.module.scss";

// 服务信息卡片：服务单号（含复制）+ 创建日期 +（可选）邮箱/手机号编辑与通知重发。
// props:
//   data     : 售后详情
//   editable : 是否允许改联系方式 & 重发（终态时为 false）
//   LANG, T  : 语言包 & 兜底文案函数
//   onUpdate : 联系方式更新成功后回调（刷父组件详情）
//   toast    : (msg, ok) => void  toast 出错/成功提示（父组件的 ShowTipModal ref 或简易封装）
const ServiceInfoCard = React.memo(function ServiceInfoCard({
  data,
  editable,
  LANG,
  T,
  onUpdate,
  toast,
}) {
  const [emailEditing, setEmailEditing] = React.useState(false);
  const [phoneEditing, setPhoneEditing] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState(data.contact_email || "");
  const [phoneInput, setPhoneInput] = React.useState(data.contact_phone || "");
  const [copied, setCopied] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const copyServiceNo = React.useCallback(() => {
    const no = data.service_no || "";
    if (!no) return;
    // 兼容 navigator.clipboard 不可用的场景（非 https / 老浏览器）
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(no).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        },
        () => {}
      );
      return;
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = no;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // 静默失败
    }
  }, [data.service_no]);

  const submitContact = React.useCallback(
    async (payload) => {
      if (pending) return;
      setPending(true);
      try {
        const res = await Api.updateAfterServiceContact({
          service_no: data.service_no,
          ...payload,
        });
        if (res.code !== 0) throw new Error("code!==0");
        toast?.(
          T(LANG, "user_account.after_sale.contact_updated", "Contact updated"),
          true
        );
        setEmailEditing(false);
        setPhoneEditing(false);
        onUpdate?.();
      } catch (_) {
        toast?.(
          T(
            LANG,
            "user_account.after_sale.contact_update_failed",
            "Failed to update contact. Please try again."
          ),
          false
        );
      } finally {
        setPending(false);
      }
    },
    [data.service_no, pending, toast, T, LANG, onUpdate]
  );

  const resend = React.useCallback(
    async (channel) => {
      if (pending) return;
      setPending(true);
      try {
        const res = await Api.resendAfterServiceNotify({
          service_no: data.service_no,
          channel,
        });
        if (res.code !== 0) throw new Error("code!==0");
        toast?.(
          T(
            LANG,
            "user_account.after_sale.resend_success",
            "Notification resent."
          ),
          true
        );
      } catch (_) {
        toast?.(
          T(
            LANG,
            "user_account.after_sale.resend_failed",
            "Failed to resend. Please wait and try again."
          ),
          false
        );
      } finally {
        setPending(false);
      }
    },
    [data.service_no, pending, toast, T, LANG]
  );

  const createdDate = React.useMemo(() => {
    const s = data.created_time || "";
    // "2026-07-12T13:33:00Z" 或 "2026-07-12 13:33:00"，简化只显示日期
    return s.length >= 10 ? s.slice(0, 10) : s;
  }, [data.created_time]);

  return (
    <div className={styles.info_card}>
      <div className={styles.section_title}>
        {T(LANG, "user_account.after_sale.info_title", "Service Info")}
      </div>

      {/* 服务单号 + 复制 */}
      <div className={styles.info_row_lg}>
        <span className={styles.info_label}>
          {T(LANG, "user_account.after_sale.service_no", "Service No.")}
        </span>
        <span className={styles.info_value_mono}>{data.service_no}</span>
        <button
          type="button"
          className={styles.link_btn}
          onClick={copyServiceNo}
        >
          {copied
            ? T(LANG, "user_account.after_sale.copied", "Copied")
            : T(LANG, "user_account.after_sale.copy", "Copy")}
        </button>
      </div>

      <div className={styles.info_row_lg}>
        <span className={styles.info_label}>
          {T(LANG, "user_account.after_sale.created_date", "Created")}
        </span>
        <span className={styles.info_value}>{createdDate}</span>
      </div>

      {/* 邮箱 */}
      {data.contact_email !== undefined ? (
        <>
          <div className={styles.info_row_lg}>
            <span className={styles.info_label}>
              {T(LANG, "user_account.after_sale.contact.email", "Email")}
            </span>
            {emailEditing ? (
              <span className={styles.info_edit}>
                <input
                  type="email"
                  className={styles.info_input}
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                />
                <button
                  type="button"
                  className={styles.link_btn}
                  onClick={() => submitContact({ contact_email: emailInput })}
                  disabled={pending}
                >
                  {T(LANG, "user_account.after_sale.save", "Save")}
                </button>
                <button
                  type="button"
                  className={styles.link_btn_muted}
                  onClick={() => {
                    setEmailInput(data.contact_email || "");
                    setEmailEditing(false);
                  }}
                >
                  {T(LANG, "user_account.after_sale.cancel_edit", "Cancel")}
                </button>
              </span>
            ) : (
              <>
                <span className={styles.info_value}>
                  {data.contact_email || "-"}
                </span>
                {editable ? (
                  <button
                    type="button"
                    className={styles.link_btn}
                    onClick={() => setEmailEditing(true)}
                  >
                    {T(LANG, "user_account.after_sale.edit", "Edit")}
                  </button>
                ) : null}
              </>
            )}
          </div>
          {editable && !emailEditing ? (
            <div className={styles.resend_hint}>
              <span>
                {T(
                  LANG,
                  "user_account.after_sale.mail_sent_hint",
                  "Shipping instructions have been sent to this email."
                )}
              </span>
              <button
                type="button"
                className={styles.resend_link}
                onClick={() => resend("mail")}
                disabled={pending}
              >
                {T(
                  LANG,
                  "user_account.after_sale.resend_mail",
                  "Didn't get it? Resend"
                )}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {/* 手机号 */}
      {data.contact_phone !== undefined ? (
        <>
          <div className={styles.info_row_lg}>
            <span className={styles.info_label}>
              {T(LANG, "user_account.after_sale.contact.phone", "Phone")}
            </span>
            {phoneEditing ? (
              <span className={styles.info_edit}>
                <input
                  type="tel"
                  className={styles.info_input}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 555 000 0000"
                />
                <button
                  type="button"
                  className={styles.link_btn}
                  onClick={() => submitContact({ contact_phone: phoneInput })}
                  disabled={pending}
                >
                  {T(LANG, "user_account.after_sale.save", "Save")}
                </button>
                <button
                  type="button"
                  className={styles.link_btn_muted}
                  onClick={() => {
                    setPhoneInput(data.contact_phone || "");
                    setPhoneEditing(false);
                  }}
                >
                  {T(LANG, "user_account.after_sale.cancel_edit", "Cancel")}
                </button>
              </span>
            ) : (
              <>
                <span className={styles.info_value}>
                  {data.contact_phone || "-"}
                </span>
                {editable ? (
                  <button
                    type="button"
                    className={styles.link_btn}
                    onClick={() => setPhoneEditing(true)}
                  >
                    {T(LANG, "user_account.after_sale.edit", "Edit")}
                  </button>
                ) : null}
              </>
            )}
          </div>
          {editable && !phoneEditing ? (
            <div className={styles.resend_hint}>
              <span>
                {T(
                  LANG,
                  "user_account.after_sale.sms_sent_hint",
                  "Shipping instructions have been sent to this phone."
                )}
              </span>
              <button
                type="button"
                className={styles.resend_link}
                onClick={() => resend("sms")}
                disabled={pending}
              >
                {T(
                  LANG,
                  "user_account.after_sale.resend_sms",
                  "Didn't get it? Resend"
                )}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
});

export default ServiceInfoCard;
