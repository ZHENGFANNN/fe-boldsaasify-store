"use client";

import React from "react";
import styles from "./index.module.scss";
import ShowTipModal from "../Modal/ShowTipModal";
import {
  SocialFacebookIcon,
  SocialTwitterIcon,
  SocialLinkedinIcon,
  ShareEmailIcon,
  ShareCopyIcon,
} from "../Icon";

export default function ShareIconList({ text }) {
  const tipRef = React.useRef(null);
  // URL 在客户端挂载后从 window.location 读取（避免服务端 headers() 让页面退出 SSG）。
  const [url, setUrl] = React.useState("");
  React.useEffect(() => {
    setUrl(window.location.href);
  }, []);
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
    }, [url, text]);
  return (
    <div className={styles.container}>
      <div className={styles.share_list}>
        <a
          className={styles.share_icon}
          href={FB_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >
          <SocialFacebookIcon width={26} height={26} />
        </a>
        <a
          className={styles.share_icon}
          href={TW_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
        >
          <SocialTwitterIcon width={26} height={26} />
        </a>
        <a
          className={styles.share_icon}
          href={IN_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          <SocialLinkedinIcon width={26} height={26} />
        </a>
        <a
          className={styles.share_icon}
          href={MAIL_LINK_FORMAT}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share by email"
        >
          <ShareEmailIcon width={26} height={26} />
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
          aria-label="Copy link"
        >
          <ShareCopyIcon width={26} height={26} />
        </a>
      </div>
      <ShowTipModal ref={tipRef} />
    </div>
  );
}
