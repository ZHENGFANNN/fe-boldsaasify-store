"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./index.module.scss";

/**
 * 表单下拉选择器（自定义面板，替代原生 select）。
 * API 对齐 FormInput / FormTextarea，配合 react-hook-form register 使用。
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.error
 * @param {boolean} props.focus - 手动标记已有值（浮标 label 上浮）
 * @param {string} props.tip
 * @param {boolean} props.required
 * @param {string} props.placeholder - 未选中时触发器内展示的占位文案
 * @param {{ value: string|number, label: string, disabled?: boolean }[]} props.options
 * @param {Object} props.inputProps - register(...) 返回值
 */
export default function FormSelect({
  label = "",
  error = "",
  focus = false,
  tip = "",
  required = true,
  placeholder = "",
  options = [],
  inputProps = {},
}) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [value, setValue] = useState(inputProps.defaultValue ?? "");

  const { onChange, onBlur, name, ref } = inputProps;

  const hasValue = value !== "" && value !== undefined && value !== null;
  const labelFloated = isFocus || hasValue || focus || isOpen;
  const selectedOption = options.find(
    (item) => String(item.value) === String(value)
  );
  const displayText = hasValue
    ? selectedOption?.label || ""
    : labelFloated
      ? placeholder
      : "";
  const showPlaceholder = !hasValue && labelFloated && !!placeholder;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsFocus(false);
        onBlur?.({ target: { name, value } });
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsFocus(false);
        onBlur?.({ target: { name, value } });
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, name, onBlur, value]);

  const handleToggle = () => {
    if (inputProps.disabled) return;
    setIsOpen((prev) => !prev);
    setIsFocus(true);
  };

  const handleSelect = (option) => {
    if (option.disabled) return;

    const nextValue = option.value;
    setValue(nextValue);
    onChange?.({ target: { name, value: nextValue } });
    setIsOpen(false);
    setIsFocus(false);
    onBlur?.({ target: { name, value: nextValue } });
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.input_container}>
        <input
          type="hidden"
          ref={ref}
          name={name}
          value={value ?? ""}
          readOnly
        />
        <button
          type="button"
          className={`${styles.trigger} ${
            error && !focus ? styles.input_error : ""
          } ${isOpen ? styles.trigger_open : ""}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={inputProps.disabled}
          onClick={handleToggle}
        >
          <span
            className={`${styles.trigger_text} ${
              showPlaceholder ? styles.placeholder : ""
            }`}
          >
            {displayText}
          </span>
          <span className={styles.chevron} aria-hidden="true" />
        </button>
        <div
          className={`${styles.input_label} ${
            !!error && !focus && !isFocus ? styles.text_error : ""
          } ${!labelFloated ? styles.input_empyt : ""}`}
        >
          {focus ? label : error || label}
        </div>
        {required ? <div className={styles.input_symbol}>*</div> : null}

        {isOpen ? (
          <ul className={styles.list} role="listbox">
            {options.map((item) => {
              const active = String(item.value) === String(value);
              return (
                <li
                  key={`${item.value}-${item.label}`}
                  role="option"
                  aria-selected={active}
                  aria-disabled={item.disabled || undefined}
                  className={`${styles.option} ${
                    active ? styles.option_active : ""
                  } ${item.disabled ? styles.option_disabled : ""}`}
                  onClick={() => handleSelect(item)}
                >
                  {item.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {tip ? <div className={styles.input_tip}>{tip}</div> : null}
    </div>
  );
}
