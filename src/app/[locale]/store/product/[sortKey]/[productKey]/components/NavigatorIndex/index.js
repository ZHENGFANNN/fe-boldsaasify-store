"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function NavigatorIndex() {
  const router = useRouter();
  React.useEffect(() => {
    const t = setTimeout(() => {
      router.push("/store");
    }, 2000);
    return () => {
      clearTimeout(t);
    };
  }, []);
  return null;
}
