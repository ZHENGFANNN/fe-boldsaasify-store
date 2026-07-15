/** @format */

import React from "react";
import ReactDOM from "react-dom";
import styles from "./index.module.scss";

function Modal({ children, onClose = () => {} }, ref) {
  const [show, setShow] = React.useState(false);
  const [title, setTitle] = React.useState(false);

  React.useImperativeHandle(ref, () => {
    return {
      show: ({ title } = {}) => {
        setShow(true);
        setTitle(title);
      },
      hide: () => {
        setShow(false);
      },
    };
  });

  React.useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "scroll";
    return () => {
      document.body.style.overflow = "scroll";
    };
  }, [show]);

  const [firstLoad, setFirstLoad] = React.useState(false);
  React.useEffect(() => {
    if (!show) {
      setTimeout(() => {
        setFirstLoad(false);
      }, 300);
    } else {
      setFirstLoad(true);
    }
  }, [show]);

  return (
    <div>
      {firstLoad &&
        ReactDOM.createPortal(
          <div
            className={styles.modal}
            data-show={show}
            onClick={() => {
              setShow(false);
              onClose();
            }}
          >
            <div className={styles.modal_container}>
              <div className={styles.modal_wrapper}>
                <div
                  className={styles.modal_content}
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                  }}
                >
                  {title ? (
                    <div className={styles.header}>
                      <div className={styles.title}>{title}</div>
                      <div
                        className={styles.close}
                        onClick={() => {
                          setShow(false);
                          onClose();
                        }}
                      >
                        ×
                      </div>
                    </div>
                  ) : null}
                  {children}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default React.forwardRef(Modal);
