"use client";

import styles from "./index.module.scss";
import Empyt from "../../../../components/Empyt";
import React from "react";

export default function AddressInfo({ list, setAddressInfo, addressInfo }) {
  // 地址列表是异步加载的：list 到达后自动选中第一个(默认地址)，且不覆盖用户已手动选择的项。
  // 选中态单一真源为父级 addressInfo（不再本地存 active）。
  // 原实现依赖数组为 []，只在挂载时(此时 list 往往还空)跑一次 → addressInfo 一直为空，
  // 导致登录用户下单不带收货地址(订单行 first_name/address1 为空、订单详情无用户信息)。
  React.useEffect(() => {
    if (!list || list.length === 0) return;
    if (addressInfo && list.some((item) => item.id === addressInfo.id)) return;
    setAddressInfo(list[0]);
  }, [list, addressInfo, setAddressInfo]);

  const activeId = addressInfo?.id;
  return (
    <div className={`${styles.container}`}>
      {list?.length > 0 ? (
        <div className={styles.list}>
          {list.map((item, index) => {
            return (
              <div
                onClick={() => {
                  setAddressInfo(item);
                }}
                key={index}
                className={`${styles.item} ${
                  activeId === item.id ? styles.active : ""
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
