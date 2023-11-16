"use client";
import styles from "../../page.module.scss";
import React from "react";
export default function IntroduceStaff({ LANG, CONFIG }) {
  // 处理主要员工
  React.useEffect(() => {
    import("jquery").then(({ default: $ }) => {
      const $domList = $("." + styles.introduce_staff_content);
      $domList.on("click", function () {
        const $contentDom = $(this).find(
          "." + styles.introduce_staff_introduce_container
        );
        const $btnDom = $(this).find("." + styles.introduce_staff_btn);
        const status = $btnDom.attr("data-roles");
        if (status === "collaspe-btn") {
          $btnDom.attr("data-roles", "more-btn");
          $contentDom.removeClass(styles["opacity-1"]);
        } else {
          $btnDom.attr("data-roles", "collaspe-btn");
          $contentDom.addClass(styles["opacity-1"]);
        }
      });
    });
  }, []);

  return (
    <section className={styles.introduce_staff}>
      <h3 className={styles.introduce_staff_title}>
        {LANG["www.company_introduce. main_staff"]}
      </h3>
      <div className={styles.introduce_staff_content_list}>
        {CONFIG["company.main_members.index"]?.map((item, index) => {
          return (
            <div key={index} className={styles.introduce_staff_content}>
              <div className={styles.introduce_staff_img}>
                <img src={item.src} alt={item.name} />
              </div>
              <div className={styles.introduce_staff_text}>
                <p className={styles.introduce_staff_name}>{item.name}</p>
                <p className={styles.introduce_staff_email}>{item.position}</p>
                <p className={styles.introduce_staff_description}>
                  {item.responsibility}
                </p>
                <div className={styles.introduce_staff_introduce_container}>
                  <p className={styles.introduce_staff_introduce}>
                    {item.introduction}
                  </p>
                </div>
                <div
                  data-roles="more-btn"
                  className={styles.introduce_staff_btn}
                >
                  <div className={styles.more_btn}>
                    {LANG["www.company_introduce.see_more"]}
                  </div>
                  <div className={styles.collapse_btn}>
                    {LANG["www.company_introduce.pack_up"]}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
