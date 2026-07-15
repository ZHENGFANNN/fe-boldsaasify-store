"use client";

import React from "react";
import Cookies from "js-cookie";
import { Provider, useAtom, useAtomValue, useSetAtom } from "jotai";
import styles from "./index.module.scss";
import pageStyles from "../../page.module.scss";
import Api from "../../../api";
import SubmitSuccess from "../SubmitSuccess";
import StepBlock from "../StepBlock";
import StepSummary from "../StepSummary";
import OrderProductModule from "../OrderProductModule";
import IssueModule from "../IssueModule";
import ContactModule from "../ContactModule";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import AuthRedirectGuard from "@/components/Auth/AuthRedirectGuard";
import { defaultLocale } from "@/config/languageSettings";
import CreateWizardContext from "../../context";
import {
  methodAtom,
  ordersAtom,
  ordersLoadingAtom,
  productGroupsAtom,
  productsLoadingAtom,
  productsLoadedAtom,
  selectedOrderNumberAtom,
  selectedRowIndexAtom,
  activeStepAtom,
  step1DoneAtom,
  step2DoneAtom,
  submittedServiceNoAtom,
  selectedOrderAtom,
  selectedRowAtom,
  selectedProductAtom,
  descriptionAtom,
  afterTypeAtom,
  purchaseTimeAtom,
  purchaseChannelAtom,
  purchaseOrderNoAtom,
  buildProductGroups,
  rowName,
} from "../../atoms";

// ---------- 常量 ----------
const AFTER_SALE_TYPES = ["repair", "return_refund", "exchange", "refund"];
const MAX_FILES = 6;
const MAX_SIZE = 200 * 1024 * 1024; // 200MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// TODO(P4)：文章尚未建，待 ERP 文章配置创建 sortKey=legal / articleKey=after-sales-privacy。
const PRIVACY_ARTICLE_PATH = "/article/legal/after-sales-privacy";

// 默认语言不带前缀，其它语言带 /{locale}（与 middleware buildLocalizedPath 约定一致）
const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

// 文案兜底：语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

export default function CreateWizard({ LANG, locale }) {
  const [isLogin, setIsLogin] = React.useState(null);
  const [redirectPath, setRedirectPath] = React.useState(
    "/support/after-sales/create"
  );

  // 登录判断 + URL 参数解析（cookie/URL 仅挂载后可读，SSR 无 window，故在 effect 内同步 setState）
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setIsLogin(!!Cookies.get("token"));
    setRedirectPath(`${window.location.pathname}${window.location.search}`);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (isLogin === null) {
    return (
      <div className={pageStyles.container}>
        <Loading height={400} />
      </div>
    );
  }

  // 未登录：直接返回守卫卡片，不套 .container 外层
  if (!isLogin) {
    return <AuthRedirectGuard LANG={LANG} redirectPath={redirectPath} />;
  }

  // 登录态下才挂 jotai <Provider>：atom 只在真正需要时创建，
  // 未登录用户不产生 atom store 实例。
  return (
    <div className={pageStyles.container}>
      <Provider>
        <WizardBody LANG={LANG} locale={locale} />
      </Provider>
    </div>
  );
}

// 已登录内嵌壳：Context Provider + 数据拉取 + URL 预填 + 主流程渲染切换
function WizardBody({ LANG, locale }) {
  const tipRef = React.useRef(null);

  const tip = React.useCallback((text, type = "info") => {
    tipRef.current?.show({ text, type });
  }, []);

  const TL = React.useCallback(
    (key, zh, en) => LANG?.[key] || (locale?.startsWith("zh") ? zh : en),
    [LANG, locale]
  );

  const typeLabelMap = React.useMemo(
    () => ({
      refund: T(LANG, "user_account.after_sale.type.refund", "Refund"),
      return_refund: T(
        LANG,
        "user_account.after_sale.type.return_refund",
        "Return & Refund"
      ),
      repair: T(LANG, "user_account.after_sale.type.repair", "Repair"),
      exchange: T(LANG, "user_account.after_sale.type.exchange", "Exchange"),
    }),
    [LANG]
  );

  const orderNoLabel = T(
    LANG,
    "user_account.my_order.order_number",
    "Order No."
  );
  const searchPh = TL("user_account.after_sale.search_ph", "搜索…", "Search…");
  const noMatch = TL(
    "user_account.after_sale.no_match",
    "无匹配结果",
    "No matches"
  );

  const ctxValue = React.useMemo(
    () => ({
      LANG,
      locale,
      T,
      TL,
      tip,
      typeLabelMap,
      orderNoLabel,
      searchPh,
      noMatch,
      AFTER_SALE_TYPES,
      MAX_FILES,
      MAX_SIZE,
      EMAIL_RE,
      PRIVACY_ARTICLE_PATH,
      localeHref,
    }),
    [LANG, locale, TL, tip, typeLabelMap, orderNoLabel, searchPh, noMatch]
  );

  return (
    <CreateWizardContext.Provider value={ctxValue}>
      <WizardMain />
      <ShowTipModal ref={tipRef} />
    </CreateWizardContext.Provider>
  );
}

// 主流程：URL 预填 / 数据拉取 / 提单成功切换 / StepBlock 编排
function WizardMain() {
  const [method] = useAtom(methodAtom);
  const setMethod = useSetAtom(methodAtom);
  const setSelectedOrderNumber = useSetAtom(selectedOrderNumberAtom);
  const setSelectedRowIndex = useSetAtom(selectedRowIndexAtom);
  const setOrders = useSetAtom(ordersAtom);
  const setOrdersLoading = useSetAtom(ordersLoadingAtom);
  const setProductGroups = useSetAtom(productGroupsAtom);
  const setProductsLoading = useSetAtom(productsLoadingAtom);
  const [productsLoaded, setProductsLoaded] = useAtom(productsLoadedAtom);

  const [activeStep, setActiveStep] = useAtom(activeStepAtom);
  const step1Done = useAtomValue(step1DoneAtom);
  const step2Done = useAtomValue(step2DoneAtom);
  const submittedServiceNo = useAtomValue(submittedServiceNoAtom);

  // 步 1 摘要派生
  const selectedOrderNumber = useAtomValue(selectedOrderNumberAtom);
  const selectedRow = useAtomValue(selectedRowAtom);
  const selectedProduct = useAtomValue(selectedProductAtom);
  const purchaseTime = useAtomValue(purchaseTimeAtom);
  const purchaseChannel = useAtomValue(purchaseChannelAtom);
  const purchaseOrderNo = useAtomValue(purchaseOrderNoAtom);

  // 步 2 摘要派生
  const afterType = useAtomValue(afterTypeAtom);
  const description = useAtomValue(descriptionAtom);

  const { LANG, locale, TL, typeLabelMap, orderNoLabel } = React.useContext(
    CreateWizardContext
  );

  // URL query `orderNumber`：从个人中心跳来时预选订单号
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const orderNumber = search.get("orderNumber");
    if (orderNumber) {
      setMethod("order");
      setSelectedOrderNumber(orderNumber);
    }
  }, [setMethod, setSelectedOrderNumber]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 拉订单列表（登录后 mount 一次）
  React.useEffect(() => {
    setOrdersLoading(true);
    Api.getOrderList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setOrders(res.data?.list ?? []);
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [setOrders, setOrdersLoading]);

  // 懒拉全商品：切到 product 方式且未加载过时拉一次
  React.useEffect(() => {
    if (method !== "product" || productsLoaded) return;
    setProductsLoading(true);
    Api.getProductList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setProductGroups(buildProductGroups(res.data?.list, locale));
        setProductsLoaded(true);
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, [
    method,
    productsLoaded,
    locale,
    setProductGroups,
    setProductsLoaded,
    setProductsLoading,
  ]);

  // 提单成功：切换到成功组件（替代向导表单），不再直接跳转/弹 toast
  if (submittedServiceNo !== null) {
    return (
      <SubmitSuccess
        LANG={LANG}
        locale={locale}
        serviceNo={submittedServiceNo}
      />
    );
  }

  const unlocked2 = activeStep >= 2;
  const unlocked3 = activeStep >= 3;

  const purchaseDateLabel = TL(
    "user_account.after_sale.purchase_time",
    "购买日期",
    "Purchase date"
  );
  const purchaseChannelLabel = TL(
    "user_account.after_sale.purchase_channel",
    "购买渠道",
    "Purchase channel"
  );
  const issueTypeLabel = TL(
    "user_account.after_sale.service_type_label",
    "服务类型",
    "Service type"
  );
  const issueDescLabel = TL(
    "user_account.after_sale.description_label",
    "问题描述",
    "Issue description"
  );

  const productNameLabel = TL(
    "user_account.after_sale.product_name",
    "产品名称",
    "Product name"
  );

  const step1Summary =
    method === "order" && selectedRow ? (
      <StepSummary
        rows={[
          [productNameLabel, rowName(selectedRow)],
          [orderNoLabel, selectedOrderNumber],
        ].filter(([, v]) => Boolean(v))}
      />
    ) : method === "product" && selectedProduct ? (
      <StepSummary
        rows={[
          [productNameLabel, selectedProduct.name],
          [orderNoLabel, purchaseOrderNo],
          [purchaseDateLabel, purchaseTime],
          [purchaseChannelLabel, purchaseChannel],
        ].filter(([, v]) => Boolean(v))}
      />
    ) : null;

  const step2Summary =
    afterType && description ? (
      <StepSummary
        rows={[
          [issueTypeLabel, typeLabelMap[afterType]],
          [issueDescLabel, description],
        ]}
      />
    ) : null;

  const editLabel = TL("user_account.after_sale.edit", "编辑", "Edit");

  return (
    <div className={styles.wizard}>
      <h1 className="header">
        {T(
          LANG,
          "user_account.after_sale.create",
          locale?.startsWith("zh") ? "售后服务" : "After-Sales Service"
        )}
      </h1>

      <div className={styles.stack}>
        <StepBlock
          step={1}
          title={TL(
            "user_account.after_sale.step1_title",
            "产品信息",
            "Product information"
          )}
          subtitle={TL(
            "user_account.after_sale.step1_subtitle",
            "选择需要申请售后的订单或产品型号",
            "Select the order or product model you need help with"
          )}
          active={activeStep === 1}
          done={step1Done && activeStep !== 1}
          editLabel={editLabel}
          onEdit={() => setActiveStep(1)}
          summary={step1Summary}
        >
          <OrderProductModule />
        </StepBlock>

        <StepBlock
          step={2}
          title={TL(
            "user_account.after_sale.step2_title",
            "问题描述",
            "Issue description"
          )}
          subtitle={TL(
            "user_account.after_sale.step2_subtitle",
            "请告诉我们,您的设备遇到了什么问题",
            "Tell us what happened with your device"
          )}
          active={activeStep === 2}
          done={step2Done && activeStep !== 2}
          locked={!unlocked2}
          editLabel={editLabel}
          onEdit={() => setActiveStep(2)}
          summary={step2Summary}
        >
          <IssueModule />
        </StepBlock>

        <StepBlock
          step={3}
          title={TL(
            "user_account.after_sale.step3_title",
            "联系方式",
            "Contact information"
          )}
          subtitle={TL(
            "user_account.after_sale.step3_subtitle",
            "填写您的联系方式以便我们与您沟通",
            "Fill in your contact information so we can reach you"
          )}
          active={activeStep === 3}
          done={false}
          locked={!unlocked3}
        >
          <ContactModule />
        </StepBlock>
      </div>
    </div>
  );
}
