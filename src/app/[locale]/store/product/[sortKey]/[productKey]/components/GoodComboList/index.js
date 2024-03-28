"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";
import formatCurrency from "@/utils/formatCurrency";

export default function GoodComboList() {
  const {
    LANG,
    productCurCombo,
    setProductCurCombo,
    goodDiscountFestival,
    productInfo: { comboList },
  } = React.useContext(ProductContext);
  const [active, setActive] = React.useState(() => {
    return productCurCombo?.key;
  });
  React.useEffect(() => {
    setActive(productCurCombo?.key);
  }, [productCurCombo]);
  if (comboList.length < 1) return null;
  return (
    <div className={styles.container}>
      <h2>{LANG["store.product.combo"]}</h2>
      <div data-role="productCombo">
        {comboList.map((item) => {
          return (
            <div
              data-padding={
                !!(goodDiscountFestival && item.areaInfo?.product_discount) ||
                !!(!item.areaInfo?.product_price || !item.areaInfo?.stock)
              }
              data-img={!!item.smart_img}
              className={`${styles.list} ${
                active === item.key ? styles.active : ""
              }`}
              key={item.key}
              onClick={() => {
                setActive(item.key);
                setProductCurCombo(item);
              }}
            >
              <div className={styles.list_item}>
                <div className={styles.top_container}>
                  {/* 提示 */}
                  {!item.areaInfo?.product_price || !item.areaInfo?.stock ? (
                    <div className={styles.stock_tip}>
                      {LANG["store.product.no_stock"]}
                    </div>
                  ) : null}
                  {goodDiscountFestival && item.areaInfo?.product_discount ? (
                    <div className={styles.discount_tip}>
                      {LANG["store.product.off"]}{" "}
                      {100 - item.areaInfo?.product_discount}%
                    </div>
                  ) : null}
                  {/* 套餐缩略图/标题 */}
                  <div className={styles.top_container_left}>
                    {item.smart_img ? (
                      <div className={styles.item_left_img}>
                        <img src={item.smart_img} />
                      </div>
                    ) : null}

                    <div className={styles.item_left_title}>{item.title}</div>
                  </div>
                  {/* 套餐价格 */}
                  {item.areaInfo?.product_price ? (
                    <div className={styles.top_container_right}>
                      {goodDiscountFestival &&
                      item.areaInfo?.product_discount ? (
                        <div>{`${item.areaInfo.currency_symbol}${formatCurrency(
                          item.areaInfo?.selling_price
                        )}`}</div>
                      ) : (
                        <div>{`${
                          item.areaInfo?.currency_symbol
                        }${formatCurrency(item.areaInfo?.product_price)}`}</div>
                      )}
                    </div>
                  ) : null}
                </div>
                {/* 套餐描述 */}
                {item.description ? (
                  <div className={styles.bottom_container}>
                    <div className={styles.description}>{item.description}</div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
