"use client";

import React from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { UserIcon } from "@/components/Icon";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import { defaultLocale } from "@/config/languageSettings";
import verifyLogin from "@/utils/verifyLogin";
import Api from "../../api";
import UserApi from "../../../api";
import SingleFieldEditModal from "../SingleFieldEditModal";
import DeleteAccountModal from "../DeleteAccountModal";
import styles from "./index.module.scss";

const maskPhone = (phone) => {
  if (!phone) return "";
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
};

const displayName = (user) =>
  user?.nickname || user?.email || user?.phone || "";

function Chevron() {
  return (
    <svg
      className={styles.chevron}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function EditPen() {
  return (
    <svg
      className={styles.pen}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

// 展示型资料卡：DJI 风格，顶部头像 + 用户名，中部登录安全分组，底部退出登录。
// 微信绑定/安全验证/账号注销等 BR 尚未支持的能力此处完全不渲染。
export default function ProfileCard({ LANG, locale }) {
  const tipRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [userInfo, setUserInfo] = React.useState({});
  const [editing, setEditing] = React.useState(null); // "nickname" | "phone" | null
  const [showDelete, setShowDelete] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);
  // 密码 Change 60s 冷却：发出重置邮件后进入倒计时，防止用户不断点击触发发信轰炸。
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const t = React.useCallback(
    (key, fallback) => (LANG && LANG[key]) || fallback,
    [LANG]
  );

  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current?.show({ text, type });
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    // 首屏拉取用户信息；这里的 setState 是明确的同步初始化，豁免该规则。
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setLoading(true);
    verifyLogin()
      .then((result) => {
        if (cancelled) return;
        if (result.status === "ok") {
          setUserInfo(result.data || {});
          return;
        }
        if (result.status === "invalid") {
          // 服务端明确判定登录态失效(token 过期/session 失效)：清 token + 派发全局事件，
          // AuthGateProvider 翻 authed=false → AuthBoundary 就地换成登录守卫(AuthRedirectGuard)。
          // 不再 window.location.reload()——整页刷新正是「点我的账号信息页面被刷新」的来源，
          // 事件驱动可无刷新地切到登录组件（与 axios 拦截器 10014 同款处理）。
          Cookies.remove("token");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:session-expired"));
          }
          return;
        }
        // status === "error"：网络/超时等瞬时错误 —— 按 verifyLogin 契约保留 token、不登出，
        // 仅提示稍后重试，避免把已登录用户误踢成游客(旧代码在此也清 token+刷新是隐患)。
        showTip({
          text: t("common.other.load_failed", "Failed to load. Please try again."),
          type: "error",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // 仅首屏拉一次；showTip/t 为稳定引用，无需进依赖。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveField = React.useCallback(
    async (field, value) => {
      if (saving) return;
      if (value === (userInfo[field] ?? "")) {
        setEditing(null);
        return;
      }
      setSaving(true);
      try {
        const payload = {
          nickname: userInfo.nickname || "",
          first_name: userInfo.first_name || "",
          last_name: userInfo.last_name || "",
          email: userInfo.email || "",
          phone: userInfo.phone || "",
          [field]: value,
        };
        const res = await Api.saveUserInfo(payload);
        if (res.code !== 0) throw new Error("code !== 0");
        setUserInfo((prev) => ({ ...prev, [field]: value }));
        setEditing(null);
        showTip({
          text: LANG["user_account.account_info.success_modified"],
          type: "success",
        });
      } catch {
        showTip({
          text: LANG["user_account.account_info.fail_edit"],
          type: "error",
        });
      } finally {
        setSaving(false);
      }
    },
    [saving, userInfo, LANG, showTip]
  );

  const handleSignOut = React.useCallback(() => {
    Api.loginOut();
    Cookies.remove("token");
    location.href = "/";
  }, []);

  // 注销申请成功 → 提示进入冷静期并登出（期内重新登录可撤销）。
  const handleDeletionSuccess = React.useCallback(() => {
    setShowDelete(false);
    showTip({
      text: t(
        "user_account.delete_account.success",
        "Your account is scheduled for deletion. Signing in again within the cooling-off period will cancel it."
      ),
      type: "success",
    });
    setTimeout(() => {
      Api.loginOut();
      Cookies.remove("token");
      location.href = "/";
    }, 2500);
  }, [showTip, t]);

  const handleResetPassword = React.useCallback(async () => {
    if (resetting || cooldown > 0) return;
    const targetEmail = userInfo.email || "";
    if (!targetEmail) {
      showTip({
        text: t(
          "user_account.account_info.email_missing",
          "No email is bound to this account."
        ),
        type: "error",
      });
      return;
    }
    setResetting(true);
    try {
      const res = await UserApi.verifyForgetPassword({ email: targetEmail });
      if (res.code !== 0) throw new Error("code !== 0");
      showTip({
        text: t(
          "user_forget.reset_link_sent",
          "If this email is registered, a password reset link has been sent. Please check your inbox."
        ),
        type: "success",
      });
      setCooldown(60);
    } catch {
      showTip({
        text: t(
          "user_forget.tip_service_exception",
          "Something went wrong. Please try again later."
        ),
        type: "error",
      });
    } finally {
      setResetting(false);
    }
  }, [resetting, cooldown, userInfo, showTip, t]);

  if (loading) return <Loading height={400} />;

  const name = displayName(userInfo);
  const phone = userInfo.phone || "";
  const email = userInfo.email || "";
  // 展示层脱敏值优先取后端返回的 email_masked/phone_masked；后端未返回时兜底本地掩码。
  const emailDisplay = userInfo.email_masked || email;
  const phoneDisplay = userInfo.phone_masked || maskPhone(phone);
  const buildHref = (path) =>
    locale && locale !== defaultLocale ? `/${locale}${path}` : path;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {userInfo.avatar ? (
            <img src={userInfo.avatar} alt="" />
          ) : (
            <UserIcon />
          )}
        </div>
        <button
          type="button"
          className={styles.name_row}
          onClick={() => setEditing("nickname")}
        >
          <span className={styles.name}>{name || t("user_account.account_info.nickname", "Nickname")}</span>
          <EditPen />
        </button>
      </div>

      <section className={styles.group}>
        <div className={styles.item_static}>
          <span className={styles.item_label}>
            {t("user_account.account_info.email", "Email")}
          </span>
          <span className={styles.item_action}>
            {email ? (
              <span className={styles.item_value}>{emailDisplay}</span>
            ) : (
              <span className={styles.item_muted}>
                {t("user_account.account_info.not_set", "Not set")}
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          className={styles.item}
          onClick={() => setEditing("phone")}
        >
          <span className={styles.item_label}>
            {t("user_account.account_info.phone", "Phone")}
          </span>
          <span className={styles.item_action}>
            {phone ? (
              <span className={styles.item_value}>{phoneDisplay}</span>
            ) : (
              t("common.setting", "Setting")
            )}
            <Chevron />
          </span>
        </button>

        <button
          type="button"
          className={styles.item}
          onClick={handleResetPassword}
          disabled={resetting || cooldown > 0}
        >
          <span className={styles.item_label}>
            {t("user_account.account_info.password", "Password")}
          </span>
          <span className={styles.item_action}>
            {cooldown > 0
              ? `${cooldown}s`
              : resetting
              ? t("common.sending", "Sending...")
              : t("common.change", "Change")}
            <Chevron />
          </span>
        </button>

        <Link
          href={buildHref("/user/account/order")}
          prefetch={false}
          className={`${styles.item} ${styles.shortcut}`}
        >
          <span className={styles.item_label}>
            {t("user_account.my_order", "My Orders")}
          </span>
          <span className={styles.item_action}>
            <Chevron />
          </span>
        </Link>

        <Link
          href={buildHref("/user/account/address")}
          prefetch={false}
          className={`${styles.item} ${styles.shortcut}`}
        >
          <span className={styles.item_label}>
            {t("user_account.shipping_address", "My Address")}
          </span>
          <span className={styles.item_action}>
            <Chevron />
          </span>
        </Link>

        <button
          type="button"
          className={styles.item}
          onClick={() => setShowDelete(true)}
        >
          <span className={styles.item_label}>
            {t("user_account.delete_account.entry", "Delete account")}
          </span>
          <span className={styles.item_action}>
            <Chevron />
          </span>
        </button>
      </section>

      <div className={styles.footer}>
        <Button
          variant="ghost"
          size="small"
          className={styles.sign_out}
          onClick={handleSignOut}
        >
          {LANG["user_account.account_info.login_out"]}
        </Button>
      </div>

      <SingleFieldEditModal
        open={editing === "nickname"}
        label={LANG["user_account.account_info.nickname"]}
        defaultValue={userInfo.nickname || ""}
        maxLength={15}
        requiredMessage={LANG["user_account.account_info.nickname_require"]}
        LANG={LANG}
        loading={saving}
        onClose={() => setEditing(null)}
        onConfirm={(v) => saveField("nickname", v)}
      />

      <SingleFieldEditModal
        open={editing === "phone"}
        label={LANG["user_account.account_info.phone"]}
        defaultValue={userInfo.phone || ""}
        maxLength={20}
        requiredMessage={LANG["user_account.account_info.phone_required"]}
        LANG={LANG}
        loading={saving}
        onClose={() => setEditing(null)}
        onConfirm={(v) => saveField("phone", v)}
      />

      <DeleteAccountModal
        open={showDelete}
        LANG={LANG}
        locale={locale}
        onClose={() => setShowDelete(false)}
        onSuccess={handleDeletionSuccess}
      />

      <ShowTipModal ref={tipRef} />
    </div>
  );
}
