import React from "react";

import GoodMainText from "./GoodMainText";
import GoodPrice from "./GoodPrice";
import GoodReviewsRate from "./GoodReviewsRate";
import VariantSelector from "./VariantSelector";
import CustomizationFields from "./CustomizationFields";
import GiftBundle from "./GiftBundle";
import GoodNumber from "./GoodNumber";
import GoodBtnList from "./GoodBtnList";
import GoodContent from "./GoodContent";
import GoodGuarantee from "./GoodGuarantee";
import GoodCertificate from "./GoodCertificate";
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
      {/* 买X送Y 买赠模块：仅当前商品命中「送具体商品」的自动买赠规则时展示 */}
      <GiftBundle />
      <GoodNumber />
      <GoodBtnList />
      <GoodContent />
      <GoodGuarantee />
      <GoodCertificate />
    </div>
  );
}
