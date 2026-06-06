"use client";
import React from "react";
import Cookies from "js-cookie";
import ProductContext from "../../ProductContext";
import { useRouter } from "next/navigation";

// 按地区把 comboList / associateProduct 的 areaList 解析成 areaInfo。
// 这段逻辑原本在服务端 getProductData.getData 里做，现下沉到客户端，
// 以便商品页整页可静态缓存（同一 URL 不再因地区不同而产生不同 HTML）。
function resolveArea(productInfo, area) {
  if (!productInfo) return null;
  const comboList = (productInfo.comboList || []).map(({ areaList, ...combo }) => {
    let areaInfo = null;
    (areaList || []).forEach((item) => {
      if (item.country_code === area) areaInfo = item;
    });
    return { areaInfo, ...combo };
  });
  const associateProduct = (productInfo.associateProduct || []).map(
    ({ comboItem, ...item }) => {
      let areaInfo = null;
      (comboItem?.areaList || []).forEach((a) => {
        if (a.country_code === area) areaInfo = a;
      });
      return { ...item, areaInfo };
    }
  );
  return { ...productInfo, comboList, associateProduct };
}

function pickCombo(comboList, prevKey) {
  const list = Array.isArray(comboList) ? comboList : [];
  if (prevKey) {
    const match = list.find((c) => c.key === prevKey);
    if (match) return match;
  }
  return list.find((item) => item.areaInfo?.stock) || list[0] || {};
}

export default function Layout({
  children,
  locale,
  area: areaProp,
  LANG,
  CONFIG,
  isMobile,
  productInfo,
  goodDiscountFestival,
}) {
  const router = useRouter();
  React.useEffect(() => {
    if (!productInfo) {
      router.push("/not-found");
    }
  }, [productInfo]);

  // 地区：首屏用服务端传入的默认区(us)，与 SSR 渲染一致避免 hydration 不匹配；
  // mount 后读取浏览器 area cookie，若不同则切换，触发价格重算。
  const [area, setArea] = React.useState(areaProp || "us");
  React.useEffect(() => {
    const real = Cookies.get("area") || "us";
    if (real !== area) setArea(real);
    // 仅 mount 时同步一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 按当前地区解析出带 areaInfo 的商品数据（下游组件消费的就是它）。
  const resolvedProductInfo = React.useMemo(
    () => resolveArea(productInfo, area),
    [productInfo, area]
  );

  const [lazyLoading, setLazyLoading] = React.useState(true);

  // 商品数量
  const [productNum, setProductNum] = React.useState(1);

  // 商品套餐
  const [productCurCombo, setProductCurCombo] = React.useState(() =>
    pickCombo(resolvedProductInfo?.comboList)
  );

  // 地区变化后，把当前选中套餐重新映射到新地区的价格/库存（按 key 保持选择）。
  React.useEffect(() => {
    setProductCurCombo((prev) =>
      pickCombo(resolvedProductInfo?.comboList, prev?.key)
    );
  }, [resolvedProductInfo]);

  // 商品选项
  const [productOptions, setProductOptions] = React.useState(() => {
    const typeList = Array.isArray(resolvedProductInfo?.typeList)
      ? resolvedProductInfo.typeList
      : [];
    const formateList = [];
    const curComboKey = pickCombo(resolvedProductInfo?.comboList)?.key;
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
        productInfo: resolvedProductInfo,
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
        setProductShowType,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
