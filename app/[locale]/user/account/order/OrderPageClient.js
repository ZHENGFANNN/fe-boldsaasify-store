"use client";

import React from "react";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import OrderInfo from "../components/OrderInfo";

export default function OrderPageClient({ LANG, locale }) {
  const tipRef = React.useRef(null);
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current?.show({ text, type });
  }, []);
  return (
    <>
      <OrderInfo LANG={LANG} locale={locale} showTip={showTip} />
      <ShowTipModal ref={tipRef} />
    </>
  );
}
