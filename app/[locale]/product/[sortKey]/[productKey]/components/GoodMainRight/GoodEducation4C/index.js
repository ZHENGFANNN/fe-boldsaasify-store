"use client";

// 商品详情页买点区 · 4C 钻石教育入口
// 4 行（Cut/Color/Clarity/Carat），点击在共享 Modal 内展示对应交互组件（embedded 模式）。
// 复用 /education 的交互组件；LANG 取 ProductContext（layout 已加 store.education 命名空间，带英文兜底）。

import React from "react";

import Modal from "@/components/Modal";
import ProductContext from "../../../ProductContext";

import CutGrade from "@/[locale]/education/components/CutGrade";
import ColorScale from "@/[locale]/education/components/ColorScale";
import ClarityCompare from "@/[locale]/education/components/ClarityCompare";
import CaratVisualizer from "@/[locale]/education/components/CaratVisualizer";

import styles from "./index.module.scss";

export default function GoodEducation4C() {
  const { LANG } = React.useContext(ProductContext);
  const modalRef = React.useRef();
  const [active, setActive] = React.useState("cut");

  const items = [
    {
      key: "cut",
      label: LANG?.["store.education.learn_cut"] || "Diamond Cut",
      Component: CutGrade
    },
    {
      key: "color",
      label: LANG?.["store.education.learn_color"] || "Diamond Color",
      Component: ColorScale
    },
    {
      key: "clarity",
      label: LANG?.["store.education.learn_clarity"] || "Diamond Clarity",
      Component: ClarityCompare
    },
    {
      key: "carat",
      label: LANG?.["store.education.learn_carat"] || "Carat Weight",
      Component: CaratVisualizer
    }
  ];

  const current = items.find((i) => i.key === active) || items[0];
  const ActiveComponent = current.Component;

  function open(item) {
    setActive(item.key);
    modalRef.current.show({ title: item.label });
  }

  return (
    <div className={styles.container} data-role="good-education-4c">
      <div className={styles.heading}>
        {LANG?.["store.education.kicker"] || "Diamond Education"}
      </div>
      <div className={styles.list}>
        {items.map((item) => (
          <div
            key={item.key}
            className={styles.item}
            data-event="Education4C"
            data-ev-key={item.key}
            onClick={() => open(item)}
          >
            <div className={styles.text}>{item.label}</div>
            <div className={styles.arrow} aria-hidden="true" />
          </div>
        ))}
      </div>

      <Modal ref={modalRef}>
        <div className={styles.modalBody}>
          <ActiveComponent LANG={LANG} embedded />
        </div>
      </Modal>
    </div>
  );
}
