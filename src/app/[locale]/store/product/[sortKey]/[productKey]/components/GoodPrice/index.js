"use client";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";

export default function GoodPrice({ goodDiscountFestival, comboList }) {
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  return (
    <>
      {/* 优惠金额 */}
      {goodDiscountFestival && productCurCombo.areaInfo.good_discount ? (
        <div className={styles.discount_price}>
          -{" "}
          {`${productCurCombo.areaInfo.currency_symbol}${
            productCurCombo.areaInfo.currency
          } ${Math.ceil(
            (100 - goodDiscountFestival.discount) *
              0.01 *
              productCurCombo.areaInfo.price
          )}`}
        </div>
      ) : null}
      {/* 价格计算 */}
      {productCurCombo.areaInfo?.price ? (
        <div className={styles.product_price}>
          {goodDiscountFestival && productCurCombo.areaInfo.good_discount ? (
            <div>{`${productCurCombo.areaInfo.currency_symbol}${
              productCurCombo.areaInfo.currency
            } ${Math.floor(
              productCurCombo.areaInfo.price *
                productCurCombo.areaInfo.good_discount *
                0.01
            )}`}</div>
          ) : null}
          <div>
            {`${productCurCombo.areaInfo.currency_symbol}${productCurCombo.areaInfo.currency} ${productCurCombo.areaInfo.price}`}
          </div>
        </div>
      ) : null}
    </>
  );
}
