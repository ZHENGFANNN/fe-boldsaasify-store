"use client";

import React from "react";
import styles from "./index.module.scss";

// 可搜索下拉：选项 = { value, label, subLabel?, image? }，纯 UI，不感知业务。
//   options            Array   选项集合
//   value              String  当前选中值（对应 option.value）
//   onChange           Fn      选中回调 (nextValue)
//   placeholder        String  未选中时占位文案
//   searchPlaceholder  String  搜索框占位文案
//   emptyText          String  搜索无匹配时的文案
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = options.find((o) => o.value === value) || null;
  const kw = q.trim().toLowerCase();
  const filtered = kw
    ? options.filter((o) =>
        `${o.label} ${o.subLabel || ""}`.toLowerCase().includes(kw)
      )
    : options;

  const renderOptBody = (o) => (
    <>
      <span className={styles.opt_thumb}>
        {o.image ? <img src={o.image} alt="" /> : null}
      </span>
      <span className={styles.opt_text}>
        <span className={styles.opt_label}>{o.label}</span>
        {o.subLabel ? (
          <span className={styles.opt_sub}>{o.subLabel}</span>
        ) : null}
      </span>
    </>
  );

  return (
    <div className={styles.select} ref={rootRef}>
      <button
        type="button"
        className={`${styles.select_trigger} ${
          open ? styles.select_open : ""
        }`}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? (
          <span className={styles.select_selected}>{selected.label}</span>
        ) : (
          <span className={styles.select_ph}>{placeholder}</span>
        )}
        <span className={styles.select_arrow} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div className={styles.select_panel}>
          <input
            className={styles.select_search}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
          />
          <div className={styles.select_list}>
            {filtered.length ? (
              filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  className={`${styles.opt} ${
                    o.value === value ? styles.opt_active : ""
                  }`}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQ("");
                  }}
                >
                  {renderOptBody(o)}
                </button>
              ))
            ) : (
              <div className={styles.select_empty}>{emptyText}</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
