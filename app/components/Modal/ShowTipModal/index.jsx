import styles from "./index.module.scss";
import React from "react";

function ShowTipModal(_, ref) {
  const t1 = React.useRef(null);
  const [show, setShow] = React.useState(false);
  const [text, setText] = React.useState();
  const [type, setType] = React.useState();
  React.useImperativeHandle(ref, () => {
    return {
      show: ({ text, type }) => {
        setText(text);
        setType(type);
        if (show) return;
        if (t1.current) clearTimeout(t1);
        setShow(true);
        t1.current = setTimeout(() => {
          setShow(false);
        }, 3000);
      },
    };
  });
  React.useEffect(() => {
    return () => {
      clearTimeout(t1.current);
    };
  }, []);
  return (
    <div className={`${styles.contaner} ${show ? styles.show : ""}`}>
      <div className={styles.inner_container}>
        <div className={styles.content}>
          {type === "success" ? (
            <img
              alt="avatar"
              width={20}
              height={20}
              src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/message-success.svg`}
            />
          ) : null}
          {type === "error" ? (
            <img
              alt="avatar"
              width={20}
              height={20}
              src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/message-error.svg`}
            />
          ) : null}
          {type === "info" ? (
            <img
              alt="avatar"
              width={20}
              height={20}
              src={`${process.env.NEXT_PUBLIC_FILE}/image/icon/message-info.svg`}
            />
          ) : null}
          <div className={styles.text}>{text}</div>
        </div>
      </div>
    </div>
  );
}

export default React.forwardRef(ShowTipModal);
