import ReactDOM from "react-dom";
import React from "react";
import styles from "./index.module.scss";

import ShowTipModal from "@/components/Modal/ShowTipModal";
import Loading from "@/components/Loading";
import tracking from "../tracking";

import Link from "next/link";

import GlobalContext from "@/globalContext";
import formatCurrency from "@/utils/formatCurrency";

const EmptyCart = function ({ LANG, handleClose }) {
  return (
    <div className={styles.empty_container}>
      <div className={styles.img_container}>
        <img
          alt="empty"
          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-utils-empyt.svg`}
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

function ModalCart({ LANG, GOODLIST, GOODDISCOUNTFESTIVAL, locale }, ref) {
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

    document.body.style.overflow = show ? "hidden" : "scroll";
    return () => {
      document.body.style.overflow = "scroll";
    };
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
                  <div className={styles.close} onClick={() => setShow(false)}>
                    ×
                  </div>
                </div>
                <CartMain
                  handleClose={() => setShow(false)}
                  LANG={LANG}
                  GOODLIST={GOODLIST}
                  goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                  locale={locale}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const CartMain = function ({
  LANG,
  handleClose,
  GOODLIST,
  goodDiscountFestival,
  locale,
}) {
  const { setProductNum } = React.useContext(GlobalContext);
  const [cartList, setCartList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const tipRef = React.useRef();

  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let localStoreList = window.localStorage.getItem("store_shopping");
      try {
        localStoreList = JSON.parse(localStoreList ?? []);
        const list = [];
        localStoreList.forEach((item) => {
          let comboInfo;
          // 查找该语言的商品
          const product = GOODLIST.find(
            (product) =>
              item.productKey === product.key &&
              item.sortKey === product.sort_key
          );
          if (product) {
            // 查找当前语言的套餐
            comboInfo = product.comboList.find(
              (combo) => combo.key === item.comboKey
            );
          }
          // 处理选项
          let options;
          try {
            if (typeof item.options === "object") {
              options = item.options;
            } else {
              options = JSON.parse(item.options);
            }
          } catch {
            options = [];
          }

          if (comboInfo?.areaInfo && comboInfo && product) {
            // 库存存在，才放入列表
            if (comboInfo.areaInfo.stock) {
              list.push({
                // 套餐相关
                id: comboInfo.id,
                comboName: comboInfo.title,
                // 地区相关
                currency: comboInfo.areaInfo.currency,
                priceSymbol: comboInfo.areaInfo.currency_symbol,
                product_price: comboInfo.areaInfo.product_price,
                selling_price: comboInfo.areaInfo.selling_price,
                product_discount: comboInfo.areaInfo.product_discount,
                stock: comboInfo.areaInfo.stock,
                // 产品相关
                name: product.name,
                image: product.image_list[0].src,
                href: `/${locale}/store/product/${product.sort_key}/${product.key}`,
                sortKey: product.sort_key,
                productKey: product.key,
                comboKey: comboInfo.key,
                // 其他
                productNum: item.productNum,
                options,
              });
            }
          }
        });
        setCartList(list);
        setLoading(false);
      } catch (err) {
        localStorage.setItem("store_shopping", JSON.stringify([]));
        setLoading(false);
        console.warn("【购物列表解析失败】", err);
      }
    }, 500);
  }, []);

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
          {!cartList || cartList.length === 0 ? (
            <>
              {loading ? (
                <Loading height={560} />
              ) : (
                <EmptyCart LANG={LANG} handleClose={handleClose} />
              )}
            </>
          ) : (
            <>
              <div className={styles.table_body}>
                {cartList.map((item, index) => {
                  return (
                    <section key={index} className={styles.table_body_item}>
                      <div className={styles.table_body_goods}>
                        <div className={styles.good_item}>
                          <div className={styles.body_goods_img}>
                            <img alt={item.name} src={item.image} />
                          </div>

                          <div className={styles.product_info}>
                            <div className={styles.product_content}>
                              <div className={styles.title}>
                                <Link href={item.href}>{item.name}</Link>
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
                              {/* {goodDiscountFestival && item.good_discount ? (
                                <div className={styles.discount}>{`- ${
                                  item.priceSymbol
                                }${
                                  Math.ceil(
                                    item.price *
                                      (100 - item.good_discount) *
                                      0.01
                                  ) * item.productNum
                                }`}</div>
                              ) : null} */}
                              <div className={styles.price}>
                                {goodDiscountFestival &&
                                item.product_discount ? (
                                  <div>{`${item.priceSymbol}${formatCurrency(
                                    item.selling_price * item.productNum
                                  )}`}</div>
                                ) : null}
                                <div>{`${item.priceSymbol}${formatCurrency(
                                  item.product_price * item.productNum
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
                                  src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-utils-delete.svg`}
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
        {cartList && cartList.length > 0 ? (
          <div className={styles.bottom_content}>
            <div className={styles.total_price}>
              <div className={styles.total_price_title}>
                {LANG["common.cart.subtotal"]}
              </div>
              <div className={styles.total_price_num}>
                {`${cartList[0]?.priceSymbol}${totalPrice}`}
              </div>
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
                  location.href = `/${locale}/store/order`;
                }}
              >
                {LANG["common.cart.checkout"]}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
};

export default React.forwardRef(ModalCart);
