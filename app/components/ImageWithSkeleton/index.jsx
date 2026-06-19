"use client";

import React from "react";
import Skeleton from "@/components/Skeleton";
import styles from "./index.module.scss";

/**
 * 图片加载占位：未加载完成前显示 Skeleton shimmer，onLoad/onError 后淡入真实图片。
 * 尺寸由外层容器(className/style)控制，本组件 100% 填充。
 *
 * @param {string} src
 * @param {string} alt
 * @param {"rect"|"circular"} skeletonVariant - 占位形状，默认 rect
 * @param {string} className - 透传到 <img>
 */
export default function ImageWithSkeleton({
  src,
  alt = "",
  skeletonVariant = "rect",
  className = "",
  wrapClassName = "",
  ...rest
}) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <span className={`${styles.wrap} ${wrapClassName}`.trim()}>
      {!loaded ? (
        <Skeleton
          variant={skeletonVariant}
          className={styles.skeleton}
          aria-label={alt || "loading"}
        />
      ) : null}
      <img
        {...rest}
        src={src}
        alt={alt}
        className={`${styles.img} ${className}`.trim()}
        data-loaded={loaded}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </span>
  );
}
