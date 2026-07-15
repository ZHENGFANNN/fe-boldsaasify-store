"use client";

import React from "react";
import LoginModal from "./LoginModal";

/**
 * AuthGate 全局单例：
 *  1. 挂载唯一的 <LoginModal>；
 *  2. useEffect 监听 window "auth:session-expired" 自定义事件——axios 拦截器收到 10014 时 dispatchEvent 触发弹窗；
 *  3. useAuthGate() 暴露 openLoginModal() / closeLoginModal() 供组件主动调用。
 */
const AuthGateContext = React.createContext({
  openLoginModal: () => {},
  closeLoginModal: () => {},
});

export function AuthGateProvider({ LANG, children }) {
  const modalRef = React.useRef(null);

  const openLoginModal = React.useCallback(() => {
    modalRef.current?.show();
  }, []);

  const closeLoginModal = React.useCallback(() => {
    modalRef.current?.hide();
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => openLoginModal();
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, [openLoginModal]);

  const value = React.useMemo(
    () => ({ openLoginModal, closeLoginModal }),
    [openLoginModal, closeLoginModal]
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <LoginModal ref={modalRef} LANG={LANG} />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  return React.useContext(AuthGateContext);
}
