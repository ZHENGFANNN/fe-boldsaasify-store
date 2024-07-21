import Modal from "@/components/Modal";
import React from "react";
import styles from "./index.module.scss";

function ProductGuarantee({ title, LANG, CONFIG }, ref) {
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
        {
          LANG[
            "store.product.service_agreement.product_guarantee_detail"?.replace(
              "$email",
              CONFIG["company.basic.customer_service"]
            )
          ]
        }
      </div>
    </Modal>
  );
}

export default React.forwardRef(ProductGuarantee);
