"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * 全站 Google 登录上下文。挂在根布局，让登录/注册页的按钮与全站 One Tap 共用同一个 OAuth Provider。
 * 未配置 NEXT_PUBLIC_GOOGLE_CLIENT_ID 时直接透传 children，保证站点在缺省配置下仍可正常渲染。
 */
export default function GoogleAuthProvider({ children }) {
  if (!CLIENT_ID) return children;
  return <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
