import React from "react";
import styles from "./index.module.scss";
import Video from "@/components/Video";
import qs from "qs";

export default function MediaVideo({ videoInfo }) {
  const { title, description, video, poster, videoWidth, videoHeight } =
    React.useMemo(() => {
      const { title, description, video_src, poster_src } = videoInfo;
      const video = video_src.split("?")[0] || video_src;
      const { width: videoWidth, height: videoHeight } = qs.parse(
        video_src.split("?")[1]
      );
      return {
        title,
        description,
        video,
        videoWidth,
        videoHeight,
        poster: poster_src,
      };
    }, [videoInfo]);
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
          className={styles.video_container}
          style={{
            height: isNaN((100 * videoHeight) / videoWidth)
              ? "auto"
              : `calc((100vw - 48px) * ${videoHeight / videoWidth})`,
            maxHeight: isNaN((1200 * videoHeight) / videoWidth)
              ? "auto"
              : (1200 * videoHeight) / videoWidth,
          }}
        >
          <Video preload="none" controls loop src={video} poster={poster} />
        </div>
      </div>
    </div>
  );
}
