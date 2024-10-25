import Image from "../../../../../../../../components/Image";
import styles from "./index.module.scss";
import qs from "qs";
import React from "react";

function trimFunc(string) {
  string = string.replace(/\r\n/g, "");
  string = string.replace(/\n/g, "");
  string = string.replace(/\s/g, "");
  return string;
}

export default function MediaHtml({ htmlInfo }) {
  return (
    <div className={styles.media_container}>
      <div dangerouslySetInnerHTML={{ __html: htmlInfo.title }} />
      <style>
        {trimFunc(`
          .${styles.media_container}{
            ${htmlInfo.description}
          }
        `)}
      </style>
    </div>
  );
}
