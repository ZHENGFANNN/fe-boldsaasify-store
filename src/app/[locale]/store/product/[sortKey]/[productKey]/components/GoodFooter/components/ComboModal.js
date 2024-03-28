import React from "react";
import Modal from "@/components/Modal";
import ProductContext from "../../../ProductContext";

import GoodNumber from "../../GoodNumber";
import GoodOptionList from "../../GoodOptionList";
import GoodComboList from "../../GoodComboList";
import GoodBtnList from "../../GoodBtnList";

import styles from "./index.module.scss";

function ComboModal(_, ref) {
  const { LANG } = React.useContext(ProductContext);
  const modalRef = React.useRef();
  React.useImperativeHandle(ref, () => {
    return {
      show: () => {
        modalRef.current.show({ title: LANG["store.product.combo"] });
      },
    };
  });
  return (
    <Modal ref={modalRef}>
      <div className={styles.container}>
        {/* 产品选项 */}
        <GoodOptionList />
        <GoodComboList />
        <GoodNumber />
        <GoodBtnList />
      </div>
    </Modal>
  );
}

export default React.forwardRef(ComboModal);
