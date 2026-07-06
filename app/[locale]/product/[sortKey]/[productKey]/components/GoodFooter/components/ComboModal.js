import React from "react";
import Modal from "@/components/Modal";
import ProductContext from "../../../ProductContext";

import GoodNumber from "../../GoodMainRight/GoodNumber";
import VariantSelector from "../../GoodMainRight/VariantSelector";
import CustomizationFields from "../../GoodMainRight/CustomizationFields";
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
  // 变体选项（V2）与定制字段均与主区共享同一 ProductContext，选中/填写状态天然同步。
  // 定制字段状态集中在 useCustomizeFields（BaseLayout 单例），CustomizationFields 为纯展示，
  // 因此可与主区同时渲染：两处共用同一份填写值、只注册一次 getData/validate，无双注册冲突。
  return (
    <Modal ref={modalRef}>
      <div className={styles.container}>
        {/* 产品变体选项 */}
        <VariantSelector />
        {/* 自定义字段选择（与主区共享状态） */}
        <CustomizationFields />
        <GoodNumber />
        <GoodBtnList />
      </div>
    </Modal>
  );
}

export default React.forwardRef(ComboModal);
