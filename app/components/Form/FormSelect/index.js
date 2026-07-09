"use client";

import React from "react";
import styles from "./index.module.scss";

// 自定义下拉选择器，视觉与 FormInput/FormTextarea 对齐（浮动 label / 必填星号 / 错误态）。
// 内部渲染一个 hidden <input> 承载真实值，供 react-hook-form register 或 FormData 收集；
// 用户点击行为通过原生 setter + input 事件触发外部 onChange，保持与 fillField 一致的机制。
//
// props:
//  - label：浮动 label
//  - options：[{ value, label }]
//  - required：是否显示星号（默认 true）
//  - error：错误文案
//  - searchable：是否可搜索（默认 true，选项多时体验更好）
//  - disabled
//  - placeholder：搜索框占位
//  - defaultValue：初始值
//  - inputProps：react-hook-form register 展开（含 name/onChange/onBlur/ref）
//  - LANG：文案
//  - noResultsText：搜索无结果文案
export default function FormSelect({
  label = "",
  options = [],
  required = true,
  error = "",
  searchable = true,
  disabled = false,
  placeholder = "",
  defaultValue = "",
  inputProps = {},
  noResultsText = "No results",
}) {
  const [open, setOpen] = React.useState(false);
  const [isFocus, setIsFocus] = React.useState(false);
  const [selected, setSelected] = React.useState(defaultValue);
  const [search, setSearch] = React.useState("");
  const [highlight, setHighlight] = React.useState(-1);

  const rootRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const listRef = React.useRef(null);
  const itemRefs = React.useRef([]);

  const selectedOption = React.useMemo(
    () => options.find((o) => String(o.value) === String(selected)),
    [options, selected]
  );

  const filtered = React.useMemo(() => {
    if (!searchable || !search) return options;
    const s = search.toLowerCase();
    return options.filter(
      (o) =>
        String(o.label).toLowerCase().includes(s) ||
        String(o.value).toLowerCase().includes(s)
    );
  }, [options, search, searchable]);

  // 通过 hidden input 的 native setter 触发 react-hook-form onChange。
  const writeValue = React.useCallback((val) => {
    const el = inputRef.current;
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    setter.call(el, val);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  const commitSelect = (opt) => {
    setSelected(opt.value);
    writeValue(opt.value);
    setOpen(false);
    setSearch("");
    setHighlight(-1);
  };

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    setIsFocus(true);
    setHighlight(
      filtered.findIndex((o) => String(o.value) === String(selected))
    );
  };

  const closeDropdown = () => {
    setOpen(false);
    setIsFocus(false);
    setSearch("");
    setHighlight(-1);
    // 通知 react-hook-form 触发 onBlur 校验
    inputProps?.onBlur?.({ target: inputRef.current });
  };

  // 点击外部关闭
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) closeDropdown();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // 打开时聚焦搜索框
  React.useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, searchable]);

  // 高亮项滚动到可见区域
  React.useEffect(() => {
    if (!open || highlight < 0) return;
    itemRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  // defaultValue 变化时同步（异步表单回填场景）
  React.useEffect(() => {
    if (defaultValue !== undefined && defaultValue !== selected) {
      setSelected(defaultValue);
      if (inputRef.current) writeValue(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) commitSelect(opt);
    }
  };

  const hasValue = !!selectedOption;
  const showFloating = open || hasValue;

  return (
    <div className={styles.container}>
      <div
        ref={rootRef}
        className={`${styles.select_container} ${
          disabled ? styles.disabled : ""
        }`}
      >
        <div
          className={`${styles.trigger} ${open ? styles.trigger_open : ""} ${
            error && !isFocus ? styles.trigger_error : ""
          }`}
          onClick={() => (open ? closeDropdown() : openDropdown())}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-disabled={disabled}
        >
          <span className={styles.trigger_text}>
            {selectedOption?.label || ""}
          </span>
          <svg
            className={`${styles.chevron} ${open ? styles.chevron_open : ""}`}
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* react-hook-form / FormData 采集载体 */}
        <input
          type="text"
          className={styles.hidden_input}
          tabIndex={-1}
          aria-hidden
          defaultValue={defaultValue}
          {...inputProps}
          ref={(node) => {
            inputRef.current = node;
            const outer = inputProps?.ref;
            if (typeof outer === "function") outer(node);
            else if (outer && "current" in outer) outer.current = node;
          }}
        />

        <div
          className={`${styles.label}
            ${error && !isFocus ? styles.label_error : ""}
            ${!showFloating ? styles.label_empty : ""}`}
        >
          {error && !isFocus ? error : label}
        </div>
        {required ? <div className={styles.symbol}>*</div> : null}

        {open ? (
          <div className={styles.dropdown} role="listbox">
            {searchable ? (
              <div className={styles.search_wrap}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="m17 17-3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={searchRef}
                  className={styles.search}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setHighlight(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder || label}
                />
              </div>
            ) : null}
            <div className={styles.options} ref={listRef}>
              {filtered.length === 0 ? (
                <div className={styles.empty}>{noResultsText}</div>
              ) : (
                filtered.map((opt, i) => {
                  const isSelected =
                    String(opt.value) === String(selected);
                  const isActive = i === highlight;
                  return (
                    <div
                      key={opt.value}
                      ref={(el) => (itemRefs.current[i] = el)}
                      className={`${styles.option}
                        ${isSelected ? styles.option_selected : ""}
                        ${isActive ? styles.option_active : ""}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlight(i)}
                      onMouseDown={(e) => {
                        // 阻止 blur 抢先关闭
                        e.preventDefault();
                        commitSelect(opt);
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 20 20"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="m5 10 3.5 3.5L15 6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
