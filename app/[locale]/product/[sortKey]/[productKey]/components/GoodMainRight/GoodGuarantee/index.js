"use client";
import styles from "./index.module.scss";
import React from "react";

import DeliveryTermsModal from "./components/DeliveryTermsModal";
import ProductGuarantee from "./components/ProductGuarantee";
import ViewOrder from "./components/ViewOrder";

import ProductContext from "../../../ProductContext";
import GlobalContext from "@/[locale]/context";
import {
  ProductEmailIcon,
  TruckIcon,
  ShieldCheckIcon,
  ClipboardListIcon,
} from "@/components/Icon";

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
              <TruckIcon
                aria-label={
                  LANG["store.product.service_agreement.delivery_terms"]
                }
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
              <ShieldCheckIcon
                aria-label={
                  LANG["store.product.service_agreement.produc_guarantee"]
                }
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
              <ClipboardListIcon
                aria-label={LANG["store.product.service_agreement.view_order"]}
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
        <ProductEmailIcon aria-label={LANG["store.product.question_email"]} />
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
