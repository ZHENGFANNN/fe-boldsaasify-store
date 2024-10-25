import Image from "../../../../../../../../components/Image";
import styles from "./index.module.scss";
import qs from "qs";
import React from "react";

export default function MediaVideo({ imageInfo, productName }) {
  const { src, title, description, width, height } = React.useMemo(() => {
    const { image_src, title, description } = imageInfo;
    const src = image_src.split("?")[0] || image_src;
    const { width, height } = qs.parse(image_src.split("?")[1]);
    return {
      src,
      title,
      description,
      width,
      height,
    };
  }, [imageInfo]);
  return (
    <div className={styles.media_container}>
      <div className={styles.media_item}>
        {title || description ? (
          <div className={styles.media_description}>
            {title ? <h3>{title}</h3> : null}
            {description ? <p>{description}</p> : null}
          </div>
        ) : null}
        <div
          className={styles.img_container}
          style={{
            height: isNaN((100 * height) / width)
              ? "auto"
              : `calc((100vw - 48px) * ${height / width})`,
            maxHeight: isNaN((1200 * height) / width)
              ? "auto"
              : (1200 * height) / width,
          }}
        >
          <Image alt={title || description || productName} src={src} />
        </div>
      </div>
    </div>
  );
}
