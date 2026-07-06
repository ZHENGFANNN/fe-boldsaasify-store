"use client";
import styles from "./index.module.scss";
import React from "react";

import DeliveryTermsModal from "./components/DeliveryTermsModal";
import ProductGuarantee from "./components/ProductGuarantee";
import ViewOrder from "./components/ViewOrder";

import ProductContext from "../../../ProductContext";
import GlobalContext from "@/[locale]/context";

export default function GoodGuarantee() {
  const { showContactModal } = React.useContext(GlobalContext);
  const { LANG, CONFIG } = React.useContext(ProductContext);

  const DeliveryTermsModalRef = React.useRef();
  const ProductGuaranteeRef = React.useRef();
  const ViewOrderRef = React.useRef();

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        <div
          className={styles.item}
          data-event="ProductGuarantee-DeliveryTerms"
          onClick={() => {
            DeliveryTermsModalRef.current.show();
          }}
        >
          <div className={styles.left_content}>
            <div className={styles.icon}>
              <img
                alt={LANG["store.product.service_agreement.delivery_terms"]}
                src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/product-deliver.svg`}
              />
            </div>
            <div className={styles.text}>
              {LANG["store.product.service_agreement.delivery_terms"]}
            </div>
          </div>
          <div className={styles.arrow_icon}></div>
        </div>
        <div
          data-event="ProductGuarantee-ProductGuarantee"
          onClick={() => {
            ProductGuaranteeRef.current.show();
          }}
          className={styles.item}
        >
          <div className={styles.left_content}>
            <div className={styles.icon}>
              <img
                alt={LANG["store.product.service_agreement.produc_guarantee"]}
                src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/product-guarantee.svg`}
              />
            </div>
            <div className={styles.text}>
              {LANG["store.product.service_agreement.produc_guarantee"]}
            </div>
          </div>
          <div className={styles.arrow_icon}></div>
        </div>
        <div
          data-event="ProductGuarantee-ViewOrder"
          onClick={() => {
            ViewOrderRef.current.show();
          }}
          className={styles.item}
        >
          <div className={styles.left_content}>
            <div className={styles.icon}>
              <img
                alt={LANG["store.product.service_agreement.view_order"]}
                src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/product-order.svg`}
              />
            </div>
            <div className={styles.text}>
              {LANG["store.product.service_agreement.view_order"]}
            </div>
          </div>
          <div className={styles.arrow_icon}></div>
        </div>
      </div>
      <div
        className={styles.email_question_container}
        data-event="ProductGuarantee-Email"
        onClick={() => {
          showContactModal();
        }}
      >
        <img
          alt={LANG["store.product.question_email"]}
          src={`${process.env.NEXT_PUBLIC_FILE}/common/image/icon/product-email.png`}
        />
        <div>{LANG["store.product.question_email"]}</div>
      </div>
      <DeliveryTermsModal
        LANG={LANG}
        CONFIG={CONFIG}
        ref={DeliveryTermsModalRef}
        title={LANG["store.product.service_agreement.delivery_terms"]}
      />
      <ProductGuarantee
        LANG={LANG}
        CONFIG={CONFIG}
        ref={ProductGuaranteeRef}
        title={LANG["store.product.service_agreement.produc_guarantee"]}
      />
      <ViewOrder
        LANG={LANG}
        CONFIG={CONFIG}
        ref={ViewOrderRef}
        title={LANG["store.product.service_agreement.view_order"]}
      />
    </div>
  );
}
