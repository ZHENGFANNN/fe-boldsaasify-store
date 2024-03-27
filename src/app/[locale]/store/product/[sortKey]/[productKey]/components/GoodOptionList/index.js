"use client";
import React from "react";
import styles from "./index.module.scss";
import useProductStore from "../../productStore";

export default function GoodOptionList({
  title = "",
  options = [],
  type,
  from = "product",
}) {
  const setProductOptions = useProductStore((state) => state.setProductOptions);
  const productOptions = useProductStore((state) => state.productOptions);
  const [active, setActive] = React.useState(options[0].title);

  const onChange = React.useCallback((item) => {
    setProductOptions(item);
  });

  React.useEffect(() => {
    if (from !== "components") {
      onChange({ name: title, value: options[0].title });
    }
  }, [from]);

  const currentItem = React.useMemo(() => {
    let value;
    Object.keys(productOptions).forEach((key) => {
      if (productOptions[key].name === title) {
        value = productOptions[key].value;
      }
    });
    return value;
  }, [productOptions, title]);

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
                  setActive(item.title);
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
                  setActive(item.title);
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
