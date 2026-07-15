"use client";

import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../../ProductContext";
import {
  MediaImageIcon,
  MediaPlayIcon,
  MediaThreeDIcon,
} from "@/components/Icon";

// 类型 → 内联图标组件映射；图标以 fill="currentColor" 上色，跟随 tab 文字颜色。
const TYPE_ICON_MAP = {
  image: MediaImageIcon,
  video: MediaPlayIcon,
  "3d": MediaThreeDIcon,
};

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
      if (
        Array.isArray(productInfo.image_list) &&
        productInfo.image_list.length > 0
      ) {
        list.push({
          type: "image",
          text: LANG["store.product.image"],
        });
      }
      if (productInfo.video_url) {
        list.push({
          type: "video",
          text: LANG["store.product.product_introduce"],
        });
      }
      if (productInfo.three_d) {
        list.push({
          type: "3d",
          text: "3D",
        });
      }
      return list;
    } else {
      return null;
    }
  }, [productInfo]);

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
          const IconCmp = TYPE_ICON_MAP[item.type];
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
              {IconCmp ? (
                <IconCmp width={16} height={16} className={styles.tab_icon} />
              ) : null}
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
