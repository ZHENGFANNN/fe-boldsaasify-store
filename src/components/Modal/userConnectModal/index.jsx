import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/context";

// 临时功能
function BuyModal(_, ref) {
  const [show, setShow] = React.useState(false);
  const { CONFIG, LANG } = React.useContext(GlobalContext);

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
        <p>{LANG["common.other.offline_dev"]}</p>
        <p style={{ fontWeight: 700, marginBottom: "8px" }}>
          {LANG["common.other.contact_info"]}
        </p>
        <p style={{ fontWeight: 700 }}>
          {CONFIG["company.basic.customer_service"]}
        </p>
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

export default React.forwardRef(BuyModal);
