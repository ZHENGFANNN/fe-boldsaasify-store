"use client";

import { useState } from "react";
import styles from "./index.module.scss";

export default function Input({
  label = "",
  error = "",
  focus = false, // 手动确认是否聚焦
  type,
  tip = "",
  required = true,
  inputProps = {},
}) {
  const [isFocus, setIsFocus] = useState(false);
  const [value, setValue] = useState();
  return (
    <div className={styles.container}>
      <div className={styles.input_container}>
        <input
          type={type}
          className={`${error && !focus ? styles.input_error : ""}`}
          {...inputProps}
          onChange={(e) => {
            inputProps?.onChange(e);
            setValue(e.target.value);
          }}
          onFocus={() => {
            setIsFocus(true);
          }}
          onBlur={(e) => {
            setIsFocus(false);
            inputProps?.onBlur(e);
          }}
          placeholder=""
          autoComplete="off"
        />
        <div
          className={`${styles.input_label}
                ${!!error && !focus && !isFocus ? styles.text_error : ""}
                ${!isFocus && !value && !focus ? styles.input_empyt : ""}`}
        >
          {focus ? label : error || label}
        </div>
        {required ? <div className={styles.input_symbol}>*</div> : null}
      </div>
      {tip ? <div className={styles.input_tip}>{tip}</div> : null}
    </div>
  );
}
