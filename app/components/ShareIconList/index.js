"use client";

import React from "react";
import styles from "./index.module.scss";
import ShowTipModal from "../Modal/ShowTipModal";

export default function ShareIconList({ url, text }) {
  const tipRef = React.useRef(null);
  const { FB_LINK_FORMAT, TW_LINK_FORMAT, IN_LINK_FORMAT, MAIL_LINK_FORMAT } =
    React.useMemo(() => {
      const FB_LINK_FORMAT = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}&quote=${text}`;
      const TW_LINK_FORMAT = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${text}`;
      const IN_LINK_FORMAT = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        url
      )}&title=${text}&source=${encodeURIComponent(url)}`;
      const MAIL_LINK_FORMAT = `mailto:?subject=${encodeURIComponent(
        url
      )}&body=${text}`;
      return {
        FB_LINK_FORMAT,
        TW_LINK_FORMAT,
        IN_LINK_FORMAT,
        MAIL_LINK_FORMAT,
      };
    }, []);
  return (
    <div className={styles.container}>
      <div className={styles.share_list}>
        <a
          className={styles.share_icon}
          href={FB_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/share-facebook.svg`}
            alt="facebook"
          />
        </a>
        <a
          className={styles.share_icon}
          href={TW_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/share-x.svg`}
            alt="twitter"
          />
        </a>
        <a
          className={styles.share_icon}
          href={IN_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/share-linkedin.svg`}
            alt="linkedin"
          />
        </a>
        <a
          className={styles.share_icon}
          href={MAIL_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/share-email.svg`}
            alt="mail"
          />
        </a>
        <a
          className={styles.share_icon}
          onClick={() => {
            window.navigator.clipboard.writeText(`${text} ${url}`);
            tipRef.current.show({
              type: "success",
              text: "复制成功！",
            });
          }}
        >
          <img
            src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/share-copy.svg`}
            alt="mail"
          />
        </a>
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
