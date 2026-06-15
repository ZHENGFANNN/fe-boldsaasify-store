"use client";
import React from "react";
import ProductContext from "../../ProductContext";
import GlobalContext from "@/[locale]/context";
import { pickCombo, applyProductPricing } from "@/utils/productPricing";
import readClientArea from "@/utils/readClientArea";
import getProductPricing from "@/service/product/get-pricing";

export default function BaseLayout({
  children,
  locale,
  sortKey,
  productKey,
  LANG,
  CONFIG,
  isMobile,
  baseProductInfo,
  productInfo: initialProductInfo
}) {
  const { goodDiscountFestival: globalFestival } =
    React.useContext(GlobalContext) || {};

  const initialProductRef = React.useRef(initialProductInfo);

  React.useEffect(() => {
    initialProductRef.current = initialProductInfo;
  }, [initialProductInfo]);

  const [lazyLoading, setLazyLoading] = React.useState(true);
  // 地区价格补差 loading：服务端种子无价，挂载后拉真实地区价之前恒为 true，
  // 期间价格区展示骨架（首屏种子不含任何 areaInfo）。
  const [priceLoading, setPriceLoading] = React.useState(true);
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
          desc: item.options[0].desc
        });
      }
    });
    return formateList;
  });
  const [productShowType, setProductShowType] = React.useState("image");

  const productSlugRef = React.useRef(`${sortKey}/${productKey}`);
  React.useEffect(() => {
    const slug = `${sortKey}/${productKey}`;
    if (productSlugRef.current === slug) return;
    productSlugRef.current = slug;

    const seed = initialProductRef.current;
    setProductInfo(seed);
    setProductCurCombo(pickCombo(seed?.comboList));
  }, [sortKey, productKey]);

  // 客户端价格补差：服务端种子已无价（areaInfo 全空），
  // 挂载后（及切换商品后）按真实 area 拉对应地区定价并合并；
  // us 不再走服务端预渲染，因此这里对所有地区（含 us）一律拉取。
  React.useEffect(() => {
    const area = readClientArea();

    let cancelled = false;
    setPriceLoading(true);
    (async () => {
      const pricing = await getProductPricing({
        sortKey,
        productKey,
        area,
        locale,
      });
      if (cancelled) return;
      const seed = initialProductRef.current;
      const priced = pricing ? applyProductPricing(seed, pricing) : null;
      if (priced) {
        setProductInfo(priced);
        setProductCurCombo((prev) => pickCombo(priced.comboList, prev?.key));
      }
      // 拿到地区价（或失败退回无价种子）后结束 loading，展示价格。
      setPriceLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, sortKey, productKey]);

  const removeProductOptions = React.useCallback((name) => {
    setProductOptions((prev) => prev.filter((item) => item.name !== name));
  }, []);

  const upsertProductOption = React.useCallback((newItem) => {
    setProductOptions((prev) => {
      const findIndex = prev.findIndex((item) => item.name === newItem.name);
      if (findIndex > -1) {
        const next = [...prev];
        next[findIndex] = newItem;
        return next;
      }
      return [...prev, newItem];
    });
  }, []);

  React.useEffect(() => {
    import("jquery").then(({ default: $ }) => {
      window.$ = $;
      setLazyLoading(false);
    });
  }, []);

  return (
    <ProductContext.Provider
      value={{
        locale,
        LANG,
        CONFIG,
        isMobile,
        productInfo,
        goodDiscountFestival: globalFestival,
        lazyLoading,
        setLazyLoading,
        priceLoading,
        productNum,
        setProductNum,
        productCurCombo,
        setProductCurCombo,
        productOptions,
        removeProductOptions,
        setProductOptions: upsertProductOption,
        productShowType,
        setProductShowType
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
