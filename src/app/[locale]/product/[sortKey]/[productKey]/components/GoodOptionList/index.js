/** @format */

"use client";
import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";

function GoodOptionItem({ title = "", options = [], type }) {
  const { setProductOptions, productOptions, productCurCombo } =
    React.useContext(ProductContext);

  const onChange = React.useCallback((item) => {
    setProductOptions(item);
  });
  const currentItem = React.useMemo(() => {
    return productOptions.find((item) => item.name === title) || {};
  }, [productOptions]);

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <div className={styles.list}>
        {options.map((item, index) => {
          if (type === "text") {
            return (
              <div
                data-carousel={item.index}
                key={index}
                className={`
                    ${styles.list_item}
                    ${item.title === currentItem.value ? styles.active : ""}
                `}
                onClick={() => {
                  onChange({
                    name: title,
                    value: item.title,
                    desc: item.desc,
                  });
                }}
              >
                {item.title}
              </div>
            );
          } else {
            return (
              <div
                key={index}
                data-carousel={item.index}
                className={`
                    ${styles.list_item_image}
                    ${item.title === currentItem.value ? styles.active : ""}
                `}
                onClick={() => {
                  onChange({
                    name: title,
                    value: item.title,
                    desc: item.desc,
                  });
                }}
              >
                <img alt={item.title} src={item.image} />
              </div>
            );
          }
        })}
      </div>
      {currentItem.desc ? (
        <div
          className={styles.tip}
          dangerouslySetInnerHTML={{
            __html: currentItem.desc,
          }}
        ></div>
      ) : null}
    </div>
  );
}

export default function GoodOptionList() {
  const {
    productInfo: { typeList },
    productCurCombo,
    setProductOptions,
    removeProductOptions,
  } = React.useContext(ProductContext);

  const didMountRef = React.useRef(false);

  React.useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    // 设置了值，就不剔除
    const safeList = [];
    typeList.forEach((item) => {
      // 存在关联套餐的且不包含当前套餐的不显示
      if (
        !safeList.includes(item.title) &&
        item.associated &&
        item.combo_keys &&
        !item.combo_keys.includes(productCurCombo?.key)
      ) {
        removeProductOptions(item.title);
      }
      // 存在关联套餐的且包含当前套餐的显示
      if (
        item.associated &&
        item.combo_keys &&
        item.combo_keys.includes(productCurCombo?.key)
      ) {
        // 保存已经设置过的值，就不再清除
        safeList.push(item.title);

        setProductOptions({
          name: item.title,
          value: item.options[0].title,
          desc: item.options[0].desc,
        });
      }
    });
  }, [productCurCombo]);

  if (typeList.length < 1) return null;
  return (
    <>
      {typeList.map((item, index) => {
        // 处理强关联
        if (
          item.associated &&
          item.combo_keys &&
          !item.combo_keys.includes(productCurCombo?.key)
        ) {
          return null;
        }
        return (
          <GoodOptionItem
            key={index}
            title={item.title}
            options={item.options}
            type={item.type}
          />
        );
      })}
    </>
  );
}
