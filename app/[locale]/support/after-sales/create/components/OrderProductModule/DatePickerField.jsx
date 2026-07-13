"use client";

import React from "react";
import { DayPicker } from "react-day-picker";
import { ja, zhCN, enUS } from "react-day-picker/locale";
import "react-day-picker/style.css";
import styles from "./DatePickerField.module.scss";

const LOCALE_MAP = { ja, zh: zhCN, "zh-CN": zhCN };

function toYMD(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromYMD(s) {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDisplay(d, lang) {
  if (!d) return "";
  const locale = LOCALE_MAP[lang] || enUS;
  try {
    return new Intl.DateTimeFormat(locale.code || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return toYMD(d);
  }
}

export default function DatePickerField({
  value,
  onChange,
  max,
  placeholder = "",
  lang = "en",
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  const selected = React.useMemo(() => fromYMD(value), [value]);
  const maxDate = React.useMemo(() => fromYMD(max) || new Date(), [max]);
  const disabledMatcher = React.useMemo(
    () => ({ after: maxDate }),
    [maxDate]
  );

  React.useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSelect = (d) => {
    if (!d) {
      onChange?.("");
    } else {
      onChange?.(toYMD(d));
    }
    setOpen(false);
  };

  const display = selected ? formatDisplay(selected, lang) : "";

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.trigger_open : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={display ? styles.value : styles.placeholder}>
          {display || placeholder}
        </span>
        <svg
          className={styles.icon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className={styles.popover} role="dialog">
          <DayPicker
            animate
            mode="single"
            locale={LOCALE_MAP[lang] || enUS}
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected || maxDate}
            disabled={disabledMatcher}
            showOutsideDays
            classNames={{
              root: styles.rdp_root,
              months: styles.rdp_months,
              month: styles.rdp_month,
              month_caption: styles.rdp_caption,
              caption_label: styles.rdp_caption_label,
              nav: styles.rdp_nav,
              button_previous: styles.rdp_nav_btn,
              button_next: styles.rdp_nav_btn,
              chevron: styles.rdp_chevron,
              month_grid: styles.rdp_grid,
              weekdays: styles.rdp_weekdays,
              weekday: styles.rdp_weekday,
              week: styles.rdp_week,
              day: styles.rdp_day,
              day_button: styles.rdp_day_button,
              today: styles.rdp_today,
              selected: styles.rdp_selected,
              outside: styles.rdp_outside,
              disabled: styles.rdp_disabled,
              hidden: styles.rdp_hidden,
            }}
          />
        </div>
      )}
    </div>
  );
}
