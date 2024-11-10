import styles from "./index.module.scss";

export default function FormSwitch({ checked, onChange }) {
  return (
    <div className={styles.form_switch} onClick={() => onChange()}>
      <div className={styles.switch_container} data-checked={checked}>
        <div className={styles.dot}></div>
      </div>
    </div>
  );
}
