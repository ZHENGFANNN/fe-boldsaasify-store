"use client";

import React from "react";
import Cookies from "js-cookie";

/**
 * 全局登录态：
 *  1. authed —— null(未判定) / true(已登录) / false(未登录或会话失效)；
 *     SSR/SSG 阶段 cookie 不可读，故初始 null，挂载后由 cookie 判定。
 *  2. useEffect 监听 window "auth:session-expired"（axios 拦截器收到 10014、
 *     或 verifyLogin 判定 invalid 时 dispatch）→ 翻 authed=false。
 *  3. 暴露 setAuthed(bool) / refresh()（重新按 cookie 判定），供登录成功等场景主动更新。
 *
 * 注意：不再挂 LoginModal 单例；受保护路由的整页守卫由 <AuthBoundary> 统一渲染。
 */
const AuthGateContext = React.createContext({
  authed: null,
  setAuthed: () => {},
  refresh: () => {},
});

export function AuthGateProvider({ children }) {
  const [authed, setAuthed] = React.useState(null);

  const refresh = React.useCallback(() => {
    setAuthed(!!Cookies.get("token"));
  }, []);

  React.useEffect(() => {
    // 挂载后首次按 cookie 判定登录态（cookie 仅客户端可读，故在 effect 内 setState）。
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    refresh();
    const onExpired = () => setAuthed(false);
    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, [refresh]);

  const value = React.useMemo(
    () => ({ authed, setAuthed, refresh }),
    [authed, refresh]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  return React.useContext(AuthGateContext);
}
