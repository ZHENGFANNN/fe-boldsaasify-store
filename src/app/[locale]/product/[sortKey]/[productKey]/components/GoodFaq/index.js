"use client";

import React from "react";
import ProductContext from "../../ProductContext";
import styles from "./index.module.scss";

export default function GoodFaq() {
  const {
    LANG,
    CONFIG,
    productInfo: { faqList },
  } = React.useContext(ProductContext);
  const [activity, setActivity] = React.useState();
  // 处理下拉动画
  React.useEffect(() => {
    const $navItemsContainer = document.getElementsByClassName(
      styles.nav_items_container
    );
    if (activity || activity === 0) {
      const $navItems = document.getElementsByClassName(styles.nav_items);
      for (let i = 0; i < $navItemsContainer.length; i++) {
        if (activity === i) {
          $navItemsContainer[activity].style.height =
            $navItems[activity].clientHeight + "px";
        } else {
          $navItemsContainer[i].style.height = 0;
        }
      }
    } else {
      for (let i = 0; i < $navItemsContainer.length; i++) {
        $navItemsContainer[i].style.height = 0;
      }
    }
  }, [activity]);

  const list = React.useMemo(() => {
    return [
      ...faqList,
      {
        type: "faq",
        question: LANG["store.product.service_agreement.delivery_terms"],
        answer: LANG[
          "store.product.service_agreement.delivery_terms_detail"
        ]?.replace("$email", CONFIG["company.basic.customer_service"]),
      },
      {
        type: "faq",
        question: LANG["store.product.service_agreement.produc_guarantee"],
        answer:
          LANG[
            "store.product.service_agreement.product_guarantee_detail"?.replace(
              "$email",
              CONFIG["company.basic.customer_service"]
            )
          ],
      },
      {
        type: "faq",
        question: LANG["store.product.service_agreement.view_order"],
        answer: LANG["store.product.service_agreement.view_order_detail"],
      },
      {
        type: "link",
        question: LANG["common.nav.sales_policy"],
        answer: "/protocol/sales",
      },
    ];
  });

  return (
    <section className={styles.faq} id="product_faq">
      <div className={styles.faq_container}>
        <h2>{LANG["store.product.faq"]}</h2>
        <div className={styles.content_list}>
          <nav className={styles.nav}>
            {/* 导航栏列表 */}
            {list.map((item, index) => {
              if (item.type === "faq") {
                return (
                  <div key={index} className={styles.nav_list}>
                    <p
                      className={styles.nav_title}
                      onClick={() => {
                        if (index === activity) {
                          setActivity(null);
                        } else {
                          setActivity(index);
                        }
                      }}
                    >
                      <span>{item.question}</span>
                      <span
                        className={
                          styles.mobile_icon +
                          " " +
                          `${activity === index ? styles.active : ""}`
                        }
                      ></span>
                    </p>
                    <div className={styles.nav_items_container}>
                      <div className={styles.nav_items}>{item.answer}</div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <a
                    href={item.answer}
                    target="_blank"
                    key={index}
                    className={styles.nav_list}
                  >
                    <p className={styles.nav_title}>
                      <span>{item.question}</span>
                      <span className={styles.arrow_icon}></span>
                    </p>
                  </a>
                );
              }
            })}
          </nav>
        </div>
      </div>
    </section>
  );
}
