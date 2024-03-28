"use client";

import React from "react";
import ProductContext from "../../ProductContext";
import styles from "./index.module.scss";

import { lazyLoadImages } from "@/utils/optimization";
import VideoModal from "@/components/Modal/VideoModal";
import ImageModal from "@/components/Modal/ImageModal";
import DropSelect from "@/components/DropSelect";
import Empyt from "@/components/Empyt";

const active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_active_icon.svg`;
const no_active_icon = `${process.env.NEXT_PUBLIC_IMAGE}/icon/previews_stars_icon.svg`;

function ReviewRate({ scoreRate = 1 }) {
  return (
    <div className={styles.stars_container}>
      <div className={styles.no_active_stars}>
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
        <img alt="no_active_icon" src={no_active_icon} />
      </div>
      <div
        className={styles.active_stars}
        style={{
          width: 130 * scoreRate,
        }}
      >
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
        <img alt="active_icon" src={active_icon} />
      </div>
    </div>
  );
}

function LoadingReviews({ reviewsList, score }) {
  const [averageScore, setAverageScore] = React.useState(0);
  const [scoreRate, setScoreRate] = React.useState(0);
  const [scoreMap, setScoreMap] = React.useState({});
  const [scoreList, setScoreList] = React.useState(reviewsList);
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
    const totalScore = reviewsList.reduce((pre, cur) => {
      map[cur.score].num = map[cur.score].num + 1;
      map[cur.score].push = map[cur.score].list.push(cur);
      return pre + cur.score;
    }, 0);

    setScoreMap(map);
    setAverageScore((totalScore / reviewsList.length).toFixed(1));
    setScoreRate(totalScore / reviewsList.length / 5);
  }, [reviewsList]);

  React.useEffect(() => {
    setPage(1);
    if (score === "all") {
      setScoreList(reviewsList);
    } else {
      setScoreList(scoreMap[score].list);
    }
  }, [score]);

  return { scoreRate, averageScore, scoreMap, scoreList, page, setPage };
}

export default function GoodReviewsContent() {
  const {
    LANG,
    productInfo: { reviewsList },
  } = React.useContext(ProductContext);

  const [value, setValue] = React.useState("all");
  const { scoreRate, averageScore, scoreMap, scoreList, page, setPage } =
    LoadingReviews({
      reviewsList,
      score: value,
    });
  const { lazyLoading } = React.useContext(ProductContext);

  const starsList = React.useMemo(() => {
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

  if (reviewsList.length < 1) return null;
  return (
    <section className={styles.reviews} id="product_reviews">
      <div className={styles.reviews_container}>
        <div className={styles.review_top}>
          <div className={styles.reviews_total}>
            <div className={styles.reviews_score}>{averageScore}</div>
            <ReviewRate scoreRate={scoreRate} />
            <div className={styles.reviews_text}>
              {LANG["store.product.reviews"]?.replace(
                "${num}",
                reviewsList.length
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
                      <img alt="active_icon" src={active_icon} />
                      <span>
                        {LANG["store.product.stars"]?.replace("${num}", key)}
                      </span>
                      <div className={styles.line_container}>
                        <div className={styles.un_active_line}></div>
                        <div
                          style={{
                            width: `${
                              (scoreMap[key].list.length / reviewsList.length) *
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
                scoreMap[value]?.list.length || reviewsList.length
              )}
            </div>
            <div className={styles.reviews_header_select}>
              <div className={styles.review_header_select_item}>
                <div className={styles.review_header_select_item_tip}>
                  {LANG["store.product.filter"]}
                </div>
                <DropSelect
                  zIndex={9}
                  position="bottom"
                  tanslatefromX={16}
                  selectValue={(value) => setValue(value)}
                  options={starsList}
                >
                  <div className={styles.review_header_select_item_label}>
                    {starsList.find((item) => item.value === value)?.label}
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
                      key={index}
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
