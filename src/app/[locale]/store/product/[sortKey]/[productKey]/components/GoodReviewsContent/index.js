"use client";

import VideoModal from "@/components/Modal/VideoModal";
import styles from "./index.module.scss";
import ImageModal from "@/components/Modal/ImageModal";
import { lazyLoadImages } from "@/utils/optimization";
import ProductContext from "../../productContext";
import React from "react";
import DropSelect from "@/components/DropSelect";

const icon = (
  <svg
    t="1704599843888"
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    p-id="4103"
  >
    <path
      d="M355.311867 284.743136c-7.850805 14.637372-19.662829 24.142863-32.103162 25.439392l-184.815239 26.808576c-71.235414 11.852956-99.348706 100.665701-48.545646 153.520489l132.893706 133.797285c10.69662 11.132548 15.771195 26.13831 13.153578 39.73498l-32.175817 189.679014c-11.405771 74.114998 62.659085 130.251529 125.444037 94.620008l164.348092-88.808652c13.325493-7.68503 26.862811-7.68503 39.656185-0.303922l165.261904 89.332585c62.405305 35.411511 136.467091-20.72502 125.124765-94.490048l-32.148188-189.539844c-1.36509-14.81952 3.432169-30.203906 13.317307-40.483017l132.392286-133.285632c51.05377-53.109592 22.940478-141.921313-47.869241-153.706731l-184.41308-26.770713c-14.672164-3.094478-27.389814-12.599969-32.615838-24.836665l-81.610716-174.309978c-31.227212-67.913762-122.773208-67.913762-154.068981 0.144286L355.311867 284.743136 355.311867 284.743136zM355.311867 284.743136"
      p-id="4104"
    ></path>
  </svg>
);

function ReviewRate() {
  const icons = [icon, icon, icon, icon, icon];
  return (
    <div className={styles.stars_container}>
      <div className={styles.no_active_stars}>
        {icons.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 130 * 0.8,
        }}
      >
        {icons.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
}

export default function GoodReviewsContent({ LANG }) {
  const { lazyLoading } = React.useContext(ProductContext);

  const [value, setValue] = React.useState("all");

  const reviewsList = React.useMemo(() => {
    return [
      { label: LANG["store.product.all"], value: "all" },
      { label: LANG["store.product.stars"]?.replace("${num}", 5), value: "5" },
      { label: LANG["store.product.stars"]?.replace("${num}", 4), value: "4" },
      { label: LANG["store.product.stars"]?.replace("${num}", 3), value: "3" },
      { label: LANG["store.product.stars"]?.replace("${num}", 2), value: "2" },
      { label: LANG["store.product.stars"]?.replace("${num}", 1), value: "1" },
    ];
  }, [LANG]);

  React.useEffect(() => {
    if (!lazyLoading) {
      const cleanLazy = lazyLoadImages($(`.${styles.reviews}`));
      return () => cleanLazy();
    }
  }, [lazyLoading]);

  return (
    <section className={styles.reviews} id="productReviews">
      <div className={styles.reviews_container}>
        <div className={styles.review_top}>
          <div className={styles.reviews_total}>
            <div className={styles.reviews_score}>4.7</div>
            <ReviewRate />
            <div className={styles.reviews_text}>
              {LANG["store.product.reviews"]?.replace("${num}", 100)}
            </div>
          </div>
          <div className={styles.reviews_detail}>
            <div className={styles.reviews_detail_list}>
              <div className={styles.reviews_detail_list_item}>
                {icon}
                <span>{LANG["store.product.stars"]?.replace("${num}", 5)}</span>
                <div className={styles.line_container}>
                  <div className={styles.un_active_line}></div>
                  <div className={styles.active_line}></div>
                </div>
                <span>7799</span>
              </div>
              <div className={styles.reviews_detail_list_item}>
                {icon}
                <span>{LANG["store.product.stars"]?.replace("${num}", 4)}</span>
                <div className={styles.line_container}>
                  <div className={styles.un_active_line}></div>
                  <div className={styles.active_line}></div>
                </div>
                <span>7799</span>
              </div>
              <div className={styles.reviews_detail_list_item}>
                {icon}
                <span>{LANG["store.product.stars"]?.replace("${num}", 3)}</span>
                <div className={styles.line_container}>
                  <div className={styles.un_active_line}></div>
                  <div className={styles.active_line}></div>
                </div>
                <span>7799</span>
              </div>
              <div className={styles.reviews_detail_list_item}>
                {icon}
                <span>{LANG["store.product.stars"]?.replace("${num}", 2)}</span>
                <div className={styles.line_container}>
                  <div className={styles.un_active_line}></div>
                  <div className={styles.active_line}></div>
                </div>
                <span>7799</span>
              </div>
              <div className={styles.reviews_detail_list_item}>
                {icon}
                <span>{LANG["store.product.stars"]?.replace("${num}", 1)}</span>
                <div className={styles.line_container}>
                  <div className={styles.un_active_line}></div>
                  <div className={styles.active_line}></div>
                </div>
                <span>7799</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.review_bottom}>
          <div className={styles.reviews_header}>
            <div className={styles.reviews_header_num}>
              {LANG["store.product.reviews"]?.replace("${num}", 100)}
            </div>
            <div className={styles.reviews_header_select}>
              <div className={styles.review_header_select_item}>
                <div className={styles.review_header_select_item_tip}>
                  Filter by:
                </div>
                <DropSelect
                  position="bottom"
                  tanslatefromX={16}
                  selectValue={(value) => setValue(value)}
                  options={reviewsList}
                >
                  <div className={styles.review_header_select_item_label}>
                    {reviewsList.find((item) => item.value === value)?.label}
                  </div>
                </DropSelect>
              </div>
            </div>
          </div>
          <div className={styles.reviews_list}>
            <div className={styles.reviews_list_item}>
              <div className={styles.reviews_user_info}>
                <div className={styles.reviews_user_name}>名***字</div>
                <div className={styles.review_rate_container}>
                  <ReviewRate />
                </div>
              </div>
              <div className={styles.reviews_content}>
                <div className={styles.reviews_content_description}>
                  Perfect shots, high quality videos. I love it
                </div>
                <div className={styles.reviews_content_media}>
                  <ImageModal src="https://res.insta360.com/dynamic/store/a066547de9b562997ca88e7ff6ba96df/3143_90c41196-fd2a-4bde-90da-466a9b959c26.jpg" />
                </div>
              </div>
            </div>

            <div className={styles.reviews_list_item}>
              <div className={styles.reviews_user_info}>
                <div className={styles.reviews_user_name}>名***字</div>
                <div className={styles.review_rate_container}>
                  <ReviewRate />
                </div>
              </div>
              <div className={styles.reviews_content}>
                <div className={styles.reviews_content_description}>
                  Perfect shots, high quality videos. I love it
                </div>
                <div className={styles.reviews_content_media}>
                  <VideoModal
                    poster="https://res.insta360.com/dynamic/store/a59231b0be2d4f125ebdaabddaad8cc0/3143_cf58c026-ee15-4732-bb6e-2de2eddc9a0f.jpg"
                    src="https://media.insta360.com/dynamic/store/1c7d2d8f5d01426097b71dce69ee1eab/3143_7b06669e-a743-40e8-af11-197b118b3c75.mp4"
                  />
                </div>
              </div>
            </div>
            <div className={styles.reviews_list_item}>
              <div className={styles.reviews_user_info}>
                <div className={styles.reviews_user_name}>名***字</div>
                <div className={styles.review_rate_container}>
                  <ReviewRate />
                </div>
              </div>
              <div className={styles.reviews_content}>
                <div className={styles.reviews_content_description}>
                  Perfect shots, high quality videos. I love it
                </div>
              </div>
            </div>
            <div className={styles.reviews_list_item}>
              <div className={styles.reviews_user_info}>
                <div className={styles.reviews_user_name}>名***字</div>
                <div className={styles.review_rate_container}>
                  <ReviewRate />
                </div>
              </div>
              <div className={styles.reviews_content}>
                <div className={styles.reviews_content_description}>
                  Perfect shots, high quality videos. I love it
                </div>
              </div>
            </div>
            <div className={styles.reviews_list_item}>
              <div className={styles.reviews_user_info}>
                <div className={styles.reviews_user_name}>名***字</div>
                <div className={styles.review_rate_container}>
                  <ReviewRate />
                </div>
              </div>
              <div className={styles.reviews_content}>
                <div className={styles.reviews_content_description}>
                  Perfect shots, high quality videos. I love it
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
