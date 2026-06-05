"use client";
import React from "react";
import ProductContext from "../../ProductContext";
import { useRouter } from "next/navigation";

export default function Layout({
  children,
  locale,
  area,
  LANG,
  CONFIG,
  isMobile,
  productInfo,
  goodDiscountFestival
}) {
  const router = useRouter();
  React.useEffect(() => {
    if (!productInfo) {
      router.push("/not-found");
    }
  }, [productInfo]);

  const [lazyLoading, setLazyLoading] = React.useState(true);

  // 商品数量
  const [productNum, setProductNum] = React.useState(1);

  // 商品套餐
  const [productCurCombo, setProductCurCombo] = React.useState(() => {
    const comboList = Array.isArray(productInfo?.comboList)
      ? productInfo.comboList
      : [];
    return (
      comboList.find((item) => item.areaInfo?.stock) || comboList[0] || {}
    );
  });

  // 商品选项
  const [productOptions, setProductOptions] = React.useState(() => {
    const typeList = Array.isArray(productInfo?.typeList)
      ? productInfo.typeList
      : [];
    const formateList = [];
    typeList.forEach((item) => {
      if (!Array.isArray(item.options) || !item.options[0]) return;
      if (
        !item.associated ||
        (item.combo_keys && item.combo_keys.includes(productCurCombo?.key))
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

  // 商品首页展示类型
  const [productShowType, setProductShowType] = React.useState("image");

  React.useEffect(() => {
    import("jquery").then(({ default: $ }) => {
      window.$ = $;
      setLazyLoading(false);
    });
  }, []);

  if (!productInfo) return null;

  return (
    <ProductContext.Provider
      value={{
        // 全局数据
        locale,
        area,
        LANG,
        CONFIG,
        isMobile,
        productInfo,
        goodDiscountFestival,
        lazyLoading,
        setLazyLoading,
        /**
         * 商品状态
         */
        // 产品数量
        productNum,
        setProductNum,
        // 当前产品套餐
        productCurCombo,
        setProductCurCombo,
        // 当前产品选项
        productOptions,
        removeProductOptions: (name) => {
          setProductOptions((productOptions) => {
            return productOptions.filter((item) => item.name !== name);
          });
        },
        setProductOptions: (newItem) => {
          setProductOptions((productOptions) => {
            const findIndex = productOptions.findIndex(
              (item) => item.name === newItem.name
            );
            if (findIndex > -1) {
              productOptions[findIndex] = newItem;
              return [...productOptions];
            } else {
              return [...productOptions, newItem];
            }
          });
        },
        // 产品展示类型
        productShowType,
        setProductShowType
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
