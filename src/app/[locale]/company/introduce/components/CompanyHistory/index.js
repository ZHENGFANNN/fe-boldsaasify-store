"use client";

import React from "react";
import styles from "../../page.module.scss";

export default function CompanyHistory({ CONFIG }) {
  // 处理企业历程
  React.useEffect(() => {
    Promise.all([
      import("jquery"),
      import("gsap/dist/gsap.js"),
      import("gsap/dist/ScrollTrigger.js"),
    ]).then(([{ default: $ }, { gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      const tl = gsap.timeline();
      const $domList = $("." + styles.expand_content);
      const $timeList = $("." + styles.expand_time_line_text).find("div");
      const rate = 1 / $domList.length;
      const t2 = gsap.timeline();
      t2.to("." + styles.expand_line_container, {
        opacity: 1,
      });
      $domList.each(function (index) {
        tl.fromTo(
          $timeList[index],
          {
            display: "none",
            opacity: 0,
          },
          {
            display: "flex",
            color: "#fff",
            opacity: 1,
            duration: 0.5,
            ease: "none",
          }
        );
        tl.fromTo(
          $domList[index],
          {
            opacity: 0,
            transform: "translateY(70px)",
            ease: "none",
          },
          {
            transform: "translateY(30px)",
            opacity: 1,
            duration: 1,
            ease: "none",
          }
        );
        t2.to("." + styles.expand_time_line_white, {
          width: `${100 * rate * (index + 1)}%`,
          duration: 1,
          ease: "none",
        });
        if (index === $domList.length - 1) return;
        tl.to($domList[index], {
          opacity: 0,
          duration: 1,
          ease: "none",
        });
        tl.to($timeList[index], {
          display: "none",
        });
      });
      ScrollTrigger.create({
        animation: tl,
        trigger: "." + styles.expand_sloga_container,
        endTrigger: "." + styles.expand_container,
        start: "top +=60",
        end: "bottom bottom",
        scrub: true,
        ease: "none",
      });
      ScrollTrigger.create({
        animation: t2,
        trigger: "." + styles.expand_sloga_container,
        endTrigger: "." + styles.expand_container,
        start: "top +=60",
        end: "bottom bottom",
        scrub: true,
        ease: "none",
      });
    });
  }, []);

  return (
    <section className={styles.expand_container}>
      <div className={styles.expand_container_inner}>
        <div className={styles.expand_line_container}>
          <div className={styles.expand_time_line_text}>
            {CONFIG["company.company_history.index"]?.map((item) => {
              return <div key={item.id}>{item.year}</div>;
            })}
          </div>
          <div className={styles.expand_time_line_grey}></div>
          <div className={styles.expand_time_line_white}></div>
        </div>
        {CONFIG["company.company_history.index"]?.map((item) => {
          return (
            <div key={item.id} className={styles.expand_content}>
              {item.src ? (
                <div className={styles.expand_content_img}>
                  <img alt={item.title} src={item.src} />
                </div>
              ) : null}
              <div className={styles.expand_content_text}>
                {item.title ? (
                  <div className={styles.expand_content_title}>
                    {item.title}
                  </div>
                ) : null}
                {item.description ? (
                  <div className={styles.expand_content_description}>
                    {item.description}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
