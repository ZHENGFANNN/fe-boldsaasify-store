"use client";
import React from "react";
import ProductContext from "../../ProductContext";

export default function Layout({
  children,
  locale,
  area,
  LANG,
  CONFIG,
  isMobile,
  productInfo,
  goodDiscountFestival,
}) {
  const [lazyLoading, setLazyLoading] = React.useState(true);

  // 商品数量
  const [productNum, setProductNum] = React.useState(1);

  // 商品套餐
  const [productCurCombo, setProductCurCombo] = React.useState(() => {
    return productInfo.comboList[0];
  });

  // 商品选项
  const [productOptions, setProductOptions] = React.useState(() => {
    return productInfo.typeList.map((item) => {
      return {
        name: item.title,
        value: item.options[0].title,
      };
    });
  });

  // 商品首页展示类型
  const [productShowType, setProductShowType] = React.useState("image");

  React.useEffect(() => {
    import("jquery").then(({ default: $ }) => {
      window.$ = $;
      setLazyLoading(false);
    });
  }, []);

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
        setProductOptions: (newItem) => {
          setProductOptions((productOptions) => {
            return productOptions.map((item) => {
              return item.name === newItem.name ? newItem : item;
            });
          });
        },
        // 产品展示类型
        productShowType,
        setProductShowType,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
