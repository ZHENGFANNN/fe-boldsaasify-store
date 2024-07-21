import Modal from "@/components/Modal";
import React from "react";
import styles from "./index.module.scss";

function ViewOrder({ title, LANG }, ref) {
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
        {LANG["store.product.service_agreement.view_order_detail"]}
      </div>
    </Modal>
  );
}

export default React.forwardRef(ViewOrder);
