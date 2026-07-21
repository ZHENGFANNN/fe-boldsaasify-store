"use client";

import React from "react";
import styles from "./index.module.scss";
import Empyt from "@/components/Empyt";
import ConfirmModal from "@/components/Modal/ConfirmModal";
import { DeleteIcon } from "@/components/Icon";

// 地址列表卡片：结账页(选中态) / 账户页(点击编辑 + 删除) 共用。
//
// props:
//  - list: 地址数组
//  - LANG: 语言包
//  - activeId?: 当前选中项 id；传入即启用「选中态」高亮
//  - onSelect?: 卡片点击回调(item)，用于结账页切换选中；activeId 场景专用
//  - onEdit?: 卡片点击回调(item)，用于账户页打开编辑；优先级高于 onSelect
//  - onDelete?: 删除回调(item)，返回 Promise 时按 loading 处理；传入即渲染右侧删除按钮
//  - deleteLoading?: 外部控制的删除 loading，避免连点
//  - autoSelectFirst?: list 到达后自动选中第一个(默认 true，Order 场景需要)
export default function AddressBar({
  list,
  LANG,
  activeId,
  onSelect,
  onEdit,
  onDelete,
  deleteLoading,
  autoSelectFirst = true,
}) {
  React.useEffect(() => {
    if (!autoSelectFirst) return;
    if (!onSelect) return;
    if (!list || list.length === 0) return;
    if (activeId != null && list.some((item) => item.id === activeId)) return;
    onSelect(list[0]);
  }, [list, activeId, onSelect, autoSelectFirst]);

  if (!list || list.length === 0) {
    return (
      <div className={styles.container}>
        <Empyt LANG={LANG} />
      </div>
    );
  }

  const handleClick = (item) => {
    if (onEdit) return onEdit(item);
    onSelect?.(item);
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {list.map((item, index) => {
          const active = activeId != null && activeId === item.id;
          return (
            <div
              key={item.id ?? index}
              className={`${styles.item} ${active ? styles.active : ""} ${
                onDelete ? styles.with_delete : ""
              }`}
            >
              <div
                className={styles.content}
                role="button"
                tabIndex={0}
                onClick={() => handleClick(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick(item);
                  }
                }}
              >
                <div className={styles.user}>
                  <span>
                    {item.first_name}
                    {item.last_name}
                  </span>
                  <span>{`(${item.short_phone}) ${item.phone}`}</span>
                </div>
                <div className={styles.address}>
                  <div>{`${item.zip_code} ${
                    item.state ? `${item.state} ` : ""
                  }${item.area_text} ${item.address1}`}</div>
                  <div>{item.address2}</div>
                </div>
              </div>
              {onDelete ? (
                <ConfirmModal
                  LANG={LANG}
                  title={LANG["user_account.shipping_address.tip"]}
                  content={LANG["user_account.shipping_address.delete_tip"]}
                  renderNode={
                    <div className={styles.icon_container}>
                      <DeleteIcon width={24} height={24} />
                    </div>
                  }
                  onOk={() => {
                    if (deleteLoading) return;
                    onDelete(item);
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
