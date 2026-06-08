"use client";

import React from "react";
import Input from "@/components/Form/FormInput";
import { newSessionToken } from "@/utils/placeAutocomplete";
import styles from "./index.module.scss";

// 地址输入联想：包裹现有 FormInput，输入时防抖调后端 Places 代理拉联想，
// 选中后调 placeDetail 取结构化地址并回填。后端持 key，前端不接触 Google。
//
// props:
//  - label/error/inputProps：透传给内部 FormInput（inputProps 含 react-hook-form 的 register）
//  - apiAutocomplete/apiDetail：各表单自己的 Api 方法（account / order 各一份）
//  - language：locale；regionCode：当前 area 国家码，做联想偏置
//  - onSelect(addr, prediction)：选中且取到详情后回调，由父组件回填字段
export default function AddressAutocomplete({
  label,
  error,
  inputProps = {},
  apiAutocomplete,
  apiDetail,
  language = "en",
  regionCode = "",
  onSelect,
}) {
  const [predictions, setPredictions] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const sessionRef = React.useRef(newSessionToken());
  const timerRef = React.useRef(null);
  const seqRef = React.useRef(0); // 请求序号，丢弃乱序/过期响应
  const boxRef = React.useRef(null);

  const runSearch = (value) => {
    clearTimeout(timerRef.current);
    // 少于 3 字符不发请求（省额度、减噪音）
    if (!value || value.trim().length < 3) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current;
      try {
        const res = await apiAutocomplete({
          input: value,
          language,
          session_token: sessionRef.current,
          region_code: regionCode || "",
        });
        if (seq !== seqRef.current) return; // 已有更新的请求，丢弃本次
        const list =
          res?.code === 0 && Array.isArray(res.data) ? res.data : [];
        setPredictions(list);
        setOpen(list.length > 0);
      } catch (e) {
        if (seq !== seqRef.current) return;
        setPredictions([]);
        setOpen(false);
      }
    }, 300);
  };

  const handleChange = (e) => {
    inputProps.onChange?.(e); // 先让 react-hook-form 更新
    runSearch(e.target.value);
  };

  const handleSelect = async (p) => {
    setOpen(false);
    setPredictions([]);
    seqRef.current++; // 作废仍在途的联想请求
    try {
      const res = await apiDetail({
        place_id: p.place_id,
        language,
        session_token: sessionRef.current,
      });
      if (res?.code === 0 && res.data) {
        onSelect?.(res.data, p);
      }
    } catch (e) {
      // 详情失败静默：保留用户已选文本，不打断填写
    } finally {
      sessionRef.current = newSessionToken(); // 选中即结束本会话，下次输入开新会话
    }
  };

  // 点外部关闭下拉
  React.useEffect(() => {
    const onDoc = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={styles.wrap} ref={boxRef}>
      <Input
        label={label}
        error={error}
        inputProps={{ ...inputProps, onChange: handleChange }}
      />
      {open ? (
        <ul className={styles.dropdown}>
          {predictions.map((p) => (
            <li
              key={p.place_id}
              className={styles.item}
              // onMouseDown + preventDefault：避免 input blur 抢先把下拉关掉
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(p);
              }}
            >
              {p.description}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
