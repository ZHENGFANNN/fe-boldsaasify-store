"use client";

import React from "react";
import styles from "./index.module.scss";
import ReactDOM from "react-dom";
import Image from "@/components/Image";

export default function ImageModal({
  src = "",
  height = "100px",
  width = "100px",
  borderRadius = "6px",
  lazyLoading = false,
}) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [show]);
  return (
    <div className={styles.container}>
      <Image
        onClick={() => setShow(true)}
        src={src}
        style={{
          height,
          width,
          borderRadius,
        }}
      />
      {!lazyLoading &&
        ReactDOM.createPortal(
          <div className={[styles.fixed, show ? styles.show : ""].join(" ")}>
            <div
              onClick={() => setShow(false)}
              className={styles.fixed_container}
            >
              <div className={styles.media}>
                <div className={styles.close} onClick={() => setShow(false)}>
                  ×
                </div>
                {show ? <img src={src} /> : null}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
