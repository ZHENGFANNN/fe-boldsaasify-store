"use client";
import styles from "../../page.module.scss";
import useProductStore from "../../productStore";

export default function GoodPrice({ goodDiscountFestival }) {
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  return (
    <>
      {/* 优惠金额 */}
      {goodDiscountFestival ? (
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
      <div className={styles.product_price}>
        {goodDiscountFestival ? (
          <div>{`${productCurCombo.areaInfo.currency_symbol}${
            productCurCombo.areaInfo.currency
          } ${Math.floor(
            productCurCombo.areaInfo.price *
              goodDiscountFestival.discount *
              0.01
          )}`}</div>
        ) : null}
        <div>
          {productCurCombo.areaInfo?.price
            ? `${productCurCombo.areaInfo.currency_symbol}${productCurCombo.areaInfo.currency} ${productCurCombo.areaInfo.price}`
            : null}
        </div>
      </div>
    </>
  );
}
