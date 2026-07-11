"use client";

import React from "react";
import Cookies from "js-cookie";
import styles from "../../page.module.scss";
import Api from "../../../api";
import SubmitSuccess from "../SubmitSuccess";
import { defaultLocale } from "@/config/languageSettings";
import { fillOssImage } from "@/utils";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import AuthRedirectGuard from "@/components/AuthRedirectGuard";

// 文案兜底：语言包暂未配置 user_account.after_sale.* 时用英文兜底
const T = (LANG, key, fallback) => LANG?.[key] || fallback;

// 售后方式白名单（与后端 createAfterService.type 一致）
const AFTER_SALE_TYPES = ["refund", "return_refund", "repair", "exchange"];

// 媒体上传限制
const MAX_FILES = 6;
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

// 隐私协议文章路由（可配置常量）。
// TODO(P4)：该文章尚未建，待 P4 在 ERP 文章配置创建 sortKey=legal / articleKey=after-sales-privacy。
const PRIVACY_ARTICLE_PATH = "/article/legal/after-sales-privacy";

// 默认语言不带前缀，其它语言带 /{locale}（与 middleware buildLocalizedPath 约定一致）
const localeHref = (path, locale) =>
  locale && locale !== defaultLocale ? `/${locale}${path}` : path;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 订单行字段大小写容错（后端原始 order_list 行为大写字段）
const rowName = (r) => r?.Name ?? r?.name ?? "";
const rowImage = (r) => r?.Image ?? r?.image ?? "";
const rowCombo = (r) => r?.ComboName ?? r?.comboName ?? "";
const rowProductKey = (r) => r?.ProductKey ?? r?.productKey ?? "";
const rowSortKey = (r) => r?.SortKey ?? r?.sortKey ?? "";

// 全语言全商品：按当前 language 过滤 + 按 sort_key 聚合（复刻 getRemoteProductList 思路）
function buildProductGroups(list, locale) {
  const byLang = {};
  (list || []).forEach((item) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];
  const map = {};
  localeList.forEach((item) => {
    const sk = item.sort_key;
    const sortInfo = item.goodSort?.[0] || {};
    if (!map[sk]) {
      map[sk] = {
        sort_key: sk,
        name: sortInfo.name || sk,
        weight: sortInfo.weight || 0,
        products: [],
      };
    }
    map[sk].products.push({
      key: item.key,
      sort_key: sk,
      name: item.name,
      image: fillOssImage(item.image_list?.[0]?.src || ""),
    });
  });
  return Object.values(map).sort((a, b) => (b.weight || 0) - (a.weight || 0));
}

// 可搜索下拉选择框：选项内含产品图片，输入即过滤
function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = options.find((o) => o.value === value) || null;
  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? options.filter((o) =>
        `${o.label} ${o.subLabel || ""}`.toLowerCase().includes(kw)
      )
    : options;

  const renderOptBody = (o) => (
    <>
      <span className={styles.opt_thumb}>
        {o.image ? <img src={o.image} alt="" /> : null}
      </span>
      <span className={styles.opt_text}>
        <span className={styles.opt_label}>{o.label}</span>
        {o.subLabel ? <span className={styles.opt_sub}>{o.subLabel}</span> : null}
      </span>
    </>
  );

  return (
    <div className={styles.select} ref={rootRef}>
      <button
        type="button"
        className={`${styles.select_trigger} ${open ? styles.select_open : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? (
          <span className={styles.opt_main}>{renderOptBody(selected)}</span>
        ) : (
          <span className={styles.select_ph}>{placeholder}</span>
        )}
        <span className={styles.select_arrow}>▾</span>
      </button>
      {open ? (
        <div className={styles.select_panel}>
          <input
            className={styles.select_search}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
          />
          <div className={styles.select_list}>
            {filtered.length ? (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  className={`${styles.opt} ${
                    o.value === value ? styles.opt_active : ""
                  }`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  {renderOptBody(o)}
                </button>
              ))
            ) : (
              <div className={styles.select_empty}>{emptyText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CreateWizard({ LANG, locale }) {
  const tipRef = React.useRef(null);
  const fileRef = React.useRef(null);

  const [isLogin, setIsLogin] = React.useState(null);
  const [redirectPath, setRedirectPath] = React.useState(
    "/support/after-sales/create"
  );

  // 引导式分步：activeStep 为当前展开步；完成态由数据实时派生（isStepDone）
  const [activeStep, setActiveStep] = React.useState(1);
  const [method, setMethod] = React.useState("order"); // report_type: order | product

  // 方式A：选订单
  const [orders, setOrders] = React.useState([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = React.useState("");
  const [selectedRowIndex, setSelectedRowIndex] = React.useState(-1);

  // 方式B：选产品
  const [productGroups, setProductGroups] = React.useState([]);
  const [productsLoading, setProductsLoading] = React.useState(false);
  const [productsLoaded, setProductsLoaded] = React.useState(false);
  const [selectedProductKey, setSelectedProductKey] = React.useState("");
  const [purchaseTime, setPurchaseTime] = React.useState("");
  const [purchaseChannel, setPurchaseChannel] = React.useState("");
  const [purchaseOrderNo, setPurchaseOrderNo] = React.useState("");

  // 步2：售后方式 + 描述 + 媒体
  const [afterType, setAfterType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [mediaList, setMediaList] = React.useState([]);

  // 步3：联系方式 + 隐私协议
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [agreePrivacy, setAgreePrivacy] = React.useState(false);

  const [submitting, setSubmitting] = React.useState(false);
  // 提单成功后记录工单号，非空即切换到成功组件替代向导
  const [submittedServiceNo, setSubmittedServiceNo] = React.useState(null);

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

  const tip = React.useCallback((text, type = "info") => {
    tipRef.current?.show({ text, type });
  }, []);

  // 登录门槛 + 预选订单号（个人中心跳来）。
  // cookie/URL 仅挂载后可读（SSR 无 window），故在 effect 内同步 setState。
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setIsLogin(!!Cookies.get("token"));
    const search = new URLSearchParams(window.location.search);
    const orderNumber = search.get("orderNumber");
    if (orderNumber) {
      setMethod("order");
      setSelectedOrderNumber(orderNumber);
    }
    setRedirectPath(`${window.location.pathname}${window.location.search}`);
  }, []);

  const loadOrders = React.useCallback(() => {
    setOrdersLoading(true);
    Api.getOrderList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setOrders(res.data?.list ?? []);
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  const loadProducts = React.useCallback(() => {
    if (productsLoaded) return;
    setProductsLoading(true);
    Api.getProductList()
      .then((res) => {
        if (res.code !== 0) throw new Error("code!==0");
        setProductGroups(buildProductGroups(res.data?.list, locale));
        setProductsLoaded(true);
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, [productsLoaded, locale]);

  React.useEffect(() => {
    if (isLogin) loadOrders();
  }, [isLogin, loadOrders]);

  React.useEffect(() => {
    if (isLogin && method === "product") loadProducts();
  }, [isLogin, method, loadProducts]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 卸载时回收所有本地预览 URL
  React.useEffect(() => {
    return () => {
      mediaList.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrder = React.useMemo(
    () =>
      orders.find(
        (o) => String(o.order_number) === String(selectedOrderNumber)
      ) || null,
    [orders, selectedOrderNumber]
  );

  const selectedRow = React.useMemo(() => {
    if (!selectedOrder) return null;
    return selectedOrder.order_list?.[selectedRowIndex] ?? null;
  }, [selectedOrder, selectedRowIndex]);

  const selectedProduct = React.useMemo(() => {
    for (const g of productGroups) {
      const p = g.products.find((x) => x.key === selectedProductKey);
      if (p) return p;
    }
    return null;
  }, [productGroups, selectedProductKey]);

  // 归一化的产品信息（提交所需）
  const productPayload = React.useMemo(() => {
    if (method === "order" && selectedRow) {
      return {
        product_name: rowName(selectedRow),
        product_key: rowProductKey(selectedRow),
        sort_key: rowSortKey(selectedRow),
      };
    }
    if (method === "product" && selectedProduct) {
      return {
        product_name: selectedProduct.name,
        product_key: selectedProduct.key,
        sort_key: selectedProduct.sort_key,
      };
    }
    return null;
  }, [method, selectedRow, selectedProduct]);

  const uploadingCount = mediaList.filter((m) => m.uploading).length;

  const addAndUpload = React.useCallback(
    (files) => {
      const remaining = MAX_FILES - mediaList.length;
      if (remaining <= 0) {
        tip(
          T(
            LANG,
            "user_account.after_sale.media.max_files",
            `You can upload up to ${MAX_FILES} files.`
          ),
          "error"
        );
        return;
      }
      const accepted = [];
      for (const file of files) {
        if (accepted.length >= remaining) {
          tip(
            T(
              LANG,
              "user_account.after_sale.media.max_files",
              `You can upload up to ${MAX_FILES} files.`
            ),
            "error"
          );
          break;
        }
        if (file.size > MAX_SIZE) {
          tip(
            `${file.name}: ${T(
              LANG,
              "user_account.after_sale.media.too_large",
              "File exceeds the 200MB limit."
            )}`,
            "error"
          );
          continue;
        }
        accepted.push(file);
      }
      if (!accepted.length) return;

      const items = accepted.map((file) => {
        const isImage = (file.type || "").startsWith("image");
        const isVideo = (file.type || "").startsWith("video");
        return {
          localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          size: file.size,
          type: isVideo ? "video" : isImage ? "image" : "file",
          previewUrl: isImage || isVideo ? URL.createObjectURL(file) : "",
          url: "",
          uploading: true,
        };
      });
      setMediaList((prev) => [...prev, ...items]);

      items.forEach((item) => {
        Api.uploadMedia(item.file)
          .then((r) => {
            const info = r?.url ? r : r?.data || {};
            if (!info.url) throw new Error("no url");
            setMediaList((prev) =>
              prev.map((m) =>
                m.localId === item.localId
                  ? {
                      ...m,
                      url: info.url,
                      name: info.name || m.name,
                      type: info.type || m.type,
                      size: info.size || m.size,
                      uploading: false,
                    }
                  : m
              )
            );
          })
          .catch(() => {
            setMediaList((prev) =>
              prev.filter((m) => m.localId !== item.localId)
            );
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            tip(
              `${item.name}: ${T(
                LANG,
                "user_account.after_sale.media.upload_fail",
                "Upload failed. Please try again."
              )}`,
              "error"
            );
          });
      });
    },
    [mediaList.length, LANG, tip]
  );

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length) addAndUpload(files);
  };

  const removeMedia = (localId) => {
    setMediaList((prev) => {
      const target = prev.find((m) => m.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.localId !== localId);
    });
  };

  // 各步完成态实时派生（无需单独状态机）
  const step1Done =
    method === "order"
      ? !!(selectedOrder && selectedRow)
      : !!(selectedProduct && purchaseTime && purchaseChannel.trim());
  const step2Done = !!(afterType && description.trim());

  const confirmStep1 = () => {
    if (!step1Done) {
      tip(
        T(
          LANG,
          "user_account.after_sale.step1.require",
          "Please select the item you need help with."
        ),
        "error"
      );
      return;
    }
    setActiveStep(2);
  };
  const confirmStep2 = () => {
    if (!step2Done) {
      tip(
        T(
          LANG,
          "user_account.after_sale.step2.require",
          "Please choose a service type and describe the issue."
        ),
        "error"
      );
      return;
    }
    setActiveStep(3);
  };

  const onSubmit = async () => {
    if (submitting) return;
    if (uploadingCount > 0) {
      tip(
        T(
          LANG,
          "user_account.after_sale.media.wait_upload",
          "Please wait for uploads to finish."
        ),
        "info"
      );
      return;
    }
    if (!EMAIL_RE.test(contactEmail)) {
      tip(
        T(
          LANG,
          "user_account.after_sale.contact.email_invalid",
          "Please enter a valid email address."
        ),
        "error"
      );
      return;
    }
    if (!contactPhone.trim()) {
      tip(
        T(
          LANG,
          "user_account.after_sale.contact.phone_require",
          "Please enter a phone number."
        ),
        "error"
      );
      return;
    }
    if (!agreePrivacy) {
      tip(
        T(
          LANG,
          "user_account.after_sale.privacy.require",
          "Please agree to the privacy policy to continue."
        ),
        "error"
      );
      return;
    }
    if (!productPayload) {
      setActiveStep(1);
      return;
    }

    const media = mediaList
      .filter((m) => m.url)
      .map(({ url, name, type, size }) => ({ url, name, type, size }));

    const payload = {
      report_type: method,
      type: afterType,
      description: description.trim(),
      media,
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      product_key: productPayload.product_key,
      product_name: productPayload.product_name,
      sort_key: productPayload.sort_key,
    };
    if (method === "order") {
      payload.order_number = selectedOrder?.order_number || "";
    } else {
      payload.purchase_time = purchaseTime;
      payload.purchase_channel = purchaseChannel.trim();
      payload.purchase_order_no = purchaseOrderNo.trim();
    }

    setSubmitting(true);
    try {
      const res = await Api.createAfterService(payload);
      if (res.code !== 0) throw new Error("code!==0");
      const serviceNo = res.data?.service_no;
      // 提单成功：切换到成功组件（替代向导表单），不再直接跳转/弹 toast
      setSubmittedServiceNo(serviceNo ?? "");
    } catch (err) {
      tip(
        T(
          LANG,
          "user_account.after_sale.submit_fail",
          "Submission failed. Please try again."
        ),
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- 渲染 ----------
  if (isLogin === null) {
    return <Loading height={400} />;
  }

  if (!isLogin) {
    return <AuthRedirectGuard LANG={LANG} redirectPath={redirectPath} />;
  }

  if (submittedServiceNo !== null) {
    return (
      <SubmitSuccess
        LANG={LANG}
        locale={locale}
        serviceNo={submittedServiceNo}
      />
    );
  }

  // 新 UI 文案（locale 兜底：zh 显示中文，其它显示英文）
  const TL = (key, zh, en) =>
    LANG?.[key] || (locale?.startsWith("zh") ? zh : en);

  const orderNoLabel = T(LANG, "user_account.my_order.order_number", "Order No.");

  // 订单行 → 可搜索下拉选项（含产品图片）
  const orderOptions = orders.flatMap((o) =>
    (o.order_list || []).map((row, ri) => ({
      value: `${o.order_number}__${ri}`,
      label: rowName(row),
      subLabel: `${orderNoLabel}: ${o.order_number}${
        rowCombo(row) ? ` · ${rowCombo(row)}` : ""
      }`,
      image: rowImage(row),
    }))
  );
  const orderValue =
    selectedOrderNumber && selectedRowIndex >= 0
      ? `${selectedOrderNumber}__${selectedRowIndex}`
      : "";

  // 产品 → 可搜索下拉选项（含产品图片）
  const productOptions = productGroups.flatMap((g) =>
    g.products.map((p) => ({
      value: p.key,
      label: p.name,
      subLabel: g.name,
      image: p.image,
    }))
  );

  // 步1 已填摘要
  const step1Summary =
    method === "order" && selectedRow
      ? {
          image: rowImage(selectedRow),
          name: rowName(selectedRow),
          sub: `${orderNoLabel}: ${selectedOrderNumber}`,
        }
      : method === "product" && selectedProduct
      ? {
          image: selectedProduct.image,
          name: selectedProduct.name,
          sub: [purchaseTime, purchaseChannel].filter(Boolean).join(" · "),
        }
      : null;

  const unlocked2 = step1Done;
  const unlocked3 = step1Done && step2Done;

  const stepBadge = (n, done) => (
    <span
      className={`${styles.step_badge} ${done ? styles.step_badge_done : ""}`}
    >
      {done ? "✓" : n}
    </span>
  );

  const editBtn = (onClick) => (
    <button type="button" className={styles.step_edit} onClick={onClick}>
      {TL("user_account.after_sale.edit", "编辑", "Edit")}
    </button>
  );

  const searchPh = TL("user_account.after_sale.search_ph", "搜索…", "Search…");
  const noMatch = TL(
    "user_account.after_sale.no_match",
    "无匹配结果",
    "No matches"
  );

  return (
    <div className={styles.wizard}>
      <h1 className={styles.page_title}>
        {T(
          LANG,
          "user_account.after_sale.create",
          locale?.startsWith("zh") ? "售后服务" : "After-Sales Service"
        )}
      </h1>

      <div className={styles.stack}>
        {/* ---------- 步1：选订单号 / 产品型号 ---------- */}
        <section
          className={`${styles.stepblock} ${
            activeStep === 1 ? styles.active : ""
          }`}
        >
          <div className={styles.stepblock_head}>
            {stepBadge(1, step1Done && activeStep !== 1)}
            <span className={styles.stepblock_title}>
              {TL(
                "user_account.after_sale.step1_title",
                "请选择订单号 / 产品型号",
                "Select order / product model"
              )}
            </span>
            {activeStep !== 1 && step1Done
              ? editBtn(() => setActiveStep(1))
              : null}
          </div>

          {activeStep === 1 ? (
            <div className={styles.stepblock_body}>
              <div
                className={`${styles.seg_tabs} ${
                  method === "order" ? styles.seg_left : styles.seg_right
                }`}
              >
                <button
                  type="button"
                  className={`${styles.seg_item} ${
                    method === "order" ? styles.active : ""
                  }`}
                  onClick={() => setMethod("order")}
                >
                  {T(LANG, "user_account.after_sale.method.order", "Order")}
                </button>
                <button
                  type="button"
                  className={`${styles.seg_item} ${
                    method === "product" ? styles.active : ""
                  }`}
                  onClick={() => setMethod("product")}
                >
                  {T(LANG, "user_account.after_sale.method.product", "Product")}
                </button>
              </div>

              {method === "order" ? (
                ordersLoading ? (
                  <Loading height={160} />
                ) : orders.length < 1 ? (
                  <div className={styles.empty}>
                    {T(
                      LANG,
                      "user_account.after_sale.no_orders",
                      "No orders found."
                    )}
                  </div>
                ) : (
                  <SearchSelect
                    options={orderOptions}
                    value={orderValue}
                    onChange={(v) => {
                      const [ono, ri] = v.split("__");
                      setSelectedOrderNumber(ono);
                      setSelectedRowIndex(Number(ri));
                    }}
                    placeholder={TL(
                      "user_account.after_sale.order_ph",
                      "选择订单商品",
                      "Select an order item"
                    )}
                    searchPlaceholder={searchPh}
                    emptyText={noMatch}
                  />
                )
              ) : (
                <>
                  {productsLoading ? (
                    <Loading height={160} />
                  ) : productGroups.length < 1 ? (
                    <div className={styles.empty}>
                      {T(
                        LANG,
                        "user_account.after_sale.no_products",
                        "No products found."
                      )}
                    </div>
                  ) : (
                    <SearchSelect
                      options={productOptions}
                      value={selectedProductKey}
                      onChange={(v) => setSelectedProductKey(v)}
                      placeholder={TL(
                        "user_account.after_sale.product_ph",
                        "选择产品型号",
                        "Select a product model"
                      )}
                      searchPlaceholder={searchPh}
                      emptyText={noMatch}
                    />
                  )}

                  {selectedProduct ? (
                    <div className={styles.purchase_form}>
                      <label className={styles.field}>
                        <span className={styles.field_label}>
                          {T(
                            LANG,
                            "user_account.after_sale.purchase_time",
                            "Purchase date"
                          )}
                          <i>*</i>
                        </span>
                        <input
                          type="date"
                          value={purchaseTime}
                          onChange={(e) => setPurchaseTime(e.target.value)}
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.field_label}>
                          {T(
                            LANG,
                            "user_account.after_sale.purchase_channel",
                            "Purchase channel"
                          )}
                          <i>*</i>
                        </span>
                        <input
                          type="text"
                          value={purchaseChannel}
                          onChange={(e) => setPurchaseChannel(e.target.value)}
                          placeholder={T(
                            LANG,
                            "user_account.after_sale.purchase_channel_ph",
                            "e.g. Official website, Amazon"
                          )}
                        />
                      </label>
                      <label className={styles.field}>
                        <span className={styles.field_label}>
                          {T(
                            LANG,
                            "user_account.after_sale.purchase_order_no",
                            "Purchase order number"
                          )}
                        </span>
                        <input
                          type="text"
                          value={purchaseOrderNo}
                          onChange={(e) => setPurchaseOrderNo(e.target.value)}
                          placeholder={T(
                            LANG,
                            "user_account.after_sale.optional",
                            "Optional"
                          )}
                        />
                      </label>
                    </div>
                  ) : null}
                </>
              )}

              <div className={styles.step_actions}>
                <button
                  type="button"
                  className={styles.btn_primary}
                  onClick={confirmStep1}
                >
                  {T(LANG, "user_account.after_sale.next", "Next")}
                </button>
              </div>
            </div>
          ) : step1Done ? (
            <div className={styles.stepblock_summary}>
              <span className={styles.summary_thumb}>
                {step1Summary?.image ? (
                  <img src={step1Summary.image} alt="" />
                ) : null}
              </span>
              <span className={styles.summary_text}>
                <span className={styles.summary_name}>{step1Summary?.name}</span>
                {step1Summary?.sub ? (
                  <span className={styles.summary_sub}>{step1Summary.sub}</span>
                ) : null}
              </span>
            </div>
          ) : null}
        </section>

        {/* ---------- 步2：售后问题 ---------- */}
        <section
          className={`${styles.stepblock} ${
            activeStep === 2 ? styles.active : ""
          } ${!unlocked2 ? styles.locked : ""}`}
        >
          <div className={styles.stepblock_head}>
            {stepBadge(2, step2Done && activeStep !== 2)}
            <span className={styles.stepblock_title}>
              {TL(
                "user_account.after_sale.step2_title",
                "请输入售后问题",
                "Describe your after-sales issue"
              )}
            </span>
            {activeStep !== 2 && step2Done
              ? editBtn(() => setActiveStep(2))
              : null}
          </div>

          {activeStep === 2 ? (
            <div className={styles.stepblock_body}>
              <div className={styles.section_label}>
                {T(
                  LANG,
                  "user_account.after_sale.service_type",
                  "How can we help?"
                )}
                <i>*</i>
              </div>
              <div className={styles.type_options}>
                {AFTER_SALE_TYPES.map((k) => (
                  <button
                    type="button"
                    key={k}
                    className={`${styles.type_option} ${
                      afterType === k ? styles.active : ""
                    }`}
                    onClick={() => setAfterType(k)}
                  >
                    {typeLabelMap[k]}
                  </button>
                ))}
              </div>

              <div className={styles.section_label}>
                {T(
                  LANG,
                  "user_account.after_sale.description",
                  "Describe the issue"
                )}
                <i>*</i>
              </div>
              <textarea
                className={styles.textarea}
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={T(
                  LANG,
                  "user_account.after_sale.description_ph",
                  "Tell us what happened so we can help faster."
                )}
              />

              <div className={styles.section_label}>
                {T(LANG, "user_account.after_sale.media", "Photos / Videos")}
                <span className={styles.section_note}>
                  {T(
                    LANG,
                    "user_account.after_sale.media.note",
                    `Up to ${MAX_FILES} files, max 200MB each`
                  )}
                </span>
              </div>
              <div className={styles.media_list}>
                {mediaList.map((m) => (
                  <div key={m.localId} className={styles.media_item}>
                    {m.type === "video" ? (
                      <video
                        src={m.previewUrl || m.url}
                        className={styles.media_thumb}
                      />
                    ) : (
                      <img
                        src={m.previewUrl || m.url}
                        alt={m.name}
                        className={styles.media_thumb}
                      />
                    )}
                    {m.uploading ? (
                      <div className={styles.media_uploading}>
                        <span className={styles.spinner} />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className={styles.media_remove}
                      onClick={() => removeMedia(m.localId)}
                      aria-label="remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {mediaList.length < MAX_FILES ? (
                  <button
                    type="button"
                    className={styles.media_add}
                    onClick={() => fileRef.current?.click()}
                  >
                    <span>+</span>
                    {T(LANG, "user_account.after_sale.media.add", "Add")}
                  </button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={onPickFiles}
              />

              <div className={styles.step_actions}>
                <button
                  type="button"
                  className={styles.btn_primary}
                  onClick={confirmStep2}
                >
                  {T(LANG, "user_account.after_sale.next", "Next")}
                </button>
              </div>
            </div>
          ) : step2Done ? (
            <div className={styles.stepblock_summary}>
              <span className={styles.summary_text}>
                <span className={styles.summary_name}>
                  {typeLabelMap[afterType]}
                </span>
                <span className={styles.summary_sub}>{description}</span>
              </span>
            </div>
          ) : null}
        </section>

        {/* ---------- 步3：基本信息 ---------- */}
        <section
          className={`${styles.stepblock} ${
            activeStep === 3 ? styles.active : ""
          } ${!unlocked3 ? styles.locked : ""}`}
        >
          <div className={styles.stepblock_head}>
            {stepBadge(3, false)}
            <span className={styles.stepblock_title}>
              {TL(
                "user_account.after_sale.step3_title",
                "填写基本信息",
                "Fill in your contact information"
              )}
            </span>
          </div>

          {activeStep === 3 ? (
            <div className={styles.stepblock_body}>
              <label className={styles.field}>
                <span className={styles.field_label}>
                  {T(LANG, "user_account.after_sale.contact.email", "Email")}
                  <i>*</i>
                </span>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.field_label}>
                  {T(LANG, "user_account.after_sale.contact.phone", "Phone")}
                  <i>*</i>
                </span>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder={T(
                    LANG,
                    "user_account.after_sale.contact.phone_ph",
                    "Contact phone number"
                  )}
                />
              </label>

              <label className={styles.privacy}>
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                />
                <span>
                  {T(
                    LANG,
                    "user_account.after_sale.privacy.prefix",
                    "I have read and agree to the"
                  )}{" "}
                  <a
                    href={localeHref(PRIVACY_ARTICLE_PATH, locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {T(
                      LANG,
                      "user_account.after_sale.privacy.link",
                      "After-Sales Privacy Policy"
                    )}
                  </a>
                </span>
              </label>

              <div className={styles.step_actions}>
                <button
                  type="button"
                  className={styles.btn_primary}
                  onClick={onSubmit}
                  disabled={submitting}
                >
                  {T(LANG, "user_account.after_sale.submit", "Submit")}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <ShowTipModal ref={tipRef} />
    </div>
  );
}
