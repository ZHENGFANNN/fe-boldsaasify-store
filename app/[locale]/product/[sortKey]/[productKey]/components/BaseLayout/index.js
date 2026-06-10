"use client";
import React from "react";
import Cookies from "js-cookie";
import ProductContext from "../../ProductContext";
import GlobalContext from "@/[locale]/context";
import { useRouter } from "next/navigation";
import ProductPricingLoader from "../ProductPricingLoader";
import { pickCombo } from "@/utils/productPricing";

export default function Layout({
  children,
  locale,
  sortKey,
  productKey,
  area: areaProp,
  serverArea = "us",
  LANG,
  CONFIG,
  isMobile,
  baseProductInfo,
  productInfo: initialProductInfo,
  pricingLoading: initialPricingLoading = false,
}) {
  const router = useRouter();
  const { goodDiscountFestival: globalFestival } =
    React.useContext(GlobalContext) || {};

  const initialProductRef = React.useRef(initialProductInfo);

  React.useEffect(() => {
    initialProductRef.current = initialProductInfo;
  }, [initialProductInfo]);

  React.useEffect(() => {
    if (!initialProductInfo && !baseProductInfo) {
      router.push("/not-found");
    }
  }, [baseProductInfo, initialProductInfo, router]);

  const [area, setArea] = React.useState(areaProp || "us");
  const [lazyLoading, setLazyLoading] = React.useState(true);
  const [pricingLoading, setPricingLoading] = React.useState(
    initialPricingLoading
  );

  // cookie 地区与 ISR 默认地区不一致时，首帧即显示 skeleton，避免先闪 USD 再变当地货币。
  React.useLayoutEffect(() => {
    const cookieArea = Cookies.get("area") || "us";
    if (cookieArea !== area) {
      setArea(cookieArea);
    }
    if (cookieArea !== serverArea) {
      setPricingLoading(true);
    }
  }, [area, serverArea]);
  const [productInfo, setProductInfo] = React.useState(initialProductInfo);
  const [productNum, setProductNum] = React.useState(1);
  const [productCurCombo, setProductCurCombo] = React.useState(() =>
    pickCombo(initialProductInfo?.comboList)
  );
  const [productOptions, setProductOptions] = React.useState(() => {
    const typeList = Array.isArray(initialProductInfo?.typeList)
      ? initialProductInfo.typeList
      : [];
    const formateList = [];
    const curComboKey = pickCombo(initialProductInfo?.comboList)?.key;
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

  // 仅切换商品 slug 时重置；勿监听 initialProductInfo，否则 RSC 重传或
  // 客户端已合并 cn/hk 定价后会被 serverArea=us 的美元价覆盖。
  const productSlugRef = React.useRef("");
  React.useEffect(() => {
    const slug = `${sortKey}/${productKey}`;
    if (productSlugRef.current === slug) return;
    productSlugRef.current = slug;

    const seed = initialProductRef.current;
    setProductInfo(seed);
    setProductCurCombo(pickCombo(seed?.comboList));
    setPricingLoading(initialPricingLoading);
  }, [sortKey, productKey, initialPricingLoading]);

  const setPricingState = React.useCallback((patch) => {
    if (patch.pricingLoading !== undefined) {
      setPricingLoading(patch.pricingLoading);
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

  if (!initialProductInfo && !baseProductInfo) return null;

  return (
    <ProductContext.Provider
      value={{
        locale,
        area,
        LANG,
        CONFIG,
        isMobile,
        productInfo,
        goodDiscountFestival: globalFestival,
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
        serverArea={serverArea}
      />
      {children}
    </ProductContext.Provider>
  );
}
