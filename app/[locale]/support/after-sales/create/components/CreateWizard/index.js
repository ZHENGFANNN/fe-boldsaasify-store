"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import styles from "../../page.module.scss";
import Api from "../../../api";
import { defaultLocale } from "@/config/languageSettings";
import { fillOssImage } from "@/utils";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";

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

export default function CreateWizard({ LANG, locale }) {
  const router = useRouter();
  const tipRef = React.useRef(null);
  const fileRef = React.useRef(null);

  const [isLogin, setIsLogin] = React.useState(null);
  const [redirectPath, setRedirectPath] = React.useState(
    "/support/after-sales/create"
  );

  const [step, setStep] = React.useState(1);
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

  const canNextStep1 = () => {
    if (method === "order") return !!(selectedOrder && selectedRow);
    return !!(selectedProduct && purchaseTime && purchaseChannel.trim());
  };
  const canNextStep2 = () => !!(afterType && description.trim());

  const goNext = () => {
    if (step === 1 && !canNextStep1()) {
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
    if (step === 2 && !canNextStep2()) {
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
    setStep((s) => Math.min(3, s + 1));
  };
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

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
      setStep(1);
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
      const id = res.data?.id;
      tip(
        T(
          LANG,
          "user_account.after_sale.submit_success",
          "Your request has been submitted."
        ),
        "success"
      );
      router.push(
        localeHref(`/support/after-sales/detail?id=${id}`, locale)
      );
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
    return (
      <div className={styles.login_cta}>
        <h1>{T(LANG, "user_account.after_sale", "After-Sales Service")}</h1>
        <p>
          {T(
            LANG,
            "user_account.after_sale.login_tip",
            "Please log in to submit and track your after-sales requests."
          )}
        </p>
        <Link href={`/user/login?redirect=${encodeURIComponent(redirectPath)}`}>
          {T(LANG, "common.nav.log_in", "Log In")}
        </Link>
      </div>
    );
  }

  const stepList = [
    {
      no: 1,
      label: T(LANG, "user_account.after_sale.step1", "Select Item"),
    },
    {
      no: 2,
      label: T(LANG, "user_account.after_sale.step2", "Issue & Evidence"),
    },
    {
      no: 3,
      label: T(LANG, "user_account.after_sale.step3", "Contact & Submit"),
    },
  ];

  return (
    <div className={styles.wizard}>
      <h1 className={styles.page_title}>
        {T(LANG, "user_account.after_sale.create", "New Request")}
      </h1>

      <div className={styles.steps}>
        {stepList.map((s, i) => (
          <React.Fragment key={s.no}>
            <div
              className={`${styles.step} ${step === s.no ? styles.active : ""} ${
                step > s.no ? styles.done : ""
              }`}
            >
              <span className={styles.step_no}>{s.no}</span>
              <span className={styles.step_label}>{s.label}</span>
            </div>
            {i < stepList.length - 1 ? (
              <div
                className={`${styles.step_line} ${
                  step > s.no ? styles.done : ""
                }`}
              />
            ) : null}
          </React.Fragment>
        ))}
      </div>

      {/* ---------- 步1：选订单 / 选产品 ---------- */}
      {step === 1 ? (
        <div className={styles.panel}>
          <div className={styles.method_tabs}>
            <button
              type="button"
              className={`${styles.method_tab} ${
                method === "order" ? styles.active : ""
              }`}
              onClick={() => setMethod("order")}
            >
              {T(
                LANG,
                "user_account.after_sale.method.order",
                "Select from my orders"
              )}
            </button>
            <button
              type="button"
              className={`${styles.method_tab} ${
                method === "product" ? styles.active : ""
              }`}
              onClick={() => setMethod("product")}
            >
              {T(
                LANG,
                "user_account.after_sale.method.product",
                "Select a product"
              )}
            </button>
          </div>

          {method === "order" ? (
            <div className={styles.method_body}>
              {ordersLoading ? (
                <Loading height={200} />
              ) : orders.length < 1 ? (
                <div className={styles.empty}>
                  {T(
                    LANG,
                    "user_account.after_sale.no_orders",
                    "No orders found."
                  )}
                </div>
              ) : (
                <div className={styles.order_list}>
                  {orders.map((o) => {
                    const opened =
                      String(o.order_number) === String(selectedOrderNumber);
                    return (
                      <div key={o.order_number} className={styles.order_card}>
                        <button
                          type="button"
                          className={`${styles.order_head} ${
                            opened ? styles.active : ""
                          }`}
                          onClick={() => {
                            setSelectedOrderNumber(
                              opened ? "" : o.order_number
                            );
                            setSelectedRowIndex(-1);
                          }}
                        >
                          <span className={styles.order_no}>
                            {T(
                              LANG,
                              "user_account.my_order.order_number",
                              "Order No."
                            )}
                            : {o.order_number}
                          </span>
                          <span className={styles.order_arrow}>
                            {opened ? "−" : "+"}
                          </span>
                        </button>
                        {opened ? (
                          <div className={styles.row_list}>
                            {(o.order_list || []).map((row, ri) => {
                              const active = selectedRowIndex === ri;
                              return (
                                <button
                                  type="button"
                                  key={ri}
                                  className={`${styles.row_item} ${
                                    active ? styles.active : ""
                                  }`}
                                  onClick={() => setSelectedRowIndex(ri)}
                                >
                                  <span className={styles.row_thumb}>
                                    {rowImage(row) ? (
                                      <img
                                        src={rowImage(row)}
                                        alt={rowName(row)}
                                      />
                                    ) : null}
                                  </span>
                                  <span className={styles.row_info}>
                                    <span className={styles.row_name}>
                                      {rowName(row)}
                                    </span>
                                    {rowCombo(row) ? (
                                      <span className={styles.row_combo}>
                                        {rowCombo(row)}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className={styles.row_radio} />
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedRow ? (
                <div className={styles.selected_hint}>
                  {T(
                    LANG,
                    "user_account.after_sale.selected_product",
                    "Selected product"
                  )}
                  : <b>{rowName(selectedRow)}</b>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.method_body}>
              {productsLoading ? (
                <Loading height={200} />
              ) : productGroups.length < 1 ? (
                <div className={styles.empty}>
                  {T(
                    LANG,
                    "user_account.after_sale.no_products",
                    "No products found."
                  )}
                </div>
              ) : (
                <div className={styles.product_groups}>
                  {productGroups.map((g) => (
                    <div key={g.sort_key} className={styles.product_group}>
                      <div className={styles.group_title}>{g.name}</div>
                      <div className={styles.product_grid}>
                        {g.products.map((p) => {
                          const active = selectedProductKey === p.key;
                          return (
                            <button
                              type="button"
                              key={p.key}
                              className={`${styles.product_card} ${
                                active ? styles.active : ""
                              }`}
                              onClick={() => setSelectedProductKey(p.key)}
                            >
                              <span className={styles.product_thumb}>
                                {p.image ? (
                                  <img src={p.image} alt={p.name} />
                                ) : null}
                              </span>
                              <span className={styles.product_name}>
                                {p.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedProduct ? (
                <div className={styles.purchase_form}>
                  <div className={styles.selected_hint}>
                    {T(
                      LANG,
                      "user_account.after_sale.selected_product",
                      "Selected product"
                    )}
                    : <b>{selectedProduct.name}</b>
                  </div>
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
            </div>
          )}
        </div>
      ) : null}

      {/* ---------- 步2：售后方式 + 描述 + 媒体 ---------- */}
      {step === 2 ? (
        <div className={styles.panel}>
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
            {T(LANG, "user_account.after_sale.description", "Describe the issue")}
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
        </div>
      ) : null}

      {/* ---------- 步3：联系方式 + 隐私协议 ---------- */}
      {step === 3 ? (
        <div className={styles.panel}>
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
        </div>
      ) : null}

      {/* ---------- 底部导航 ---------- */}
      <div className={styles.actions}>
        {step > 1 ? (
          <button
            type="button"
            className={styles.btn_ghost}
            onClick={goPrev}
            disabled={submitting}
          >
            {T(LANG, "user_account.after_sale.back", "Back")}
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button type="button" className={styles.btn_primary} onClick={goNext}>
            {T(LANG, "user_account.after_sale.next", "Next")}
          </button>
        ) : (
          <button
            type="button"
            className={styles.btn_primary}
            onClick={onSubmit}
            disabled={submitting}
          >
            {T(LANG, "user_account.after_sale.submit", "Submit")}
          </button>
        )}
      </div>

      <ShowTipModal ref={tipRef} />
    </div>
  );
}
