import React from "react";
import styles from "./index.module.scss";
import GlobalContext from "@/context";

// 临时功能
function ConfirmModal({
  title = "",
  content = "",
  onOk = () => {},
  onCancel = () => {},
  renderNode = "",
}) {
  const [show, setShow] = React.useState(false);
  const { LANG } = React.useContext(GlobalContext);

  return (
    <div className={styles.container}>
      <div
        className={styles.render_container}
        onClick={() => {
          setShow(true);
          document.body.style.overflow = "hidden";
        }}
      >
        {renderNode}
      </div>
      <div className={`${styles.modal} ${show ? styles.show : ""}`}>
        <div className={styles.modal_content}>
          <h2>{title}</h2>
          <p>{content}</p>
          <div className={styles.btn_container}>
            <button
              className={styles.btn_cancel}
              onClick={() => {
                setShow(false);
                onCancel();
                document.body.style.overflow = "scroll";
              }}
            >
              {LANG["common.other.cancel"]}
            </button>
            <button
              className={styles.btn_confirm}
              onClick={() => {
                onOk();
                setShow(false);
                document.body.style.overflow = "scroll";
              }}
            >
              {LANG["common.other.confirm"]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
