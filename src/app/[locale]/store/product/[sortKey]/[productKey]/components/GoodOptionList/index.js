"use client";
import React from "react";
import styles from "./index.module.scss";
import ProductContext from "../../ProductContext";

function GoodOptionItem({ title = "", options = [], type }) {
  const { setProductOptions, productOptions } =
    React.useContext(ProductContext);

  const onChange = React.useCallback((item) => {
    setProductOptions(item);
  });

  const currentItem = React.useMemo(() => {
    let value;
    productOptions.forEach((item) => {
      if (item.name === title) {
        value = item.value;
      }
    });
    return value;
  }, [productOptions]);

  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <div className={styles.list}>
        {options.map((item, index) => {
          if (type === "text") {
            return (
              <div
                key={index}
                className={`
                    ${styles.list_item}
                    ${item.title === currentItem ? styles.active : ""}
                `}
                onClick={() => {
                  onChange({
                    name: title,
                    value: item.title,
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
                className={`
                    ${styles.list_item_image}
                    ${item.title === currentItem ? styles.active : ""}
                `}
                onClick={() => {
                  onChange({
                    name: title,
                    value: item.title,
                  });
                }}
              >
                <img alt={item.title} src={item.image} />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

export default function GoodOptionList() {
  const {
    productInfo: { typeList },
  } = React.useContext(ProductContext);

  if (typeList.length < 1) return null;
  return (
    <>
      {typeList.map((item, index) => {
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
