"use client";

import styles from "./index.module.scss";
import CreditForm from "../CreditForm";
import React from "react";

function PayList({ LANG, setPayKey, payKey, payWayList }, ref) {
  const creditRef = React.useRef(null);
  React.useImperativeHandle(ref, () => {
    return {
      onSubmit: () => {
        return creditRef.current.onSubmit();
      },
    };
  });
  return (
    <ul className={styles.pay_list}>
      {payWayList.map((item, index) => {
        return (
          <li
            onClick={() => {
              setPayKey(item.key);
            }}
            className={`${styles.pay_item} ${
              item.key == payKey ? styles.active : ""
            }`}
            key={index}
          >
            <div className={styles.pay_item_select}>
              <div className={styles.pay_text}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <div
                className={`${styles.img_container}
                  ${item.key === "creditCard" ? styles.credit_card : ""}
                `}
              >
                {item.imgList?.map((img, imgIndex) => {
                  return <img key={imgIndex} alt={item.title} src={img} />;
                })}
              </div>
            </div>
            <div className={styles.pay_item_additional}>
              {item.key === "creditCard" ? (
                <CreditForm ref={creditRef} LANG={LANG} />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default React.forwardRef(PayList);
