"use client";
import React from "react";
import ProductContext from "../../productContext";

export default function Layout({ children }) {
  const [lazyLoading, setLazyLoading] = React.useState(true);
  React.useEffect(() => {
    import("jquery").then(({ default: $ }) => {
      window.$ = $;
      setLazyLoading(false);
    });
  }, []);
  return (
    <ProductContext.Provider
      value={{
        lazyLoading,
        setLazyLoading,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
