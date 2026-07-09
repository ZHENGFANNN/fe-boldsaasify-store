"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import { useSpinFrames } from "../spinDemo";

export default function SelectList() {
  const {
    LANG,
    productShowType,
    setProductShowType,
    productInfo,
    lazyLoading,
  } = React.useContext(ProductContext);
  const spinFrames = useSpinFrames(productInfo);

  const options = React.useMemo(() => {
    if (productInfo) {
      const list = [];
      if (
        Array.isArray(productInfo.image_list) &&
        productInfo.image_list.length > 0
      ) {
        list.push({
          type: "image",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/media-image.svg`,
          text: LANG["store.product.image"],
        });
      }
      if (productInfo.video_url) {
        list.push({
          type: "video",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/media-play.svg`,
          text: LANG["store.product.product_introduce"],
        });
      }
      if (productInfo.three_d) {
        list.push({
          type: "3d",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/media-three-3d.svg`,
          text: "3D",
        });
      }
      if (spinFrames && spinFrames.length > 0) {
        list.push({
          type: "spin",
          icon_src: `${process.env.NEXT_PUBLIC_FILE}/common/image/icon/media-three-3d.svg`,
          text: "360°",
        });
      }
      return list;
    } else {
      return null;
    }
  }, [spinFrames]);

  // spin tab 不可用时（如关闭 demo）自动回到 Photos，避免空白媒体区
  React.useEffect(() => {
    if (
      productShowType === "spin" &&
      (!spinFrames || spinFrames.length === 0)
    ) {
      setProductShowType("image");
    }
  }, [productShowType, spinFrames, setProductShowType]);

  React.useEffect(() => {
    if (!lazyLoading) {
      // 高亮胶囊定位：直接读激活 tab 的真实位置/宽度，
      // 不依赖固定的 image→video→3d/spin 顺序（缺某个 tab 时累加宽度会算出 NaN，
      // 胶囊无法滑动、停在首个 tab 上盖住其文字）
      const $typeColor = $(`.${styles.type_container_color}`);
      const activeEl = $(`.${styles.type_active}`).get(0);
      if (activeEl) {
        $typeColor.css({
          transform: `translate3d(${activeEl.offsetLeft}px, 0px, 0px)`,
          width: `${activeEl.offsetWidth}px`,
        });
      }
    }
  }, [productShowType, lazyLoading]);

  return (
    <div className={styles.left_content_type_container}>
      <div className={styles.left_content_type}>
        <div className={styles.type_container_color}></div>
        {(Array.isArray(options) ? options : []).map((item) => {
          return (
            <div
              key={item.type}
              role={item.type}
              className={
                styles.type_container +
                ` ${productShowType === item.type ? styles.type_active : ""}`
              }
              data-event="ProductMediaTypeTabs"
              data-ev-type={item.type}
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
