"use client";

import styles from "./index.module.scss";
import Empyt from "@/components/Empyt";
import React from "react";

export default function AddressInfo({ list, setAddressInfo }) {
  const [active, setActive] = React.useState();
  React.useEffect(() => {
    const item = list[0];
    setActive(item?.id);
    setAddressInfo(item);
  }, []);
  return (
    <div className={`${styles.container}`}>
      {list?.length > 0 ? (
        <div className={styles.list}>
          {list.map((item, index) => {
            return (
              <div
                onClick={() => {
                  setActive(item.id);
                  setAddressInfo(item);
                }}
                key={index}
                className={`${styles.item} ${
                  active === item.id ? styles.active : ""
                }`}
              >
                <div className={styles.content}>
                  <div className={styles.user}>
                    <span>
                      {item.first_name}
                      {item.last_name}
                    </span>
                    <span>{`(${item.short_phone}) ${item.phone}`}</span>
                  </div>
                  <div className={styles.address}>
                    <div>{`${item.zip_code} ${item.area_text} ${item.address1}`}</div>
                    <div>{item.address2}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empyt />
      )}
    </div>
  );
}
