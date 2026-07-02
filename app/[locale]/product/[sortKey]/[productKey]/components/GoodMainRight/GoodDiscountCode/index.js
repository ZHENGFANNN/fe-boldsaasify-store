"use client";

import React from "react";
import ProductContext from "../../../ProductContext";
import Api from "../../../api";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import readClientArea from "@/utils/readClientArea";
import {
  readStoredDiscountCodes,
  writeStoredDiscountCodes,
} from "@/utils/discount-codes";
import { formatCurrency } from "@/utils";
import styles from "./index.module.scss";

/**
 * 详情页折扣码入口：输入码 → 调接口B validateDiscountCode 校验当前商品是否适用。
 * - applicable=true：提示可减金额，写入共享 localStorage（去重追加），购物车/结算页自动应用。
 * - applicable=false：提示此码不适用本商品。
 * - valid=false / 失败：提示无效。
 */
export default function GoodDiscountCode() {
  const { LANG, productInfo, productCurCombo } =
    React.useContext(ProductContext);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null); // { type: "success"|"error", text }
  const tipRef = React.useRef(null);

  const showTip = React.useCallback(({ text, type }) => {
    tipRef.current?.show({ text, type });
  }, []);

  const handleApply = React.useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || loading) return;

    const sortKey = productInfo?.sort_key;
    const productKey = productInfo?.key;
    const comboKey = productCurCombo?.key;
    if (!sortKey || !productKey) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await Api.validateDiscountCode({
        code: trimmed,
        product_key: productKey,
        sort_key: sortKey,
        combo_key: comboKey,
        area_code: readClientArea(),
        quantity: 1,
      });

      // 接口B：成功 code=0，失败 code=-1（Failed 带业务码）。
      if (res?.code !== 0 || !res?.data) {
        const text =
          LANG["store.product.discount_code_invalid"] ||
          "Invalid discount code";
        setMessage({ type: "error", text });
        showTip({ text, type: "error" });
        return;
      }

      const { valid, applicable, discount_amount, currency } = res.data;

      if (!valid) {
        const text =
          LANG["store.product.discount_code_invalid"] ||
          "Invalid discount code";
        setMessage({ type: "error", text });
        showTip({ text, type: "error" });
        return;
      }

      if (!applicable) {
        const text =
          LANG["store.product.discount_code_not_applicable"] ||
          "This code does not apply to this product";
        setMessage({ type: "error", text });
        showTip({ text, type: "error" });
        return;
      }

      // applicable=true：写入共享 localStorage（去重追加），流转购物车/结算页。
      const existing = readStoredDiscountCodes();
      if (!existing.includes(trimmed)) {
        writeStoredDiscountCodes([...existing, trimmed]);
      }

      const unit = productCurCombo?.areaInfo?.currency_unit;
      const symbol =
        currency || productCurCombo?.areaInfo?.currency_symbol || "";
      // NaN 防御：discount_amount 缺省时归一化为 0，避免渲染出 $NaN。
      const amountText = `${symbol}${formatCurrency(
        Number(discount_amount) || 0,
        unit
      )}`;
      const text = (
        LANG["store.product.discount_code_applied"] ||
        "Saved — code will apply at checkout (save ${amount} on this product)"
      ).replace("${amount}", amountText);
      setMessage({ type: "success", text });
      showTip({ text, type: "success" });
      setCode("");
    } catch (err) {
      const text =
        LANG["store.product.discount_code_invalid"] || "Invalid discount code";
      setMessage({ type: "error", text });
      showTip({ text, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [code, loading, productInfo, productCurCombo, LANG, showTip]);

  return (
    <div className={styles.discount_code} data-role="good-discount-code">
      <div className={styles.discount_code_title}>
        {LANG["store.product.discount_code_title"] || "Have a promo code?"}
      </div>
      <div className={styles.discount_code_row}>
        <input
          type="text"
          className={styles.discount_code_input}
          value={code}
          placeholder={
            LANG["store.product.discount_code_placeholder"] || "Enter code"
          }
          onChange={(e) => {
            setCode(e.target.value);
            setMessage(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
        />
        <button
          type="button"
          className={styles.discount_code_btn}
          disabled={loading || !code.trim()}
          onClick={handleApply}
        >
          {LANG["store.product.discount_code_apply"] || "Apply"}
        </button>
      </div>
      {message ? (
        <div
          className={styles.discount_code_msg}
          data-type={message.type}
        >
          {message.text}
        </div>
      ) : null}
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
