"use client";

import React from "react";
import Skeleton from "@/components/Skeleton";
import styles from "./index.module.scss";

type SkeletonVariant = "rect" | "circular";

export type ImageWithSkeletonProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "className" | "onLoad" | "onError"
> & {
  src: string;
  alt?: string;
  /** 占位形状，默认 rect */
  skeletonVariant?: SkeletonVariant;
  /** 透传到 <img> */
  className?: string;
  wrapClassName?: string;
};

function isImageReady(img: HTMLImageElement | null): boolean {
  return Boolean(img?.complete && img.naturalWidth > 0);
}

/** 图片加载占位：未加载完成前显示 Skeleton shimmer，onLoad/onError 后淡入真实图片。 */
export default function ImageWithSkeleton({
  src,
  alt = "",
  skeletonVariant = "rect",
  className = "",
  wrapClassName = "",
  ...rest
}: ImageWithSkeletonProps) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null);
  const loaded = Boolean(src) && loadedSrc === src;

  const markLoaded = React.useCallback(() => {
    setLoadedSrc(src);
  }, [src]);

  // 缓存图可能在 onLoad 绑定前就加载完成
  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (src && isImageReady(img)) {
      setLoadedSrc(src);
    }
  }, [src]);

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
        key={src}
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${styles.img} ${className}`.trim()}
        data-loaded={loaded}
        onLoad={markLoaded}
        onError={markLoaded}
      />
    </span>
  );
}
