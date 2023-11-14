"use client";

import { useState, useEffect, useRef, useContext } from "react";
import styles from "./index.module.scss";

export default function DropSelect({
  children,
  options,
  selectValue,
  defaultValue,
  tanslatefromX = 0,
  position = "top",
}) {
  const [label, setLabel] = useState();
  const listRef = useRef(null);
  const itemsRef = useRef(null);
  const [positionX, setPositionX] = useState("left");

  useEffect(() => {
    // 处理初始化值
    if (defaultValue) {
      options.forEach((item) => {
        if (item.value === defaultValue) {
          setLabel(item.label);
        }
      });
    } else {
      setLabel(options[0].label);
    }

    if (tanslatefromX) {
      itemsRef.current.style.transform = `translateX(${tanslatefromX}px`;
    }
  }, [defaultValue, options, tanslatefromX]);

  useEffect(() => {
    const onResize = () => {
      // 处理位置
      let width = document.body.offsetWidth;
      let left = listRef.current?.offsetLeft ?? 0;
      let right = width - left;

      if (right > left) {
        setPositionX("right");
      } else {
        setPositionX("let");
      }
    };

    setTimeout(() => {
      onResize();
    }, 100);
    window.addEventListener("resize", () => {
      onResize();
    });
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={listRef} className={styles.container}>
      <div
        onMouseOver={() => {
          itemsRef.current.style.display = "block";
        }}
        onMouseLeave={() => {
          itemsRef.current.style.display = "none";
        }}
        className={styles.show_content}
      >
        {children}
        {defaultValue ? <span>{label}</span> : null}
      </div>
      <ul
        onMouseOver={() => {
          itemsRef.current.style.display = "block";
        }}
        onMouseLeave={() => {
          itemsRef.current.style.display = "none";
        }}
        ref={itemsRef}
        className={
          styles.list_container +
          " " +
          `${position === "bottom" ? styles.bottom : styles.top}` +
          " " +
          `${positionX === "right" ? styles.right : styles.left}`
        }
      >
        {options.map((item) => {
          return (
            <li
              key={item.value}
              onClick={() => {
                itemsRef.current.style.display = "none";
                selectValue(item.value);
                setLabel(item.label);
              }}
            >
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
