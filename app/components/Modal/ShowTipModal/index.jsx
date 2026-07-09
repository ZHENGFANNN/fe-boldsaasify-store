import React from "react";
import ReactDOM from "react-dom";
import styles from "./index.module.scss";

const TIP_ICONS = {
  success: (
    <svg
      className={styles.icon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="10" fill="#111111" />
      <path
        d="M6 10.2L8.6 12.8L14.2 7.2"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg
      className={styles.icon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="10" fill="#f13649" />
      <path
        d="M7.2 7.2L12.8 12.8M12.8 7.2L7.2 12.8"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  info: (
    <svg
      className={styles.icon}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="10" fill="#76767f" />
      <circle cx="10" cy="6.4" r="0.9" fill="#fff" />
      <path
        d="M10 9V14"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function ShowTipModal(_, ref) {
  const t1 = React.useRef(null);
  const [show, setShow] = React.useState(false);
  const [text, setText] = React.useState();
  const [type, setType] = React.useState();
  const [firstReader, setFirstReader] = React.useState(true);

  React.useImperativeHandle(ref, () => {
    return {
      show: ({ text, type }) => {
        setFirstReader(false);
        setTimeout(() => {
          setText(text);
          setType(type);
          if (show) return;
          if (t1.current) clearTimeout(t1);
          setShow(true);
          t1.current = setTimeout(() => {
            setShow(false);
          }, 3000);
        }, 0);
      },
    };
  });
  React.useEffect(() => {
    return () => {
      clearTimeout(t1.current);
    };
  }, []);

  if (firstReader) return null;

  return ReactDOM.createPortal(
    <div className={`${styles.contaner} ${show ? styles.show : ""}`}>
      <div className={styles.inner_container}>
        <div className={styles.content}>
          {TIP_ICONS[type] ?? null}
          <div className={styles.text}>{text}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default React.forwardRef(ShowTipModal);
