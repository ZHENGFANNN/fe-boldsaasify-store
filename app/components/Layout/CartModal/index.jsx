/** @format */

import ReactDOM from "react-dom";
import React from "react";
import styles from "./index.module.scss";

import tracking from "../tracking";

import GlobalContext from "../../../[locale]/context";
import { formatCurrency } from "../../../utils";
import resolveCartFromApi from "../cartClient";
import Skeleton from "@/components/Skeleton";

import { useRouter } from "next/navigation";

// 格式化时间，保证显示为两位数
function formatTime(time) {
  return time.toString().padStart(2, "0");
}

function updateCountdown(endTime) {
  if (!endTime) return;
  // 获取当前时间
  const currentTime = Date.now();
  // 计算剩余时间
  const milliseconds = endTime - currentTime;
  if (milliseconds < 0) {
    location.reload();
    return;
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  return {
    hours: Math.max(formatTime(hours), 0).toString().padStart(2, "0"),
    minutes: Math.max(formatTime(minutes % 60), 0)
      .toString()
      .padStart(2, "0"),
    seconds: Math.max(formatTime(seconds % 60), 0)
      .toString()
      .padStart(2, "0"),
  };
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
  // 节日折扣已停用：恒为 false，下方倒计时/折扣 UI 自然隐藏（源码保留以备复用）。
  const goodDiscountFestival = false;
  const { locale, LANG, area, areaReady, setProductNum } =
    React.useContext(GlobalContext);
  const [cartList, setCartList] = React.useState([]);
  // cartReady：购物车数据加载完成（含为空的"已确认空"语义），区分骨架与 EmptyCart。
  const [cartReady, setCartReady] = React.useState(false);
  // 估算骨架行数：弹窗打开瞬间从 localStorage 取一次，cartReady 后不再使用。
  const [skeletonRows] = React.useState(() => readCachedCartCount());
  const [hours, setHours] = React.useState("00");
  const [minutes, setMinutes] = React.useState("00");
  const [seconds, setSeconds] = React.useState("00");
  const router = useRouter();

  React.useEffect(() => {
    if (!goodDiscountFestival || goodDiscountFestival.long_activity) return;
    const t = setInterval(() => {
      const { hours, minutes, seconds } = updateCountdown(
        goodDiscountFestival?.end_time
      );
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    }, 500);
    return () => {
      clearInterval(t);
    };
  }, [goodDiscountFestival]);

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
      if (goodDiscountFestival && cur.product_discount) {
        return pre + cur.selling_price * cur.productNum;
      } else {
        return pre + cur.product_price * cur.productNum;
      }
    }, 0);
    setProductNum(productNum > 99 ? "99+" : productNum);
    setTotalPrice(formatCurrency(price));
  }, [cartList, goodDiscountFestival]);

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
              <div
                className={styles.shipping_free}
                data-discount={!!goodDiscountFestival}
              >
                {LANG["common.cart.free_shipping"]}
              </div>
              {goodDiscountFestival ? (
                <div className={styles.festival_discount_container}>
                  <div className={styles.festival_discount}>
                    <div className={styles.festival_discount_title}>
                      {goodDiscountFestival.title}
                    </div>
                    <div className={styles.festival_discount_tip}>
                      {LANG["common.cart.festival_tip"]}
                    </div>
                    {!goodDiscountFestival.long_activity ? (
                      <div className={styles.countdown}>
                        <div className={styles.countdown_time}>
                          <div className={styles.countdown_item}>
                            <div>{hours}</div>
                          </div>
                          <div className={styles.countdown_symbol}>:</div>
                          <div className={styles.countdown_item}>
                            <div>{minutes}</div>
                          </div>
                          <div className={styles.countdown_symbol}>:</div>
                          <div className={styles.countdown_item}>
                            <div>{seconds}</div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className={styles.table_body}>
                {cartList.map((item, index) => {
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
                            </div>
                            <div className={styles.table_body_price}>
                              <div className={styles.price}>
                                {goodDiscountFestival &&
                                item.product_discount ? (
                                  <div>{`${item.priceSymbol}${formatCurrency(
                                    item.selling_price * item.productNum,
                                    item.currency_unit
                                  )}`}</div>
                                ) : null}
                                <div>{`${item.priceSymbol}${formatCurrency(
                                  item.product_price * item.productNum,
                                  item.currency_unit
                                )}`}</div>
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
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
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
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
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
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
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
                                          }) => {
                                            return {
                                              comboKey,
                                              options,
                                              productKey,
                                              productNum,
                                              sortKey,
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
            <div className={styles.total_price}>
              <div className={styles.total_price_title}>
                {LANG["common.cart.subtotal"]}
              </div>
              <div className={styles.total_price_num}>
                {`${cartList[0]?.priceSymbol}${totalPrice}`}
              </div>
            </div>
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
