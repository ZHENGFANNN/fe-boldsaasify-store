"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";

export default function SelectList() {
  const {
    LANG,
    productShowType,
    setProductShowType,
    productInfo,
    lazyLoading,
  } = React.useContext(ProductContext);

  const options = React.useMemo(() => {
    if (productInfo) {
      const list = [];
      if (productInfo.image_list.length > 0) {
        list.push({
          type: "image",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/image/icon/media-image.svg`,
          text: LANG["store.product.image"],
        });
      }
      if (productInfo.video_url) {
        list.push({
          type: "video",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/image/icon/media-play.svg`,
          text: LANG["store.product.product_introduce"],
        });
      }
      if (productInfo.three_d) {
        list.push({
          type: "3d",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/image/icon/media-three-3d.svg`,
          text: "3D",
        });
      }
      return list;
    } else {
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!lazyLoading) {
      // 初始化类型按钮
      const $typeColor = $(`.${styles.type_container_color}`);
      const imageWidth = $('[role="image"]').innerWidth();
      const videoWidth = $('[role="video"]').innerWidth();
      const activeWidth = $(`.${styles.type_active}`).innerWidth();
      let transformX = 0;
      !!(productShowType === "video") && (transformX = imageWidth + 4);
      !!(productShowType === "3d") &&
        (transformX = videoWidth + imageWidth + 8);
      $typeColor.css({
        transform: `translate3d(${transformX}px, 0px, 0px)`,
        width: `${activeWidth}px`,
      });
    }
  }, [productShowType, lazyLoading]);
  return (
    <div className={styles.left_content_type_container}>
      <div className={styles.left_content_type}>
        <div className={styles.type_container_color}></div>
        {options.map((item) => {
          if (item.type === "3d") return null;
          return (
            <div
              key={item.type}
              role={item.type}
              className={
                styles.type_container +
                ` ${productShowType === item.type ? styles.type_active : ""}`
              }
              onClick={() => {
                setProductShowType(item.type);
              }}
            >
              <svg
                style={{
                  opacity: 0,
                  position: "fixed",
                  left: "-1000px",
                  top: "-1000px",
                }}
              >
                <defs>
                  <filter id={`${item.type}TurnWhite`}>
                    <feFlood
                      floodColor={
                        productShowType === item.type ? "#FFF" : "#000000"
                      }
                      floodOpacity="1"
                      result="color"
                    />
                    <feComposite in="color" in2="SourceGraphic" operator="in" />
                  </filter>
                </defs>
              </svg>
              <img
                style={{
                  filter: `url('#${item.type}TurnWhite')`,
                }}
                alt="image"
                width={16}
                height={16}
                src={item.icon_src}
              />
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
