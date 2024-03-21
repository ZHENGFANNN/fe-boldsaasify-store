"use client";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";
import formatCurrency from "@/utils/formatCurrency";

export default function GoodPrice({ goodDiscountFestival, comboList }) {
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  return (
    <>
      {/* 优惠金额 */}
      {goodDiscountFestival && productCurCombo.areaInfo?.product_discount ? (
        <div className={styles.discount_price}>
          {`- ${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
            productCurCombo.areaInfo?.product_price -
              productCurCombo.areaInfo?.selling_price
          )}`}
        </div>
      ) : null}
      {/* 价格计算 */}
      {productCurCombo.areaInfo?.product_price ? (
        <div className={styles.product_price}>
          {goodDiscountFestival &&
          productCurCombo.areaInfo?.product_discount ? (
            <div>{`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
              productCurCombo.areaInfo?.selling_price
            )}`}</div>
          ) : null}
          <div>
            {`${productCurCombo.areaInfo.currency_symbol}${formatCurrency(
              productCurCombo.areaInfo.product_price
            )}`}
          </div>
        </div>
      ) : null}
    </>
  );
}
