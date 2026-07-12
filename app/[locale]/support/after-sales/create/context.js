"use client";

import React from "react";

// 售后创建向导的静态数据/派生工具容器（LANG、locale、typeLabelMap、tip 等）。
// 业务状态与远端数据交给 jotai atom；此处只放"不变量"与"派生 helper"，
// 与 app/[locale]/order/context.js 的极简 shell 保持一致。
const CreateWizardContext = React.createContext(null);

export function useCreateWizard() {
  const ctx = React.useContext(CreateWizardContext);
  if (!ctx) {
    throw new Error(
      "useCreateWizard must be used inside <CreateWizardContext.Provider>"
    );
  }
  return ctx;
}

export default CreateWizardContext;
