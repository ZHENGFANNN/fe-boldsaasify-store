"use client";

import styles from "../../page.module.scss";
import React from "react";
import Link from "next/link";
import tracking from "../../tracking";
import ConfirmModal from "@/components/Modal/ConfirmModal";
import ShowTipModal from "@/components/Modal/ShowTipModal";

import GlobalContext from "@/globalContext";
import Loading from "@/components/Loading";
import Advantage from "@/components/Layout/Advantage";

const EmpytCart = function ({ LANG }) {
  return (
    <div className={styles.empyt_container}>
      <div className={styles.img_container}>
        <img
          alt="empyt"
          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-utils-empyt.svg`}
        />
      </div>
      <p>{LANG["store.cart.cart_empyt"]}</p>
      <Link href={`/store`} className={styles.button_order}>
        {LANG["store.cart.continue_order"]}
      </Link>
    </div>
  );
};

export default function Main({
  LANG,
  GOODLIST,
  goodDiscountFestival,
  area,
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
          let comboInfo, areaInfo;
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
            if (comboInfo) {
              // 查找当前国家的商品信息
              areaInfo = comboInfo.areaList.find(
                (areaItem) => areaItem.country_code === area
              );
            }
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

          if (areaInfo && comboInfo && product) {
            // 库存不存在的情况下，不允许点击
            if (!areaInfo.stock) item.selected = false;
            list.push({
              // 套餐相关
              id: comboInfo.id,
              comboName: comboInfo.title,
              // 地区相关
              currency: areaInfo.currency,
              priceSymbol: areaInfo.currency_symbol + areaInfo.currency,
              price: areaInfo.price,
              good_discount: areaInfo.good_discount,
              stock: areaInfo.stock,
              // 产品相关
              name: product.name,
              image: product.image_list[0].src,
              href: `/${locale}/store/product/${product.sort_key}/${product.key}`,
              sortKey: product.sort_key,
              productKey: product.key,
              comboKey: comboInfo.key,
              // 其他
              productNum: item.productNum,
              selected: item.selected,
              options,
            });
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
      if (cur.selected) {
        if (goodDiscountFestival && cur.good_discount) {
          return (
            pre +
            Math.floor(cur.price * 0.01 * cur.good_discount) * cur.productNum
          );
        } else {
          return pre + cur.price * cur.productNum;
        }
      } else {
        return pre;
      }
    }, 0);
    setProductNum(productNum > 99 ? "99+" : productNum);
    setTotalPrice(price);
  }, [cartList]);
  return (
    <div className={styles.wrap_container}>
      <div className={styles.container}>
        <h1>{LANG["store.cart.cart"]}</h1>
        {!cartList || cartList.length === 0 ? (
          <>
            {loading ? (
              <Loading height={560} />
            ) : (
              <EmpytCart LANG={LANG} locale={locale} />
            )}
          </>
        ) : (
          <>
            <ul className={styles.table_header}>
              <li className={styles.table_header_goods}>
                {LANG["store.cart.good"]}
              </li>
              <li className={styles.table_header_num}>
                {LANG["store.cart.amount"]}
              </li>
              <li className={styles.table_header_price}>
                {LANG["store.cart.price"]}
              </li>
            </ul>
            <div className={styles.table_body}>
              {cartList.map((item, index) => {
                return (
                  <section key={index} className={styles.table_body_item}>
                    <div className={styles.table_body_goods}>
                      <input
                        disabled={!item.stock}
                        checked={item.selected}
                        onChange={(e) => {
                          const list = cartList.map((item2) => {
                            if (
                              item.id === item2.id &&
                              JSON.stringify(item.options) ===
                                JSON.stringify(item2.options)
                            ) {
                              return {
                                ...item2,
                                selected: e.target.checked,
                              };
                            } else {
                              return item2;
                            }
                          });
                          setCartList(list);
                          window.localStorage.setItem(
                            "store_shopping",
                            JSON.stringify(
                              list.map(
                                ({
                                  comboKey,
                                  options = "[]",
                                  productKey,
                                  productNum,
                                  selected,
                                  sortKey,
                                }) => {
                                  return {
                                    comboKey,
                                    options,
                                    productKey,
                                    productNum,
                                    selected,
                                    sortKey,
                                  };
                                }
                              )
                            )
                          );
                        }}
                        className={styles.checkout_box}
                        type="checkbox"
                      />
                      <Link href={item.href} className={styles.body_goods_img}>
                        <img alt={item.name} src={item.image} />
                      </Link>
                      <div className={styles.table_body_content}>
                        {!item.stock ? (
                          <div className={styles.no_stock}>
                            {LANG["store.cart.no_stock"]}
                          </div>
                        ) : null}
                        <h3>
                          <Link href={item.href}>{item.name}</Link>
                        </h3>
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
                    </div>
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
                                  selected,
                                  sortKey,
                                }) => {
                                  return {
                                    comboKey,
                                    options,
                                    productKey,
                                    productNum,
                                    selected,
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
                                  selected,
                                  sortKey,
                                }) => {
                                  return {
                                    comboKey,
                                    options,
                                    productKey,
                                    productNum,
                                    selected,
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
                                  selected,
                                  sortKey,
                                }) => {
                                  return {
                                    comboKey,
                                    options,
                                    productKey,
                                    productNum,
                                    selected,
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
                    <div className={styles.table_body_price_peration}>
                      <div className={styles.table_body_price}>
                        {goodDiscountFestival && item.good_discount ? (
                          <div className={styles.discount}>{`- ${
                            item.priceSymbol
                          } ${
                            Math.ceil(
                              item.price * (100 - item.good_discount) * 0.01
                            ) * item.productNum
                          }`}</div>
                        ) : null}
                        <div className={styles.price}>
                          {goodDiscountFestival && item.good_discount ? (
                            <div>{`${item.priceSymbol} ${
                              Math.floor(
                                item.price * item.good_discount * 0.01
                              ) * item.productNum
                            }`}</div>
                          ) : null}
                          <div>{`${item.priceSymbol} ${
                            item.price * item.productNum
                          }`}</div>
                        </div>
                      </div>
                      <ConfirmModal
                        LANG={LANG}
                        title={LANG["store.cart.tip"]}
                        content={LANG["store.cart.tip_content"]}
                        renderNode={
                          <div className={styles.table_body_operation}>
                            <img
                              alt="delete"
                              width={24}
                              height={24}
                              src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/min-utils-delete.svg`}
                            />
                          </div>
                        }
                        onOk={() => {
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
                                  selected,
                                  sortKey,
                                }) => {
                                  return {
                                    comboKey,
                                    options,
                                    productKey,
                                    productNum,
                                    selected,
                                    sortKey,
                                  };
                                }
                              )
                            )
                          );
                        }}
                      />
                    </div>
                  </section>
                );
              })}
            </div>
            <div className={styles.balance_container}>
              <div className={styles.price_container}>
                <ul className={styles.price_items}>
                  <li className={styles.price_item_content}>
                    <div className={styles.price_item_title}>
                      {LANG["store.cart.small_total"]}
                    </div>
                    <div
                      className={styles.price_item_price}
                    >{`${cartList[0]?.priceSymbol} ${totalPrice}`}</div>
                  </li>
                  <li className={styles.price_item_content}>
                    <div className={styles.price_item_title}>
                      {LANG["store.cart.express_price"]}
                    </div>
                    <div className={styles.price_item_price}>
                      {LANG["store.cart.express_freedom"]}
                    </div>
                  </li>
                  <li className={styles.price_item_content}>
                    <div className={styles.price_item_title}>
                      {LANG["store.cart.taxs"]}
                    </div>
                    <div className={styles.price_item_price}>
                      {LANG["store.cart.tax_include"]}
                    </div>
                  </li>
                </ul>
                <div className={styles.total_price}>
                  {LANG["store.cart.all_total_price"]}&nbsp;&nbsp;&nbsp;&nbsp;
                  {`${cartList[0]?.priceSymbol} ${totalPrice}`}
                </div>
              </div>
              <div className={styles.balance_btn_container}>
                <div className={styles.balance_way}>
                  {locale === "cn" ? (
                    <>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-wechat"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-wechat.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-zhifubao"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-zhifubao.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-transfer"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-transfer.png`}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-paypal"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-paypal.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-transfer"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-transfer.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-visa"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-visa.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-master"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-master.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-maestro"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-maestro.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-american-express"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-american-express.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-diners-clubs"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-diners-clubs.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-discover"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-discover.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-jcb"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-jcb.png`}
                        />
                      </div>
                      <div className={styles.balance_way_img}>
                        <img
                          alt="pay-unionpay"
                          src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/pay-unionpay.png`}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.balance_btn}>
                  <a href={`/${locale}/store`} className={styles.contiun_order}>
                    {LANG["store.cart.continue_order"]}
                  </a>
                  <a
                    onClick={() => {
                      if (totalPrice == 0) {
                        tipRef.current.show({
                          type: "info",
                          text: "请勾选商品！",
                        });
                        return;
                      } else {
                        tracking.enterOrderForm({
                          currency: cartList[0]?.currency,
                          value: totalPrice,
                          contents: cartList,
                        });
                        location.href = `/${locale}/store/order`;
                      }
                    }}
                    className={styles.contiun_balance}
                  >
                    {LANG["store.cart.balance"]}
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
        <Advantage LANG={LANG} />
        <ShowTipModal ref={tipRef} />
      </div>
    </div>
  );
}
