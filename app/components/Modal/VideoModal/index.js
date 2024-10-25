/** @format */

"use client";
import React from "react";
import styles from "./index.module.scss";
import ReactDOM from "react-dom";
import Image from "../../Image";
import Video from "../../Video";

export default function VideoModal({
  poster = "",
  alt = "",
  src = "",
  height = "100px",
  width = "100px",
  borderRadius = "6px",
  lazyLoading = false,
}) {
  const videoRef = React.useRef(null);
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (show) {
      videoRef.current?.play();
      document.body.style.overflow = "hidden";
    } else {
      videoRef.current?.pause();
      document.body.style.overflow = "unset";
    }
    return () => {
      videoRef.current?.pause();
    };
  }, [show]);
  return (
    <div className={styles.container}>
      <div className={styles.play_icon_container} onClick={() => setShow(true)}>
        <div className={styles.play_icon}></div>
      </div>
      {poster ? (
        <Image
          alt={alt}
          src={poster}
          style={{
            height,
            width,
            borderRadius,
          }}
        />
      ) : null}

      {!lazyLoading &&
        ReactDOM.createPortal(
          <div className={[styles.fixed, show ? styles.show : ""].join(" ")}>
            <div
              onClick={() => setShow(false)}
              className={styles.fixed_container}
            >
              <div
                className={styles.media}
                onClick={(e) => {
                  const event = e || window.event;
                  if (event.stopPropagation) {
                    event.stopPropagation();
                  } else {
                    event.cancelBubble = true;
                  }
                }}
              >
                <div className={styles.close} onClick={() => setShow(false)}>
                  ×
                </div>
                <Video
                  preload="none"
                  actionRef={videoRef}
                  controls
                  src={src}
                  poster={poster}
                  controlsList="nodownload nofullscreen"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
