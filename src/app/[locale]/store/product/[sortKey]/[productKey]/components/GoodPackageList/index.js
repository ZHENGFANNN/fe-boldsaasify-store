"use client";

import styles from "./index.module.scss";
const imageSize1 = ["lg", "sm", "sm", "lg"];
const imageSize2 = ["lg", "lg", "sm", "sm"];
import React from "react";

import Image from "@/components/Image";
import { lazyLoadImages } from "@/utils/optimization";
import ProductContext from "../../ProductContext";

export default function Package() {
  const {
    LANG,
    productInfo: { packageList },
    lazyLoading,
  } = React.useContext(ProductContext);

  const imageList = React.useMemo(() => {
    return packageList.filter((item) => item.type === "image");
  }, [packageList]);
  const textList = React.useMemo(() => {
    return packageList.filter((item) => item.type === "text");
  }, [packageList]);
  React.useEffect(() => {
    if (!lazyLoading) {
      const cleanLazy = lazyLoadImages($(`.${styles.image_list}`));
      return () => cleanLazy();
    }
  }, [lazyLoading]);

  if (packageList.length < 1) return null;
  return (
    <section className={`${styles.package}`} id="product_package">
      <div className={styles.package_container}>
        <h2>{LANG["store.product.packaging_list"]}</h2>

        {textList.length > 0 ? (
          <div className={styles.content_list}>
            {textList.map((item, index) => {
              return (
                <div className={styles.list_item} key={index}>
                  <h3> {item.key} </h3>
                  <p> {item.value} </p>
                </div>
              );
            })}
          </div>
        ) : null}
        {imageList.length > 0 ? (
          <div className={styles.image_list}>
            {imageList.map((item, index) => {
              return (
                <div
                  className={`
                    ${styles.image_item}
                    ${
                      imageList.length % 2 === 1
                        ? styles[imageSize2[index % 4]]
                        : styles[imageSize1[index % 4]]
                    }
                    ${
                      imageList.length % 2 === 1 && index === 0
                        ? styles.w_100
                        : ""
                    }`}
                  key={index}
                >
                  <Image src={item.image} alt="package" />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
