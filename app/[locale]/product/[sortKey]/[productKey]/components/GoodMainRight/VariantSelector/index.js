"use client";
import React from "react";
import ProductContext from "../../../ProductContext";
import { isValueAvailable, isValueInStock } from "@/utils/resolveVariant";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import styles from "./index.module.scss";

/**
 * V2 Shopify 式选项选择器：按选项轴渲染，逐轴选值。
 *   - axis_type=color  → 圆形色块（swatch_color）
 *   - axis_type=image  → 缩略图（swatch_image）
 *   - axis_type=card   → 卡片（缩略图 + 标题 + 描述，仿旧套餐卡）
 *   - 其它(text)       → 文本胶囊按钮
 * 选满各轴 → BaseLayout 解析命中变体 → 价格刷新。不可命中的候选值置灰。
 */
export default function VariantSelector() {
  const {
    optionAxes: axes,
    optionVariants: variants,
    hasV2Options,
    optionSelection,
    setOptionValue,
    stockByCombo,
    priceLoading
  } = React.useContext(ProductContext);

  if (!hasV2Options) return null;

  return (
    <div className={styles.container}>
      {axes.map((axis) => {
        const selected = optionSelection?.[axis.axis_code];
        const selectedLabel =
          axis.values.find((v) => v.value_code === selected)?.value_label || "";
        const isColor = axis.axis_type === "color";
        const isImage = axis.axis_type === "image";
        const isCard = axis.axis_type === "card";
        return (
          <div className={styles.axis} key={axis.axis_code}>
            <div className={styles.axis_head}>
              <span className={styles.axis_name}>{axis.axis_name}</span>
              {selectedLabel ? (
                <span className={styles.axis_value}>{selectedLabel}</span>
              ) : null}
            </div>
            <div
              className={styles.value_list}
              data-variant={
                isColor
                  ? "color"
                  : isImage
                  ? "image"
                  : isCard
                  ? "card"
                  : "text"
              }
            >
              {axis.values.map((val) => {
                const active = selected === val.value_code;
                const available = isValueAvailable(
                  variants,
                  optionSelection,
                  axis.axis_code,
                  val.value_code,
                  axes
                );
                // 缺货：变体存在(available)但命中变体均无库存。价格未到(priceLoading)时不判缺货，避免误标。
                const outOfStock =
                  available &&
                  !priceLoading &&
                  !isValueInStock(
                    variants,
                    optionSelection,
                    axis.axis_code,
                    val.value_code,
                    axes,
                    stockByCombo
                  );
                // 缺货/不可命中的候选值仍可选中（仅虚框 + 半透明 0.85 标记，不划掉、不禁用）。
                // 命中失败时由 GoodBtnList 依据 variantResolved/stock 屏蔽加购。
                const disabled = false;
                const cls = [
                  styles.value_item,
                  active ? styles.active : "",
                  available ? "" : styles.unavailable,
                  outOfStock ? styles.outofstock : ""
                ]
                  .filter(Boolean)
                  .join(" ");
                const handleClick = () => {
                  setOptionValue(axis.axis_code, val.value_code);
                };
                if (isColor) {
                  return (
                    <button
                      type="button"
                      key={val.value_code}
                      className={cls}
                      disabled={disabled}
                      title={val.value_label}
                      aria-label={val.value_label}
                      aria-pressed={active}
                      aria-disabled={disabled}
                      onClick={handleClick}
                    >
                      <span
                        className={styles.swatch_color}
                        style={{ background: val.swatch_color || "#ccc" }}
                      />
                    </button>
                  );
                }
                if (isImage) {
                  return (
                    <button
                      type="button"
                      key={val.value_code}
                      className={cls}
                      disabled={disabled}
                      title={val.value_label}
                      aria-label={val.value_label}
                      aria-pressed={active}
                      aria-disabled={disabled}
                      onClick={handleClick}
                    >
                      <ImageWithSkeleton
                        className={styles.swatch_image}
                        src={val.swatch_image}
                        alt={val.value_label}
                      />
                    </button>
                  );
                }
                if (isCard) {
                  return (
                    <button
                      type="button"
                      key={val.value_code}
                      className={cls}
                      disabled={disabled}
                      title={val.value_label}
                      aria-label={val.value_label}
                      aria-pressed={active}
                      aria-disabled={disabled}
                      onClick={handleClick}
                    >
                      <span className={styles.card_top}>
                        {val.swatch_image ? (
                          <span className={styles.card_img}>
                            <ImageWithSkeleton
                              className={styles.card_img_el}
                              src={val.swatch_image}
                              alt={val.value_label}
                            />
                          </span>
                        ) : null}
                        <span className={styles.card_title}>
                          {val.value_label}
                        </span>
                      </span>
                      {val.swatch_desc ? (
                        <span className={styles.card_desc}>
                          {val.swatch_desc}
                        </span>
                      ) : null}
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    key={val.value_code}
                    className={cls}
                    disabled={disabled}
                    aria-pressed={active}
                    aria-disabled={disabled}
                    onClick={handleClick}
                  >
                    {val.value_label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
