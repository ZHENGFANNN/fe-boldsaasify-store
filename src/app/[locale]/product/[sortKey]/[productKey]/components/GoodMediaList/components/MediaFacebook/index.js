import styles from "./index.module.scss";
export default function MediaYoutube({ facebookInfo }) {
  return (
    <div className={styles.media_container}>
      <div className={styles.media_item}>
        <div className={styles.media_description}>
          {facebookInfo.title ? <h3>{facebookInfo.title}</h3> : null}
          {facebookInfo.description ? <p>{facebookInfo.description}</p> : null}
        </div>
        <iframe
          src={`https://www.facebook.com/plugins/video.php?href=${facebookInfo.media_code}`}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        ></iframe>
      </div>
    </div>
  );
}
