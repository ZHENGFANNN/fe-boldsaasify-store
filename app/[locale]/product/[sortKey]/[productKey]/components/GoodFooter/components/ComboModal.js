import React from "react";
import Modal from "@/components/Modal";
import ProductContext from "../../../ProductContext";

import GoodNumber from "../../GoodMainRight/GoodNumber";
import VariantSelector from "../../GoodMainRight/VariantSelector";
import GoodBtnList from "../../GoodMainRight/GoodBtnList";

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
  // 变体选项（V2）与主区共享同一 ProductContext，选中状态天然同步。
  // 注：定制字段 CustomizationFields 只在主区渲染——它会向 ProductContext.customizeRef
  // 注册取数/校验，若此处再渲染一份会双注册冲突、覆盖主区已填值。本弹窗内的加购按钮
  // 仍通过共享 customizeRef 读到主区填写的定制数据，无需重复渲染。
  return (
    <Modal ref={modalRef}>
      <div className={styles.container}>
        {/* 产品变体选项 */}
        <VariantSelector />
        <GoodNumber />
        <GoodBtnList />
      </div>
    </Modal>
  );
}

export default React.forwardRef(ComboModal);
