/** @format */

import ReactDOM from "react-dom";
import React from "react";
import styles from "./index.module.scss";

import tracking from "../tracking";

import GlobalContext from "../../../[locale]/context";
import { formatCurrency } from "../../../utils";
import resolveCartFromApi from "../cartClient";
import api from "../../../request";
import Skeleton from "@/components/Skeleton";
import {
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
  formatRejectedCodeMessage,
} from "@/utils/discount-codes";

import { useRouter } from "next/navigation";

// 解析 previewOrder 返回的金额字符串/数字 → number。
function parseAmount(v) {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const EmptyCart = function ({ handleClose }) {
  const { LANG } = React.useContext(GlobalContext);
  return (
    <div className={styles.empty_container}>
      <div className={styles.img_container}>
        <img
          alt="empty"
          src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-utils-empyt.svg`}
        />
      </div>
      <p>{LANG["common.cart.cart_empty"]}</p>
      <div
        className={styles.continue_order}
        onClick={() => {
          handleClose();
        }}
      >
        {LANG["common.cart.continue_order"]}
      </div>
    </div>
  );
};

// 加载中骨架：根据 localStorage 中保存的购物车商品数渲染对应行数（最多 3 行），
// 与真实 table_body_item 同结构（图片 80×80 + 名称/规格/价格 + 数量+删除占位）。
const CartSkeleton = function ({ rowCount }) {
  const rows = Math.max(1, Math.min(rowCount || 1, 3));
  return (
    <div className={styles.table_body}>
      {Array.from({ length: rows }).map((_, idx) => (
        <section key={idx} className={styles.table_body_item}>
          <div className={styles.table_body_goods}>
            <div className={styles.good_item}>
              <div className={styles.body_goods_img}>
                <Skeleton variant="rect" width={80} height={80} />
              </div>
              <div className={styles.product_info}>
                <div className={styles.product_content}>
                  <div className={styles.title}>
                    <Skeleton variant="text" width="80%" height={16} />
                  </div>
                  <div className={styles.content_combo}>
                    <Skeleton variant="text" width={120} height={12} />
                  </div>
                  <div className={styles.plan_goods}>
                    <Skeleton variant="text" width={80} height={12} />
                  </div>
                </div>
                <div className={styles.table_body_price}>
                  <div className={styles.price}>
                    <Skeleton variant="text" width={64} height={16} />
                  </div>
                </div>
                <div className={styles.table_num_delete_container}>
                  <Skeleton variant="rect" width={96} height={28} />
                  <Skeleton variant="rect" width={24} height={24} />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

// 估算购物车本地缓存条数，用于决定骨架行数；解析失败 / 无缓存时返回 0。
function readCachedCartCount() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("store_shopping");
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

const CartMain = function ({ handleClose }) {
  const { locale, LANG, area, areaReady, setProductNum } =
    React.useContext(GlobalContext);
  const [cartList, setCartList] = React.useState([]);
  // cartReady：购物车数据加载完成（含为空的"已确认空"语义），区分骨架与 EmptyCart。
  const [cartReady, setCartReady] = React.useState(false);
  // 估算骨架行数：弹窗打开瞬间从 localStorage 取一次，cartReady 后不再使用。
  const [skeletonRows] = React.useState(() => readCachedCartCount());
  const router = useRouter();

  // ==========================================================================
  // 折扣码状态机：输入 → 调 previewOrder 试算 → 显示折扣行 + applied_rules。
  // 已应用 codes 写入 localStorage，结算页 Main 进入时自动回填，体验闭环。
  // 不传 shipping_address：后端只算商品折扣，不算运费折扣（购物车里 OK）。
  // ==========================================================================
  const [discountCodeInput, setDiscountCodeInput] = React.useState("");
  const [discountCodes, setDiscountCodes] = React.useState(() =>
    readStoredDiscountCodes()
  );
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);
  const [previewError, setPreviewError] = React.useState(null);
  // rejectionNotice：坏码被自动剔除的逐码原因提示，独立于 previewError（硬错误），
  // 不被后续成功重算清除，直到用户下一次操作。
  const [rejectionNotice, setRejectionNotice] = React.useState(null);

  React.useEffect(() => {
    // 地区就绪后再取价（价格随 area 实时，走 /api/cart）。
    if (!areaReady) return;
    let cancelled = false;
    (async () => {
      const rows = await resolveCartFromApi({ area, language: locale });
      if (cancelled) return;
      const list = rows.map((row) => ({
        // 套餐相关
        id: row.id,
        comboName: row.comboName,
        // 地区相关
        currency: row.areaInfo.currency,
        currency_unit: row.areaInfo.currency_unit,
        priceSymbol: row.areaInfo.currency_symbol,
        product_price: row.areaInfo.product_price,
        selling_price: row.areaInfo.selling_price,
        product_discount: row.areaInfo.product_discount,
        stock: row.areaInfo.stock,
        // 产品相关
        name: row.name,
        image: row.image,
        href: `/${locale}/product/${row.sortKey}/${row.productKey}`,
        sortKey: row.sortKey,
        productKey: row.productKey,
        comboKey: row.comboKey,
        // 其他
        productNum: row.productNum,
        options: row.options,
        customize_data: Array.isArray(row.customize_data)
          ? row.customize_data
          : [],
      }));
      setCartList(list);
      setCartReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [areaReady, area, locale]);

  const [totalPrice, setTotalPrice] = React.useState(0);
  React.useEffect(() => {
    let productNum = 0;
    const price = cartList.reduce((pre, cur) => {
      productNum = productNum + cur.productNum;
      // effective price：商品本身有折扣（selling_price < product_price）时，按折后价合计；
      // 否则按原价。展示与结算口径一致。
      const hasItemDiscount =
        Number(cur.selling_price) > 0 &&
        Number(cur.selling_price) < Number(cur.product_price);
      const unit = hasItemDiscount ? cur.selling_price : cur.product_price;
      return pre + unit * cur.productNum;
    }, 0);
    setProductNum(productNum > 99 ? "99+" : productNum);
    setTotalPrice(formatCurrency(price));
  }, [cartList, setProductNum]);

  // ==========================================================================
  // 调 previewOrder 试算折扣（仅 area_code + order_list + discount_codes，不传地址）。
  // 触发条件：cartList 就绪 + 已有 codes（无 codes 时不调，省一次空请求）。
  // 输出：previewData.discount / .applied_rules 供 UI 展示。
  // ==========================================================================
  const buildPreviewOrderList = React.useCallback(() => {
    return cartList.map((it) => ({
      sortKey: it.sortKey,
      productKey: it.productKey,
      comboKey: it.comboKey,
      productNum: it.productNum,
      // 复刻结算页字段：options 透传给后端做 BXGY/范围匹配
      options: it.options,
    }));
  }, [cartList]);

  const fetchPreview = React.useCallback(
    async (codes) => {
      if (!cartList.length) {
        setPreviewData(null);
        return null;
      }
      setPreviewLoading(true);
      try {
        const payload = {
          area_code: area || "us",
          discount_codes: codes,
          include_automatic: true,
          order_list: buildPreviewOrderList(),
        };
        const res = await api.post("/pay/previewOrder", payload);
        if (res.code !== 0) {
          const msg =
            typeof res.data === "string"
              ? res.data
              : LANG["store.order.discount_code_invalid"] ||
                "Invalid discount code";
          throw new Error(msg);
        }
        const data = {
          total_price: parseAmount(res.data.total_price),
          discount: parseAmount(res.data.discount),
          pay_price: parseAmount(res.data.pay_price),
          applied_rules: res.data.applied_rules || [],
          rejected_codes: res.data.rejected_codes || [],
        };
        setPreviewData(data);
        setPreviewError(null);
        return data;
      } catch (err) {
        setPreviewError(err?.message || "Preview failed");
        throw err;
      } finally {
        setPreviewLoading(false);
      }
    },
    [cartList, area, buildPreviewOrderList, LANG]
  );

  // Shopify 式坏码自愈：previewOrder 返回的 rejected_codes 从已应用列表剔除并落盘，
  // 避免坏码残留反复报错；同时把逐码原因合成提示展示给用户。
  // 返回被拒码集合（供 handleApply 判断新码是否被拒）。
  const reconcileRejected = React.useCallback(
    (data) => {
      const rejected = data?.rejected_codes || [];
      if (!rejected.length) return new Set();
      const rejectedSet = new Set(rejected.map((r) => r.code));
      setDiscountCodes((prev) => {
        const next = prev.filter((c) => !rejectedSet.has(c));
        if (next.length !== prev.length) writeStoredDiscountCodes(next);
        return next;
      });
      const text = rejected
        .map((r) => formatRejectedCodeMessage(r, LANG))
        .join("；");
      setRejectionNotice(text);
      return rejectedSet;
    },
    [LANG]
  );

  // 购物车就绪 / area 切换 / codes 变化时自动重算（仅当 codes 非空才请求）。
  React.useEffect(() => {
    if (!cartReady || !cartList.length) return;
    if (!discountCodes.length) {
      setPreviewData(null);
      setPreviewError(null);
      return;
    }
    fetchPreview(discountCodes)
      .then((data) => reconcileRejected(data))
      .catch(() => {});
  }, [cartReady, cartList, discountCodes, area, fetchPreview, reconcileRejected]);

  const persistDiscountCodes = React.useCallback((codes) => {
    setDiscountCodes(codes);
    writeStoredDiscountCodes(codes);
  }, []);

  const handleApplyDiscountCode = React.useCallback(async () => {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) return;
    setRejectionNotice(null);
    if (discountCodes.includes(code)) {
      setPreviewError(
        LANG["store.order.discount_code_applied"] ||
          "Discount code already applied"
      );
      return;
    }
    const next = [...discountCodes, code];
    try {
      const data = await fetchPreview(next);
      const rejectedSet = reconcileRejected(data);
      // 新码若被后端拒绝：不写入已应用列表，提示已由 reconcileRejected 展示。
      if (rejectedSet.has(code)) {
        setDiscountCodeInput("");
        return;
      }
      // 新码有效：持久化（reconcileRejected 已剔除本轮其他坏码）。
      const accepted = next.filter((c) => !rejectedSet.has(c));
      persistDiscountCodes(accepted);
      setDiscountCodeInput("");
    } catch {
      // fetchPreview 已 setPreviewError，UI 会展示
    }
  }, [
    discountCodeInput,
    discountCodes,
    fetchPreview,
    reconcileRejected,
    persistDiscountCodes,
    LANG,
  ]);

  const handleRemoveDiscountCode = React.useCallback(
    (code) => {
      const next = discountCodes.filter((c) => c !== code);
      persistDiscountCodes(next);
      setPreviewError(null);
      setRejectionNotice(null);
    },
    [discountCodes, persistDiscountCodes]
  );

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.top_content}>
          {!cartReady && skeletonRows > 0 ? (
            <CartSkeleton rowCount={skeletonRows} />
          ) : !cartList || cartList.length === 0 ? (
            <EmptyCart LANG={LANG} handleClose={handleClose} />
          ) : (
            <>
              <div className={styles.shipping_free} data-discount={false}>
                {previewData?.applied_rules?.some(
                  (r) => r.type === "free_shipping"
                )
                  ? LANG["common.cart.free_shipping_eligible"] ||
                    "You qualify for free shipping"
                  : LANG["common.cart.free_shipping"]}
              </div>
              <div className={styles.table_body}>
                {cartList.map((item, index) => {
                  // 商品级折扣：selling_price < product_price 时按折后价 + 划线原价展示。
                  const hasItemDiscount =
                    Number(item.selling_price) > 0 &&
                    Number(item.selling_price) < Number(item.product_price);
                  return (
                    <section key={index} className={styles.table_body_item}>
                      <div className={styles.table_body_goods}>
                        <div className={styles.good_item}>
                          <div
                            className={styles.body_goods_img}
                            onClick={() => {
                              handleClose();
                              router.push(
                                `/product/${item.sortKey}/${item.productKey}`
                              );
                            }}
                          >
                            <img alt={item.name} src={item.image} />
                          </div>
                          <div className={styles.product_info}>
                            <div className={styles.product_content}>
                              <div className={styles.title}>
                                <div>{item.name}</div>
                              </div>
                              <div className={styles.content_combo}>
                                {item.comboName}
                              </div>
                              <div className={styles.plan_goods}>
                                {item.options.map((option, index) => {
                                  return (
                                    <div
                                      key={index}
                                    >{`${option.name}: ${option.value}`}</div>
                                  );
                                })}
                              </div>
                              {/* 定制字段：文本显示值，文件显示文件名（可点开）。加购时随行写入 customize_data。 */}
                              {Array.isArray(item.customize_data) &&
                              item.customize_data.length > 0 ? (
                                <div className={styles.plan_goods}>
                                  {item.customize_data.map((field, fi) => {
                                    const isFile =
                                      field.field_type === "file" ||
                                      (Array.isArray(field.files) &&
                                        field.files.length > 0);
                                    if (isFile) {
                                      const files = Array.isArray(field.files)
                                        ? field.files
                                        : [];
                                      if (!files.length) return null;
                                      return (
                                        <div key={fi}>
                                          {`${field.field_label}: `}
                                          {files.map((f, idx) => (
                                            <a
                                              key={`${f.url}-${idx}`}
                                              href={f.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title={f.name}
                                            >
                                              {f.name}
                                              {idx < files.length - 1
                                                ? ", "
                                                : ""}
                                            </a>
                                          ))}
                                        </div>
                                      );
                                    }
                                    if (!field.value) return null;
                                    return (
                                      <div
                                        key={fi}
                                      >{`${field.field_label}: ${field.value}`}</div>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                            <div className={styles.table_body_price}>
                              <div className={styles.price}>
                                {hasItemDiscount ? (
                                  <>
                                    {/* 折后价：第 1 个 div */}
                                    <div>{`${item.priceSymbol}${formatCurrency(
                                      item.selling_price * item.productNum,
                                      item.currency_unit
                                    )}`}</div>
                                    {/* 划线原价：第 2 个 div，命中既有 nth-child(2) 划线灰色样式 */}
                                    <div>{`${item.priceSymbol}${formatCurrency(
                                      item.product_price * item.productNum,
                                      item.currency_unit
                                    )}`}</div>
                                  </>
                                ) : (
                                  <div>{`${item.priceSymbol}${formatCurrency(
                                    item.product_price * item.productNum,
                                    item.currency_unit
                                  )}`}</div>
                                )}
                              </div>
                            </div>
                            <div className={styles.table_num_delete_container}>
                              <div className={styles.table_body_num}>
                                <div
                                  onClick={() => {
                                    let number = item.productNum - 1;
                                    if (number > 99998) number = 99999;
                                    else if (number < 2) number = 1;
                                    const newCart = cartList.map((item2) => {
                                      if (
                                        item.id === item2.id &&
                                        JSON.stringify(item.options) ===
                                          JSON.stringify(item2.options)
                                      ) {
                                        return {
                                          ...item2,
                                          productNum: number,
                                        };
                                      } else {
                                        return item2;
                                      }
                                    });
                                    setCartList(newCart);
                                    window.localStorage.setItem(
                                      "store_shopping",
                                      JSON.stringify(
                                        newCart.map(
                                          ({
                                            comboKey,
                                            options = "[]",
                                            productKey,
                                            productNum,
                                            sortKey,
                                            customize_data = [],
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
                                              customize_data,
                                            };
                                          }
                                        )
                                      )
                                    );
                                  }}
                                  className={styles.product_num_symbol}
                                >
                                  -
                                </div>
                                <input
                                  type="number"
                                  value={item.productNum}
                                  className={styles.product_num}
                                  onChange={(e) => {
                                    let number = Number(e.target.value);
                                    if (number > 99998) number = 99999;
                                    else if (number < 2) number = 1;
                                    const newCart = cartList.map((item2) => {
                                      if (
                                        item.id === item2.id &&
                                        JSON.stringify(item.options) ===
                                          JSON.stringify(item2.options)
                                      ) {
                                        return {
                                          ...item2,
                                          productNum: number,
                                        };
                                      } else {
                                        return item2;
                                      }
                                    });

                                    setCartList(newCart);
                                    window.localStorage.setItem(
                                      "store_shopping",
                                      JSON.stringify(
                                        newCart.map(
                                          ({
                                            comboKey,
                                            options = "[]",
                                            productKey,
                                            productNum,
                                            sortKey,
                                            customize_data = [],
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
                                              customize_data,
                                            };
                                          }
                                        )
                                      )
                                    );
                                  }}
                                />
                                <div
                                  onClick={() => {
                                    let number = item.productNum + 1;
                                    if (number > 99998) number = 99999;
                                    else if (number < 2) number = 1;
                                    const newCart = cartList.map((item2) => {
                                      if (
                                        item.id === item2.id &&
                                        JSON.stringify(item.options) ===
                                          JSON.stringify(item2.options)
                                      ) {
                                        return {
                                          ...item2,
                                          productNum: number,
                                        };
                                      } else {
                                        return item2;
                                      }
                                    });
                                    setCartList(newCart);
                                    window.localStorage.setItem(
                                      "store_shopping",
                                      JSON.stringify(
                                        newCart.map(
                                          ({
                                            comboKey,
                                            options = "[]",
                                            productKey,
                                            productNum,
                                            sortKey,
                                            customize_data = [],
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
                                              customize_data,
                                            };
                                          }
                                        )
                                      )
                                    );
                                  }}
                                  className={styles.product_num_symbol}
                                >
                                  +
                                </div>
                              </div>

                              <div className={styles.table_body_operation}>
                                <img
                                  onClick={() => {
                                    const newCart = cartList.filter((item2) => {
                                      return !(
                                        item.id === item2.id &&
                                        JSON.stringify(item.options) ===
                                          JSON.stringify(item2.options)
                                      );
                                    });
                                    setCartList(newCart);
                                    window.localStorage.setItem(
                                      "store_shopping",
                                      JSON.stringify(
                                        newCart.map(
                                          ({
                                            comboKey,
                                            options = "[]",
                                            productKey,
                                            productNum,
                                            sortKey,
                                            customize_data = [],
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
                                              customize_data,
                                            };
                                          }
                                        )
                                      )
                                    );
                                  }}
                                  alt="delete"
                                  width={24}
                                  height={24}
                                  src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/min-utils-delete.svg`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {cartReady && cartList && cartList.length > 0 ? (
          <div className={styles.bottom_content}>
            {/* 折扣码输入区：调 previewOrder 试算，显示折扣行；持久化到 localStorage 让结算页自动回填 */}
            <div className={styles.promo_code_container}>
              <div className={styles.promo_code_input_row}>
                <input
                  type="text"
                  className={styles.promo_code_input}
                  value={discountCodeInput}
                  placeholder={
                    LANG["store.order.discount_code_placeholder"] ||
                    "Promo code"
                  }
                  onChange={(e) => setDiscountCodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyDiscountCode();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.promo_code_apply_btn}
                  disabled={previewLoading || !discountCodeInput.trim()}
                  onClick={handleApplyDiscountCode}
                >
                  {LANG["store.order.discount_code_apply"] || "Apply"}
                </button>
              </div>
              {discountCodes.length ? (
                <div className={styles.promo_code_tags}>
                  {discountCodes.map((code) => (
                    <div key={code} className={styles.promo_code_tag}>
                      <span>{code}</span>
                      <button
                        type="button"
                        aria-label={
                          LANG["store.order.discount_code_remove"] || "Remove"
                        }
                        onClick={() => handleRemoveDiscountCode(code)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {previewError && !previewLoading ? (
                <div className={styles.promo_code_error}>{previewError}</div>
              ) : null}
              {rejectionNotice && !previewLoading ? (
                <div className={styles.promo_code_error}>{rejectionNotice}</div>
              ) : null}
            </div>

            <div className={styles.total_price}>
              <div className={styles.total_price_title}>
                {LANG["common.cart.subtotal"]}
              </div>
              <div className={styles.total_price_num}>
                {`${cartList[0]?.priceSymbol}${totalPrice}`}
              </div>
            </div>
            {previewData?.applied_rules?.filter(
              (r) => r.type !== "free_shipping"
            ).length ? (
              <div className={styles.applied_rules_list}>
                {previewData.applied_rules
                  .filter((r) => r.type !== "free_shipping")
                  .map((rule) => (
                    <div
                      key={`${rule.rule_id}-${rule.code || rule.method}`}
                      className={styles.discount_row}
                    >
                      <div>
                        {rule.code ||
                          rule.title ||
                          (rule.method === "automatic"
                            ? LANG["store.order.automatic_discount"] ||
                              "Promotion"
                            : LANG["store.order.discount_amount"] ||
                              "Discount")}
                      </div>
                      <div
                        className={styles.discount_value}
                      >{`-${cartList[0]?.priceSymbol}${formatCurrency(
                        parseAmount(rule.amount),
                        cartList[0]?.currency_unit
                      )}`}</div>
                    </div>
                  ))}
              </div>
            ) : previewData?.discount > 0 ? (
              <div className={styles.discount_row}>
                <div>
                  {LANG["store.order.discount_amount"] || "Discount"}
                </div>
                <div
                  className={styles.discount_value}
                >{`-${cartList[0]?.priceSymbol}${formatCurrency(
                  previewData.discount,
                  cartList[0]?.currency_unit
                )}`}</div>
              </div>
            ) : null}
            <div className={styles.checkout_tip}>
              {LANG["common.cart.checkout_tip"]}
            </div>
            <div className={styles.btn_container}>
              <div
                className={styles.checkout_btn}
                onClick={() => {
                  tracking.enterOrderForm({
                    currency: cartList[0]?.currency,
                    value: totalPrice,
                    contents: cartList,
                  });
                  location.href = `/${locale}/order`;
                }}
              >
                {LANG["common.cart.checkout"]}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

function ModalCart(_, ref) {
  const { LANG } = React.useContext(GlobalContext);
  const [changeBodyScroll, setChangeBodyScroll] = React.useState(true);
  /**弹窗逻辑 */
  const [show, setShow] = React.useState(false);
  React.useImperativeHandle(ref, () => {
    return {
      show: () => {
        setShow((state) => !state);
      },
    };
  });

  const [firstLoad, setFirstLoad] = React.useState(false);
  let t = null;
  React.useEffect(() => {
    if (!show) {
      t = setTimeout(() => {
        setFirstLoad(false);
      }, 300);
    } else {
      clearTimeout(t);
      setFirstLoad(true);
    }
  }, [show]);

  React.useEffect(() => {
    if (show) {
      if (document.body.style.overflow === "hidden") {
        setChangeBodyScroll(false);
      }
      document.body.style.overflow = "hidden";
    } else {
      if (changeBodyScroll) {
        document.body.style.overflow = "scroll";
      } else {
        setChangeBodyScroll(true);
      }
    }
  }, [show]);

  return (
    <>
      {firstLoad &&
        ReactDOM.createPortal(
          <div
            className={styles.modal}
            data-show={show}
            onClick={() => {
              setShow(false);
            }}
          >
            <div className={styles.modal_container}>
              <div className={styles.modal_wrapper}>
                <div
                  className={styles.modal_content}
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                  }}
                >
                  <div className={styles.header}>
                    <div className={styles.title}>
                      {LANG["common.cart.title"]}
                    </div>
                    <div
                      className={styles.close}
                      onClick={() => setShow(false)}
                    >
                      ×
                    </div>
                  </div>
                  <CartMain handleClose={() => setShow(false)} />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default React.forwardRef(ModalCart);
