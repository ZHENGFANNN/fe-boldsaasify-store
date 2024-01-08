"use client";

import VideoModal from "@/components/Modal/VideoModal";
import styles from "./index.module.scss";
import ImageModal from "@/components/Modal/ImageModal";
import { lazyLoadImages } from "@/utils/optimization";
import ProductContext from "../../productContext";
import React from "react";
import DropSelect from "@/components/DropSelect";
import Empyt from "@/components/Empyt";

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

function ReviewRate({ scoreRate = 1 }) {
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
          width: 130 * scoreRate,
        }}
      >
        {icons.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function loadingReviews({ configList, score }) {
  const [averageScore, setAverageScore] = React.useState(0);
  const [scoreRate, setScoreRate] = React.useState(0);
  const [scoreMap, setScoreMap] = React.useState({});
  const [scoreList, setScoreList] = React.useState(configList);
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    // 初始化Map
    const map = {
      5: {
        num: 0,
        list: [],
      },
      4: {
        num: 0,
        list: [],
      },
      3: {
        num: 0,
        list: [],
      },
      2: {
        num: 0,
        list: [],
      },
      1: {
        num: 0,
        list: [],
      },
    };
    const totalScore = configList.reduce((pre, cur) => {
      map[cur.score].num = map[cur.score].num + 1;
      map[cur.score].push = map[cur.score].list.push(cur);
      return pre + cur.score;
    }, 0);

    setScoreMap(map);
    setAverageScore((totalScore / configList.length).toFixed(1));
    setScoreRate(totalScore / configList.length / 5);
  }, [configList]);

  React.useEffect(() => {
    setPage(1);
    if (score === "all") {
      setScoreList(configList);
    } else {
      setScoreList(scoreMap[score].list);
    }
  }, [score]);

  return { scoreRate, averageScore, scoreMap, scoreList, page, setPage };
}

export default function GoodReviewsContent({ LANG, configList }) {
  const [value, setValue] = React.useState("all");
  const { scoreRate, averageScore, scoreMap, scoreList, page, setPage } =
    loadingReviews({
      configList,
      score: value,
    });
  const { lazyLoading } = React.useContext(ProductContext);

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
  }, [lazyLoading, scoreList]);

  if (configList.length < 1) return null;
  return (
    <section className={styles.reviews} id="productReviews">
      <div className={styles.reviews_container}>
        <div className={styles.review_top}>
          <div className={styles.reviews_total}>
            <div className={styles.reviews_score}>{averageScore}</div>
            <ReviewRate scoreRate={scoreRate} />
            <div className={styles.reviews_text}>
              {LANG["store.product.reviews"]?.replace(
                "${num}",
                configList.length
              )}
            </div>
          </div>
          <div className={styles.reviews_detail}>
            <div className={styles.reviews_detail_list}>
              {Object.keys(scoreMap)
                .map((key, index) => {
                  return (
                    <div
                      key={index}
                      onClick={() => setValue(key)}
                      className={styles.reviews_detail_list_item}
                    >
                      {icon}
                      <span>
                        {LANG["store.product.stars"]?.replace("${num}", key)}
                      </span>
                      <div className={styles.line_container}>
                        <div className={styles.un_active_line}></div>
                        <div
                          style={{
                            width: `${
                              (scoreMap[key].list.length / configList.length) *
                              100
                            }%`,
                          }}
                          className={styles.active_line}
                        ></div>
                      </div>
                      <span>{scoreMap[key].list.length}</span>
                    </div>
                  );
                })
                .sort((a, b) => b.key - a.key)}
            </div>
          </div>
        </div>
        <div className={styles.review_bottom}>
          <div className={styles.reviews_header}>
            <div className={styles.reviews_header_num}>
              {LANG["store.product.reviews"]?.replace(
                "${num}",
                scoreMap[value]?.list.length ?? configList.length
              )}
            </div>
            <div className={styles.reviews_header_select}>
              <div className={styles.review_header_select_item}>
                <div className={styles.review_header_select_item_tip}>
                  {LANG["store.product.filter"]}
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
          {scoreList.length > 0 ? (
            <>
              <div className={styles.reviews_list}>
                {scoreList.map((item, index) => {
                  return (
                    <div
                      style={{
                        display: index + 1 <= page * 5 ? "flex" : "none",
                      }}
                      className={styles.reviews_list_item}
                      key={item.id}
                    >
                      <div className={styles.reviews_user_info}>
                        <div className={styles.reviews_user_name}>
                          {item.name}
                        </div>
                        <div className={styles.review_rate_container}>
                          <ReviewRate scoreRate={item.score / 5} />
                        </div>
                      </div>
                      <div className={styles.reviews_content}>
                        <div className={styles.reviews_content_description}>
                          {item.comment}
                        </div>
                        {item.type === "image" ? (
                          <div className={styles.reviews_content_media}>
                            <ImageModal
                              lazyLoading={lazyLoading}
                              src={item.image}
                            />
                          </div>
                        ) : null}
                        {item.type === "video" ? (
                          <div className={styles.reviews_content_media}>
                            <VideoModal
                              lazyLoading={lazyLoading}
                              poster={item.image}
                              src={item.video}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              {page * 5 < scoreList.length ? (
                <div className={styles.load_more_container}>
                  <div
                    className={styles.load_more}
                    onClick={() => {
                      setPage((state) => state + 1);
                    }}
                  >
                    {LANG["store.product.load_more"]}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.empyt}>
              <Empyt LANG={LANG} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
