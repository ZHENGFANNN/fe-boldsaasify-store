"use client";

import React from "react";
import { useAtom, useAtomValue } from "jotai";
import styles from "./index.module.scss";
import Loading from "@/components/Loading";
import SearchSelect from "../SearchSelect";
import PurchaseForm from "./PurchaseForm";
import { useCreateWizard } from "../../context";
import {
  methodAtom,
  ordersAtom,
  ordersLoadingAtom,
  productGroupsAtom,
  productsLoadingAtom,
  selectedOrderNumberAtom,
  selectedRowIndexAtom,
  selectedProductKeyAtom,
  activeStepAtom,
  step1DoneAtom,
  rowName,
  rowCombo,
  rowImage,
} from "../../atoms";

export default function OrderProductModule() {
  const { T, LANG, TL, tip, orderNoLabel, searchPh, noMatch } =
    useCreateWizard();

  const [method, setMethod] = useAtom(methodAtom);
  const [selectedOrderNumber, setSelectedOrderNumber] = useAtom(
    selectedOrderNumberAtom
  );
  const [selectedRowIndex, setSelectedRowIndex] = useAtom(selectedRowIndexAtom);
  const [selectedProductKey, setSelectedProductKey] = useAtom(
    selectedProductKeyAtom
  );

  const orders = useAtomValue(ordersAtom);
  const ordersLoading = useAtomValue(ordersLoadingAtom);
  const productGroups = useAtomValue(productGroupsAtom);
  const productsLoading = useAtomValue(productsLoadingAtom);
  const step1Done = useAtomValue(step1DoneAtom);
  const [, setActiveStep] = useAtom(activeStepAtom);

  // 订单行 → 可搜索下拉选项（含产品图片）
  const orderOptions = React.useMemo(
    () =>
      orders.flatMap((o) =>
        (o.order_list || []).map((row, ri) => ({
          value: `${o.order_number}__${ri}`,
          label: rowName(row),
          subLabel: `${orderNoLabel}: ${o.order_number}${
            rowCombo(row) ? ` · ${rowCombo(row)}` : ""
          }`,
          image: rowImage(row),
        }))
      ),
    [orders, orderNoLabel]
  );

  const orderValue =
    selectedOrderNumber && selectedRowIndex >= 0
      ? `${selectedOrderNumber}__${selectedRowIndex}`
      : "";

  const productOptions = React.useMemo(
    () =>
      productGroups.flatMap((g) =>
        g.products.map((p) => ({
          value: p.key,
          label: p.name,
          subLabel: g.name,
          image: p.image,
        }))
      ),
    [productGroups]
  );

  const confirmStep1 = () => {
    if (!step1Done) {
      tip(
        T(
          LANG,
          "user_account.after_sale.step1.require",
          "Please select the item you need help with."
        ),
        "error"
      );
      return;
    }
    setActiveStep(2);
  };

  return (
    <>
      <div
        className={`${styles.seg_tabs} ${
          method === "order" ? styles.seg_left : styles.seg_right
        }`}
      >
        <button
          type="button"
          className={`${styles.seg_item} ${
            method === "order" ? styles.active : ""
          }`}
          onClick={() => setMethod("order")}
        >
          {T(LANG, "user_account.after_sale.method.order", "Order")}
        </button>
        <button
          type="button"
          className={`${styles.seg_item} ${
            method === "product" ? styles.active : ""
          }`}
          onClick={() => setMethod("product")}
        >
          {T(LANG, "user_account.after_sale.method.product", "Product")}
        </button>
      </div>

      {method === "order" ? (
        ordersLoading ? (
          <Loading height={160} />
        ) : orders.length < 1 ? (
          <div className={styles.empty}>
            {T(
              LANG,
              "user_account.after_sale.no_orders",
              "No orders found."
            )}
          </div>
        ) : (
          <SearchSelect
            options={orderOptions}
            value={orderValue}
            onChange={(v) => {
              const [ono, ri] = v.split("__");
              setSelectedOrderNumber(ono);
              setSelectedRowIndex(Number(ri));
            }}
            placeholder={TL(
              "user_account.after_sale.order_ph",
              "选择订单商品",
              "Select an order item"
            )}
            searchPlaceholder={searchPh}
            emptyText={noMatch}
          />
        )
      ) : (
        <>
          {productsLoading ? (
            <Loading height={160} />
          ) : productGroups.length < 1 ? (
            <div className={styles.empty}>
              {T(
                LANG,
                "user_account.after_sale.no_products",
                "No products found."
              )}
            </div>
          ) : (
            <SearchSelect
              options={productOptions}
              value={selectedProductKey}
              onChange={(v) => setSelectedProductKey(v)}
              placeholder={TL(
                "user_account.after_sale.product_ph",
                "选择产品型号",
                "Select a product model"
              )}
              searchPlaceholder={searchPh}
              emptyText={noMatch}
            />
          )}

          <PurchaseForm />
        </>
      )}

      <div className={styles.step_actions}>
        <button
          type="button"
          className={styles.btn_primary}
          onClick={confirmStep1}
        >
          {T(LANG, "user_account.after_sale.next", "Next")}
        </button>
      </div>
    </>
  );
}
