import Modal from "@/components/Modal";
import React from "react";
import styles from "./index.module.scss";

function DeliveryTermsModal({ title, LANG, CONFIG }, ref) {
  const ModalRef = React.useRef();

  React.useImperativeHandle(ref, () => {
    return {
      show: () => {
        ModalRef.current.show({ title });
      },
    };
  });

  return (
    <Modal ref={ModalRef}>
      <div className={styles.container}>
        {LANG["store.product.service_agreement.delivery_terms_detail"]?.replace(
          "$email",
          CONFIG["company.basic.customer_service"]
        )}
      </div>
    </Modal>
  );
}

export default React.forwardRef(DeliveryTermsModal);
