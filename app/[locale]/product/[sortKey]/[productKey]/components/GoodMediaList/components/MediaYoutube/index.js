import styles from "./index.module.scss";
export default function MediaYoutube({ youtubeInfo }) {
  return (
    <div className={styles.media_container}>
      <div className={styles.media_item}>
        <div className={styles.media_description}>
          {youtubeInfo.title ? <h3>{youtubeInfo.title}</h3> : null}
          {youtubeInfo.description ? <p>{youtubeInfo.description}</p> : null}
        </div>
        <iframe
          scrolling="no"
          src={`https://www.youtube.com/embed/${youtubeInfo.media_code}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
