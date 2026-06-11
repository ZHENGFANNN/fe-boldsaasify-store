import React from "react";

import GoodMainText from "./GoodMainText";
import GoodPrice from "./GoodPrice";
import GoodReviewsRate from "./GoodReviewsRate";
import GoodComboList from "./GoodComboList";
import GoodOptionList from "./GoodOptionList";
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
      <GoodComboList />
      <GoodOptionList />
      <GoodNumber />
      <GoodBtnList />
      <GoodContent />
      <GoodGuarantee />
    </div>
  );
}
