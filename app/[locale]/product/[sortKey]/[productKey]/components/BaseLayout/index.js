"use client";
import React from "react";
import ProductContext from "../../ProductContext";
// import GlobalContext from "@/[locale]/context"; // 节日折扣停用后不再使用
import { pickCombo, applyProductPricing } from "@/utils/productPricing";
import { resolveVariant, defaultSelection } from "@/utils/resolveVariant";
import readClientArea from "@/utils/readClientArea";
import getProductsOffer from "@/service/product/get-offer";
import useCustomizeFields from "../GoodMainRight/CustomizationFields/useCustomizeFields";

export default function BaseLayout({
  children,
  locale,
  sortKey,
  productKey,
  LANG,
  CONFIG,
  isMobile,
  baseProductInfo,
  productInfo: initialProductInfo,
  productOptions: initialProductOptions,
  customizeFields = []
}) {
  // 节日折扣已停用：不再从 GlobalContext 取 goodDiscountFestival。
  // const { goodDiscountFestival: globalFestival } =
  //   React.useContext(GlobalContext) || {};

  const initialProductRef = React.useRef(initialProductInfo);

  React.useEffect(() => {
    initialProductRef.current = initialProductInfo;
  }, [initialProductInfo]);

  const [lazyLoading, setLazyLoading] = React.useState(true);
  // 价格+折扣聚合 loading：服务端种子无价、无折扣，挂载后一次拉「地区价 + 自动折扣」
  // 之前恒为 true，期间价格区展示骨架。合并前是 priceLoading / discountLoading 两态，
  // 现在同一次请求同时就绪 → 单态 offerLoading，对下游仍以两个 key 下发（见 provider）。
  const [offerLoading, setOfferLoading] = React.useState(true);
  const [productInfo, setProductInfo] = React.useState(initialProductInfo);
  const [productNum, setProductNum] = React.useState(1);
  const [productCurCombo, setProductCurCombo] = React.useState(() =>
    pickCombo(initialProductInfo?.comboList)
  );
  const [productShowType, setProductShowType] = React.useState("image");

  // 自动规则折扣（限时促销）：当前单商品命中的促销，命中且未过期则注入 ProductContext，
  // 驱动 Countdown 限时倒计时展示。取数已并入下方「价格+折扣聚合」effect。
  const [autoDiscount, setAutoDiscount] = React.useState(null);
  // 主商品 + 推荐产品(associateProduct) 的折扣命中表（按 product_key 索引），
  // 下发 context 供 AssociateProductList 各卡片算折后价，与主商品同一折扣口径。
  const [discountMap, setDiscountMap] = React.useState({});

  // ---------- V2 选项体系 ----------
  // axes/variants 与地区无关，来自服务端 props；selection = {axis_code: value_code}。
  const axes = React.useMemo(
    () =>
      Array.isArray(initialProductOptions?.axes)
        ? initialProductOptions.axes
        : [],
    [initialProductOptions]
  );
  const variants = React.useMemo(
    () =>
      Array.isArray(initialProductOptions?.variants)
        ? initialProductOptions.variants
        : [],
    [initialProductOptions]
  );
  const hasV2Options = axes.length > 0 && variants.length > 0;
  const [optionSelection, setOptionSelection] = React.useState(() =>
    defaultSelection(variants, axes)
  );

  // 选值变化 → 解析命中的变体 → 切 productCurCombo（价格随之刷新）。
  React.useEffect(() => {
    if (!hasV2Options) return;
    const variant = resolveVariant(variants, optionSelection, axes);
    if (!variant) return;
    setProductCurCombo((prev) => {
      // 从已合并价格的 productInfo.comboList 取带 areaInfo 的同 key combo；
      // 找不到（价格未到）就先用变体壳，待价格补差后 pickCombo 会再对齐。
      const priced = (productInfo?.comboList || []).find(
        (c) => c.key === variant.combo_key
      );
      return (
        priced || {
          key: variant.combo_key,
          title: variant.title,
          areaInfo: prev?.areaInfo
        }
      );
    });
  }, [optionSelection, hasV2Options, variants, axes, productInfo]);

  // 当前选值是否命中真实变体：V2 选项下，未命中（无对应 combo）则视为不可购买，
  // 据此屏蔽加购/支付，避免「禁用组合仍带着上一次价格被买走」。无 V2 选项恒为 true。
  const variantResolved = React.useMemo(() => {
    if (!hasV2Options) return true;
    return !!resolveVariant(variants, optionSelection, axes);
  }, [hasV2Options, variants, optionSelection, axes]);

  const setOptionValue = React.useCallback((axisCode, valueCode) => {
    setOptionSelection((prev) => ({ ...prev, [axisCode]: valueCode }));
  }, []);

  // 各变体 combo 的库存标记：{ combo_key: 是否有库存 }。价格补差后 comboList 才带 areaInfo，
  // 价格未到（priceLoading）时为空 → VariantSelector 不显示缺货虚框，避免误标。
  const stockByCombo = React.useMemo(() => {
    const map = {};
    (productInfo?.comboList || []).forEach((c) => {
      if (c?.key) map[c.key] = !!c.areaInfo?.stock;
    });
    return map;
  }, [productInfo]);

  // ---------- 商品定制字段 ----------
  // CustomizationFields 挂载时把 { getData, validate } 注册进此 ref：
  //   getData() → 组装好的 customize_data 数组（frozen shape），供加购/下单读取
  //   validate() → 必填校验，未通过时由 CustomizationFields 自行展示内联错误并返回 false
  // 加购按钮（GoodBtnList）在点击时同步读取，无字段/未挂载时为默认空实现。
  const customizeRef = React.useRef({ getData: () => [], validate: () => true });

  // 定制字段状态中枢（单例）：主区与 footer 弹窗的 CustomizationFields 共享此状态，
  // 且只在这里注册一次 getData/validate 到 customizeRef，避免多实例双注册覆盖。
  const customize = useCustomizeFields(customizeFields, customizeRef);

  const productSlugRef = React.useRef(`${sortKey}/${productKey}`);
  React.useEffect(() => {
    const slug = `${sortKey}/${productKey}`;
    if (productSlugRef.current === slug) return;
    productSlugRef.current = slug;

    const seed = initialProductRef.current;
    setProductInfo(seed);
    setProductCurCombo(pickCombo(seed?.comboList));
  }, [sortKey, productKey]);

  // 客户端「价格 + 折扣」补差：服务端种子无价（areaInfo 全空）也无折扣，
  // 挂载后（及切换商品后）按真实 area 一次聚合拉「地区价 + 自动折扣」并合并。
  // 一次把主商品 + 全部推荐产品(associateProduct)带上：主商品条目 join 进 comboList 的价，
  // 各条目的 discount 汇成 discountMap 供 AssociateProductList 卡片同口径算折后价。
  // us 不再走服务端预渲染，故所有地区（含 us）一律拉取。
  React.useEffect(() => {
    const area = readClientArea();

    let cancelled = false;
    // 切商品/地区重新拉取时先置 loading，价格区回骨架，等「价 + 折扣」都就绪再一次性渲染，
    // 避免先渲原价、折扣后到再跳成折后价的那一下闪动。
    setOfferLoading(true);
    (async () => {
      const seed = initialProductRef.current;
      const keys = [{ sortKey, productKey }];
      (seed?.associateProduct || []).forEach((p) => {
        if (p?.key && p?.sort_key) {
          keys.push({ sortKey: p.sort_key, productKey: p.key });
        }
      });

      const data = await getProductsOffer({ area, locale, keys });
      if (cancelled) return;

      const list = data?.list || [];
      // 折扣整表下发（过期过滤由消费方 pickAutoDiscount 逐项处理）。
      const dMap = {};
      list.forEach((item) => {
        if (item.discount) dMap[item.productKey] = item.discount;
      });
      setDiscountMap(dMap);

      // 主商品条目 → 合并地区价 + 命中当前商品折扣。
      const mainEntry = list.find(
        (x) => x.sortKey === sortKey && x.productKey === productKey
      );
      const priced = mainEntry
        ? applyProductPricing(seed, mainEntry)
        : null;
      if (priced) {
        setProductInfo(priced);
        setProductCurCombo((prev) => pickCombo(priced.comboList, prev?.key));
      }
      // 无 ends_at 视为无限期促销（Countdown 内部只在有 ends_at 时才渲染倒计时）；
      // 有 ends_at 但已过期的丢弃。
      const hit = dMap[productKey] || null;
      if (hit && (!hit.ends_at || Number(hit.ends_at) > Date.now())) {
        setAutoDiscount(hit);
      } else {
        setAutoDiscount(null);
      }
      // 拿到「价 + 折扣」（或失败退回无价种子）后结束 loading，一次性渲染最终价（含折后价）。
      setOfferLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, sortKey, productKey]);

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
        lazyLoading,
        setLazyLoading,
        // 价与折扣已并成一次请求、同时就绪：下游仍消费 priceLoading（VariantSelector/
        // GoodBtnList/Countdown 单独用）与 discountLoading（GoodPrice/GoodFooter 与前者联用），
        // 这里两个 key 同指 offerLoading，下游零改动、语义等价。
        priceLoading: offerLoading,
        discountLoading: offerLoading,
        productNum,
        setProductNum,
        productCurCombo,
        setProductCurCombo,
        productShowType,
        setProductShowType,
        // 自动规则折扣（限时促销），驱动 Countdown；setter 供倒计时到点局部隐藏
        autoDiscount,
        setAutoDiscount,
        // 主商品 + 推荐产品的折扣命中表，供 AssociateProductList 各卡片算折后价
        discountMap,
        // V2 选项体系
        optionAxes: axes,
        optionVariants: variants,
        hasV2Options,
        optionSelection,
        setOptionValue,
        variantResolved,
        // 各 combo 库存标记，驱动 VariantSelector 缺货虚框（缺货可选不禁用）
        stockByCombo,
        // 商品定制字段：CustomizationFields 注册取数/校验，加购时读取。
        // customizeFields 随商品详情服务端下发，经 context 透传给 CustomizationFields。
        sortKey,
        productKey,
        customizeRef,
        customizeFields,
        // 定制字段状态与回调（单例），供主区与 footer 弹窗的 CustomizationFields 共享消费
        customize
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
