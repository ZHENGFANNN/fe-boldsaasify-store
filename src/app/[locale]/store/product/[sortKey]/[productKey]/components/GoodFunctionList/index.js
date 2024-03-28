"use client";
// 参数组件
import React from "react";
import styles from "./index.module.scss";

import Image from "@/components/Image";
import { lazyLoadImages } from "@/utils/optimization";
import ProductContext from "../../ProductContext";

export default function GoodFunctionList() {
  const {
    lazyLoading,
    LANG,
    productInfo: { funcionList },
  } = React.useContext(ProductContext);
  const mainFunction = React.useMemo(() => {
    return funcionList.filter((item) => !!item.image);
  }, [funcionList]);

  React.useEffect(() => {
    if (!lazyLoading) {
      const cleanLazy = lazyLoadImages($(`.${styles.function_images}`));
      return () => cleanLazy();
    }
  }, [lazyLoading]);

  if (funcionList.length < 1) return null;
  return (
    <section className={`${styles.function}`} id="productfunction">
      <div className={styles.function_container}>
        <h2>{LANG["store.product.features"]}</h2>
        {/* 图文功能 */}
        {mainFunction.length > 0 ? (
          <ul className={styles.function_images}>
            {mainFunction.map((item, index) => {
              return (
                <li key={index}>
                  <h3>{item.name}</h3>
                  <Image alt={item.name} src={item.image} />
                </li>
              );
            })}
          </ul>
        ) : null}

        {/* 所有功能 */}
        <div className={styles.function_list}>
          <ul>
            {funcionList.map((item, index) => {
              return (
                <li key={index}>
                  <p>{item.name}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
