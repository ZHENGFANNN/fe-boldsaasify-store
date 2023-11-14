import styles from "./index.module.scss";

export default function Advantage({ CONFIG, LANG }) {
  return (
    <div className={styles.tip_container} data-role="store-advantage">
      <div className={styles.tip_item}>
        <div className={styles.tip_item_img}>
          <img
            alt="store-car"
            src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/store-car.svg`}
          />
        </div>
        <div className={styles.tip_item_text}>
          {LANG["store.common.advantage.express_text"]}
        </div>
      </div>
      <div className={styles.tip_item}>
        <div className={styles.tip_item_img}>
          <img
            alt="store-credit"
            src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/store-credit.svg`}
          />
        </div>
        <div className={styles.tip_item_text}>
          {LANG["store.common.advantage.pay_way"]}
        </div>
      </div>
      <div className={styles.tip_item}>
        <div className={styles.tip_item_img}>
          <img
            alt="store-contact"
            src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/store-contact.svg`}
          />
        </div>
        <div className={styles.tip_item_text}>
          <a rel="noreferrer" href={`/company/contact`}>
            {LANG["store.common.advantage.contact"]}
          </a>
        </div>
      </div>
    </div>
  );
}
