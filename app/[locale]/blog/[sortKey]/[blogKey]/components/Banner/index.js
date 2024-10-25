import styles from "./index.module.scss";
export default function Banner({ article }) {
  return (
    <div className={styles.container}>
      <img src={article.image} alt={article.alt} />
    </div>
  );
}
