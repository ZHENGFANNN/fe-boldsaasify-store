"use client";

import React from "react";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import AddressList from "../components/AddressList";

export default function AddressPageClient({ LANG }) {
  const tipRef = React.useRef(null);
  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current?.show({ text, type });
  }, []);
  return (
    <>
      <AddressList LANG={LANG} showTip={showTip} />
      <ShowTipModal ref={tipRef} />
    </>
  );
}
