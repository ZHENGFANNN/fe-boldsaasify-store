"use client";
import React from "react";
import Cookies from "js-cookie";
import ProductContext from "../../ProductContext";
import { useRouter } from "next/navigation";
import ProductPricingLoader from "../ProductPricingLoader";
import { pickCombo } from "@/utils/productPricing";

export default function Layout({
  children,
  locale,
  sortKey,
  productKey,
  area: areaProp,
  LANG,
  CONFIG,
  isMobile,
  productInfo: baseProductInfo,
}) {
  const router = useRouter();
  React.useEffect(() => {
    if (!baseProductInfo) {
      router.push("/not-found");
    }
  }, [baseProductInfo, router]);

  const [area, setArea] = React.useState(areaProp || "us");
  React.useEffect(() => {
    const real = Cookies.get("area") || "us";
    if (real !== area) setArea(real);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [lazyLoading, setLazyLoading] = React.useState(true);
  const [pricingLoading, setPricingLoading] = React.useState(true);
  const [goodDiscountFestival, setGoodDiscountFestival] = React.useState(false);
  const [productInfo, setProductInfo] = React.useState(baseProductInfo);
  const [productNum, setProductNum] = React.useState(1);
  const [productCurCombo, setProductCurCombo] = React.useState(() =>
    pickCombo(baseProductInfo?.comboList)
  );
  const [productOptions, setProductOptions] = React.useState(() => {
    const typeList = Array.isArray(baseProductInfo?.typeList)
      ? baseProductInfo.typeList
      : [];
    const formateList = [];
    const curComboKey = pickCombo(baseProductInfo?.comboList)?.key;
    typeList.forEach((item) => {
      if (!Array.isArray(item.options) || !item.options[0]) return;
      if (
        !item.associated ||
        (item.combo_keys && item.combo_keys.includes(curComboKey))
      ) {
        formateList.push({
          name: item.title,
          value: item.options[0].title,
          desc: item.options[0].desc,
        });
      }
    });
    return formateList;
  });
  const [productShowType, setProductShowType] = React.useState("image");

  React.useEffect(() => {
    setProductInfo(baseProductInfo);
    setProductCurCombo(pickCombo(baseProductInfo?.comboList));
    setPricingLoading(true);
    setGoodDiscountFestival(false);
  }, [baseProductInfo]);

  const setPricingState = React.useCallback((patch) => {
    if (patch.pricingLoading !== undefined) {
      setPricingLoading(patch.pricingLoading);
    }
    if (patch.goodDiscountFestival !== undefined) {
      setGoodDiscountFestival(patch.goodDiscountFestival);
    }
    if (patch.productInfo !== undefined) {
      setProductInfo(patch.productInfo);
    }
    if (patch.productCurCombo !== undefined) {
      setProductCurCombo(patch.productCurCombo);
    }
  }, []);

  React.useEffect(() => {
    import("jquery").then(({ default: $ }) => {
      window.$ = $;
      setLazyLoading(false);
    });
  }, []);

  if (!baseProductInfo) return null;

  return (
    <ProductContext.Provider
      value={{
        locale,
        area,
        LANG,
        CONFIG,
        isMobile,
        productInfo,
        goodDiscountFestival,
        pricingLoading,
        lazyLoading,
        setLazyLoading,
        setPricingState,
        productNum,
        setProductNum,
        productCurCombo,
        setProductCurCombo,
        productOptions,
        removeProductOptions: (name) => {
          setProductOptions((prev) => prev.filter((item) => item.name !== name));
        },
        setProductOptions: (newItem) => {
          setProductOptions((prev) => {
            const findIndex = prev.findIndex((item) => item.name === newItem.name);
            if (findIndex > -1) {
              const next = [...prev];
              next[findIndex] = newItem;
              return next;
            }
            return [...prev, newItem];
          });
        },
        productShowType,
        setProductShowType,
      }}
    >
      <ProductPricingLoader
        sortKey={sortKey}
        productKey={productKey}
        locale={locale}
        baseProductInfo={baseProductInfo}
      />
      {children}
    </ProductContext.Provider>
  );
}
