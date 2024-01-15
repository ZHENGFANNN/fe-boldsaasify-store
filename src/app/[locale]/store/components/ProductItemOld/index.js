import Link from "next/link";
import styles from "./index.module.scss";

export default function ProductItemV1({
  product,
  productIndex,
  LANG,
  goodDiscountFestival,
}) {
  return (
    <Link
      href={`/store/product/${product.sort_key}/${product.key}`}
      className={`${styles.goods_items} ${
        productIndex === 0 ? styles.big_item : ""
      }`}
    >
      <div
        className={`${styles.infos_container} ${
          !product.image_scenes ? styles.hover_big : ""
        }`}
      >
        <div className={styles.mask_top}></div>
        <div className={styles.mask_bottom}></div>
        {/* {goodDiscountFestival && product.areaInfo.good_discount ? (
            <div className={styles.good_discount}>
              <div className={styles.off}>{LANG["store.index.off"]}</div>
              <div className={styles.discount}>
                {100 - product.areaInfo.good_discount}%
              </div>
            </div>
          ) : null} */}
        <div className={styles.title}>
          <h3>{product.name}</h3>
          {!product.areaInfo.stock ? (
            <span className={styles.stock_tip}>
              {LANG["store.index.no_stock"]}
            </span>
          ) : null}
          {goodDiscountFestival &&
          product.areaInfo.good_discount &&
          product.areaInfo?.price ? (
            <span className={styles.discount_tip}>{`- ${
              product.areaInfo.currency_symbol
            }${product.areaInfo.currency} ${Math.ceil(
              product.areaInfo.price *
                (100 - product.areaInfo.good_discount) *
                0.01
            )}`}</span>
          ) : null}
        </div>
        <div className={styles.goods_item_price}>
          {product.areaInfo.price ? (
            <div className={styles.price_container}>
              {goodDiscountFestival && product.areaInfo.good_discount ? (
                <div>{`${product.areaInfo.currency_symbol}${
                  product.areaInfo.currency
                } ${Math.floor(
                  product.areaInfo.price * product.areaInfo.good_discount * 0.01
                )}`}</div>
              ) : null}
              <div>{`${product.areaInfo.currency_symbol}${product.areaInfo.currency}  ${product.areaInfo.price}`}</div>
            </div>
          ) : (
            <div>-</div>
          )}
          {product.areaInfo.price ? (
            <div>+</div>
          ) : (
            <div className={styles.stock_tip}>
              {LANG["store.index.no_stock"]}
            </div>
          )}
        </div>
      </div>
      <div className={styles.img_container}>
        <div
          className={`${styles.goods_item_img} ${
            !product.image_scenes ? styles.hover_big : ""
          }`}
        >
          <img alt={product.name} src={product?.image_list?.[0]?.src} />
        </div>
        {product.image_scenes ? (
          <div className={styles.goods_item_hover_img}>
            <img alt={product.name} src={product.image_scenes} />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
