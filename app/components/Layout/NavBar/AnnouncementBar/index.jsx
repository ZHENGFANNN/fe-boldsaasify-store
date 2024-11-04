"use client";
import React from "react";
import GlobalContext from "@/[locale]/context";
import styles from "./index.module.scss";

export default function AnnouncementBar() {
  const { CONFIG } = React.useContext(GlobalContext);
  const textListRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const bannerList = React.useMemo(() => {
    return CONFIG["page.common.top_bar"];
  }, []);

  React.useEffect(() => {
    const $textListDom = textListRef.current;
    if (activeIndex === bannerList.length && $textListDom) {
      setTimeout(() => {
        const $activeTextDom = $textListDom.querySelector(
          "[data-active='true']"
        );
        const $firstTextDom = $textListDom.querySelector(
          "[data-active='false']"
        );
        $textListDom.style.transition = "none";
        $activeTextDom.style.transition = "none";
        $firstTextDom.style.transition = "none";
        setActiveIndex(0);
        setTimeout(() => {
          $textListDom.style.transition = "all 0.3s ease-in-out";
          $activeTextDom.style.transition = "all 0.3s ease-in-out";
          $firstTextDom.style.transition = "all 0.3s ease-in-out";
        }, 50);
      }, 300);
    }
  }, [activeIndex]);

  React.useEffect(() => {
    if (!bannerList || bannerList.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((state) => state + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerList]);

  if (!bannerList || bannerList?.length < 1) return null;
  return (
    <div className={styles.announcement_bar}>
      <div className={styles.top_header_container}>
        <div className={styles.text_banner}>
          <div
            ref={textListRef}
            className={styles.text_list}
            style={{
              transform: `translateY(-${activeIndex * 42}px)`,
            }}
          >
            {[...bannerList, bannerList[0]].map((item, index) => {
              return (
                <div key={index} className={styles.text_container}>
                  <div
                    className={styles.text}
                    data-active={index === activeIndex}
                    dangerouslySetInnerHTML={{
                      __html: item.content,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
