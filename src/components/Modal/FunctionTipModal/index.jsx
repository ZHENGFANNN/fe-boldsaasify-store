import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/context";
// 临时功能
function TipModal({ LANG }, ref) {
  const [show, setShow] = React.useState(false);

  React.useImperativeHandle(ref, () => {
    return {
      showModal: () => {
        document.body.style.overflow = "hidden";
        setShow(true);
      },
    };
  });

  return (
    <div className={`${styles.modal} ${show ? styles.show : ""}`}>
      <div className={styles.modal_content}>
        <h2>{LANG["common.other.tip"]}</h2>
        <p>{LANG["common.other.function_dev"]}</p>
        <button
          onClick={() => {
            setShow(false);
            document.body.style.overflow = "scroll";
          }}
        >
          {LANG["common.other.close"]}
        </button>
      </div>
    </div>
  );
}

export default React.forwardRef(TipModal);
