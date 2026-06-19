import React from "react";

import GoodMainText from "./GoodMainText";
import GoodPrice from "./GoodPrice";
import GoodReviewsRate from "./GoodReviewsRate";
import VariantSelector from "./VariantSelector";
import CustomizationFields from "./CustomizationFields";
import GoodNumber from "./GoodNumber";
import GoodBtnList from "./GoodBtnList";
import GoodContent from "./GoodContent";
import GoodGuarantee from "./GoodGuarantee";
import styles from "./index.module.scss";

export default function GoodMainRight() {
  return (
    <div>
      <GoodMainText />
      <GoodPrice />
      <GoodReviewsRate />
      <div className={styles.line}></div>
      {/* 商品变体选择（V2）。V1 的 GoodComboList/GoodOptionList 已下线，文件保留备查。 */}
      <VariantSelector />
      <CustomizationFields />
      <GoodNumber />
      <GoodBtnList />
      <GoodContent />
      <GoodGuarantee />
    </div>
  );
}
