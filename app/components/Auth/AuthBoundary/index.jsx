"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Loading from "@/components/Loading";
import AuthRedirectGuard from "../AuthRedirectGuard";
import { useAuthGate } from "../AuthGateContext";
import { isProtectedPath } from "../authRoutes";
import styles from "./index.module.scss";

/**
 * 全局登录守卫边界：包在 #app-content 的 children 外层，统一接管
 * 「受保护路由 + 未登录/会话失效」的整页守卫，取代原来每个页面各自
 * 引入 AuthRedirectGuard + isLogin 三段式的重复模板。
 *
 * 判定来源：AuthGateContext 的 authed（挂载读 cookie、监听 auth:session-expired 翻 false）。
 *   - 非受保护路由：永远直接渲染 children（公共页即便收到 10014 也只静默清 token 不换守卫）。
 *   - 受保护路由：
 *       authed === null → Loading（SSG 下 cookie 仅客户端可读，先兜一帧避免闪业务内容/hydration mismatch）
 *       authed === false → AuthRedirectGuard（满屏，登录后按 redirectPath 回跳本页）
 *       authed === true  → children（子页面因此可假定已登录，无需再自检 cookie）
 */
export default function AuthBoundary({ LANG, children }) {
  const pathname = usePathname();
  const { authed } = useAuthGate();
  const protectedPath = isProtectedPath(pathname);

  // 登录后回跳路径：受保护路由未登录时才需要，客户端读当前地址（SSR 无 window）。
  const [redirectPath, setRedirectPath] = React.useState("");
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectPath(`${window.location.pathname}${window.location.search}`);
    }
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!protectedPath) return children;

  if (authed === null) {
    return (
      <div className={styles.center}>
        <Loading height={400} />
      </div>
    );
  }

  if (!authed) {
    return <AuthRedirectGuard LANG={LANG} redirectPath={redirectPath} />;
  }

  return children;
}
