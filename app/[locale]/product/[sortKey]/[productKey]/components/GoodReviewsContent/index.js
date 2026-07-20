"use client";

import React from "react";
import Link from "next/link";
import ProductContext from "../../ProductContext";
import Api from "../../api";
import styles from "./index.module.scss";

import DropSelect from "@/components/DropSelect";
import { StarRating, ReviewList, Pagination } from "@/components/Review";
import { StarActiveIcon } from "@/components/Icon";
import readClientArea from "@/utils/readClientArea";
import { defaultLocale } from "@/config/languageSettings";

const PAGE_SIZE = 10;
// 一次性把某商品的真实评论全量拉回（分页 API），供聚合摘要 + 客户端合并分页用。
// 后端 getProductReviews 只返回 { list, total }，无跨页平均分/星级分布，
// 故这里循环把所有页拉全，前端自行算平均分与 5~1 星分布。真实评论量级小，代价可控。
const FETCH_SIZE = 50;
const MAX_PAGES = 20;

// 营销好评（content_reviews：{name,score,comment,image,video,type}）→ 与真实评论同款卡片结构。
// score→rating、comment→content、image/video→media、name 落 email 字段（ReviewCard 以 email 作展示名）。
function marketingToCard(item, idx) {
  const media = [];
  if (item?.type === "video" && item?.video) {
    media.push({ url: item.video, type: "video", name: item?.name || "" });
  } else if (item?.image) {
    media.push({ url: item.image, type: "image", name: item?.name || "" });
  }
  return {
    id: `mkt-${idx}`,
    rating: Number(item?.score) || 0,
    content: item?.comment || "",
    media,
    seller_reply: "",
    email: item?.name || "",
    created_time: null,
    _source: "marketing",
  };
}

// 循环拉全某商品的真实评论（published）。
async function fetchAllRealReviews(productKey) {
  let acc = [];
  let total = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await Api.getProductReviews({
      productKey,
      sortOrder: "latest",
      current: page,
      pageSize: FETCH_SIZE,
    });
    if (res?.code !== 0) throw new Error("load reviews failed");
    const data = res.data || {};
    const list = Array.isArray(data.list) ? data.list : [];
    total = Number(data.total) || 0;
    acc = acc.concat(list);
    if (acc.length >= total || list.length < FETCH_SIZE) break;
  }
  return { list: acc, total };
}

// 商品详情页评论模块。
// 两套数据合并展示：真实用户评论（运行时 Api.getProductReviews / goods_review）
// + 营销好评（SSR productInfo.reviewsList / content_reviews），聚合出顶部摘要
// （大号平均分 + 星条 + 条数 + 5~1 星分布），下方按「真实评论在前、营销在后」排列成卡片列表。
// 判空：两套都为空 → 整块 return null（并通过 ProductContext.setReviewsVisible 通知导航隐藏该 tab）。
// 懒加载：真实评论不参与首屏，section 滚入视口后才客户端拉取。
export default function GoodReviewsContent() {
  const { LANG, locale, productKey, productInfo, setReviewsVisible } =
    React.useContext(ProductContext);

  const sectionRef = React.useRef(null);
  const area = React.useMemo(() => readClientArea(), []);

  const [inViewed, setInViewed] = React.useState(false);
  const [realCards, setRealCards] = React.useState([]);
  const [fetched, setFetched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [reloadFlag, setReloadFlag] = React.useState(0);

  const [starFilter, setStarFilter] = React.useState("all");
  const [current, setCurrent] = React.useState(1);

  const localeHref = React.useCallback(
    (path) => (locale && locale !== defaultLocale ? `/${locale}${path}` : path),
    [locale]
  );

  // 营销好评（SSR）：模块是否渲染的初始信号，也是无真实评论时唯一的内容来源。
  const marketingCards = React.useMemo(() => {
    const list = Array.isArray(productInfo?.reviewsList)
      ? productInfo.reviewsList
      : [];
    return list.map((item, i) => marketingToCard(item, i));
  }, [productInfo]);
  const hasMarketing = marketingCards.length > 0;

  // 合并集：真实评论在前（后端按 latest 已倒序），营销好评置于其后。
  const allCards = React.useMemo(
    () => [...realCards, ...marketingCards],
    [realCards, marketingCards]
  );

  // 聚合摘要：总条数 = 真实评论数 + 营销好评数；平均分 = 全部单条评分的均值（即两套加权平均）。
  const summary = React.useMemo(() => {
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    allCards.forEach((c) => {
      const r = Math.round(Number(c.rating) || 0);
      if (map[r] != null) map[r] += 1;
      sum += Number(c.rating) || 0;
    });
    const total = allCards.length;
    return {
      total,
      map,
      average: total ? (sum / total).toFixed(1) : "0.0",
      rate: total ? sum / total / 5 : 0,
    };
  }, [allCards]);

  // 当前星级过滤后的列表 + 分页切片。
  const filteredCards = React.useMemo(() => {
    if (starFilter === "all") return allCards;
    const star = Number(starFilter);
    return allCards.filter((c) => Math.round(Number(c.rating) || 0) === star);
  }, [allCards, starFilter]);

  const pagedCards = React.useMemo(
    () => filteredCards.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [filteredCards, current]
  );

  const starOptions = React.useMemo(
    () => [
      { label: LANG["store.product.all"] || "All", value: "all" },
      { label: LANG["store.product.stars"]?.replace("${num}", 5), value: "5" },
      { label: LANG["store.product.stars"]?.replace("${num}", 4), value: "4" },
      { label: LANG["store.product.stars"]?.replace("${num}", 3), value: "3" },
      { label: LANG["store.product.stars"]?.replace("${num}", 2), value: "2" },
      { label: LANG["store.product.stars"]?.replace("${num}", 1), value: "1" },
    ],
    [LANG]
  );

  // 内容判定：营销好评存在，或真实评论拉回后 > 0，即有内容可展示。
  const hasContent = hasMarketing || realCards.length > 0;
  // 两套最终都空（真实评论已拉回且为 0，且无营销）→ 整块不渲染。
  const determinedEmpty =
    fetched && !error && !hasMarketing && realCards.length === 0;
  // 真实评论拉取失败且无营销兜底：给一个重试口，避免静默丢失。
  const errorRealOnly =
    fetched && error && !hasMarketing && realCards.length === 0;

  // 向导航同步「评论 tab 是否可见」：有内容→显示；确定为空→隐藏。
  React.useEffect(() => {
    if (typeof setReviewsVisible !== "function") return;
    if (determinedEmpty) setReviewsVisible(false);
    else if (hasContent || errorRealOnly) setReviewsVisible(true);
  }, [determinedEmpty, hasContent, errorRealOnly, setReviewsVisible]);

  // 过滤后翻页越界回收（数据到位后 filteredCards 变化时）。
  React.useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
    if (current > totalPages) setCurrent(totalPages);
  }, [filteredCards.length, current]);

  // 懒加载触发：滚入视口（提前 200px）后置 inViewed，只触发一次。
  React.useEffect(() => {
    if (inViewed) return;
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInViewed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInViewed(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inViewed]);

  // 真实评论全量拉取：inViewed 后一次拉全，重试时重拉。
  React.useEffect(() => {
    if (!inViewed || !productKey) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchAllRealReviews(productKey)
      .then(({ list }) => {
        if (cancelled) return;
        setRealCards(list.map((r) => ({ ...r, _source: "real" })));
      })
      .catch(() => {
        if (cancelled) return;
        setRealCards([]);
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setFetched(true);
      });
    return () => {
      cancelled = true;
    };
  }, [inViewed, productKey, reloadFlag]);

  const handleStarChange = React.useCallback((value) => {
    setStarFilter(value);
    setCurrent(1);
  }, []);

  const handlePageChange = React.useCallback((page) => {
    setCurrent(page);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // 两套最终都空 → 整块不渲染（hooks 已全部执行，安全早返回）。
  if (determinedEmpty) return null;

  return (
    <section
      ref={sectionRef}
      className={styles.reviews}
      id="product_reviews"
      data-role="product-reviews"
    >
      <div className={styles.reviews_container}>
        {hasContent ? (
          <>
            {/* 顶部摘要：大号平均分 + 星条 + 条数 + 5~1 星分布 */}
            <div className={styles.review_top}>
              <div className={styles.reviews_total}>
                <div className={styles.reviews_score}>{summary.average}</div>
                <StarRating
                  value={Number(summary.average)}
                  size={24}
                  className={styles.summary_stars}
                />
                <div className={styles.reviews_text}>
                  {LANG["store.product.reviews"]?.replace(
                    "${num}",
                    summary.total
                  )}
                </div>
              </div>
              <div className={styles.reviews_detail}>
                <div className={styles.reviews_detail_list}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = summary.map[star] || 0;
                    const pct = summary.total
                      ? (count / summary.total) * 100
                      : 0;
                    return (
                      <div
                        key={star}
                        className={styles.reviews_detail_list_item}
                        data-active={starFilter === String(star)}
                        onClick={() => handleStarChange(String(star))}
                      >
                        <StarActiveIcon />
                        <span className={styles.star_label}>
                          {LANG["store.product.stars"]?.replace("${num}", star)}
                        </span>
                        <div className={styles.line_container}>
                          <div className={styles.un_active_line} />
                          <div
                            className={styles.active_line}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={styles.star_count}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 底部：条数 + 星级过滤 + 写评论 + 卡片列表 + 分页 */}
            <div className={styles.review_bottom}>
              <div className={styles.reviews_header}>
                <div className={styles.reviews_header_num}>
                  {LANG["store.product.reviews"]?.replace(
                    "${num}",
                    filteredCards.length
                  )}
                </div>
                <div className={styles.reviews_header_actions}>
                  <div className={styles.reviews_header_select}>
                    <span className={styles.select_tip}>
                      {LANG["store.product.filter"] || "Filter by:"}
                    </span>
                    <DropSelect
                      zIndex={9}
                      position="bottom"
                      tanslatefromX={16}
                      selectValue={handleStarChange}
                      options={starOptions}
                    >
                      <div className={styles.select_label}>
                        {starOptions.find((o) => o.value === starFilter)?.label}
                      </div>
                    </DropSelect>
                  </div>
                  <Link
                    href={localeHref("/user/account/order")}
                    prefetch={false}
                    className={styles.write_btn}
                  >
                    {LANG["store.product.write_review"] || "Write a Review"}
                  </Link>
                </div>
              </div>

              <ReviewList
                list={pagedCards}
                LANG={LANG}
                locale={locale}
                area={area}
                loading={loading && realCards.length === 0 && !hasMarketing}
              />
              <Pagination
                current={current}
                total={filteredCards.length}
                pageSize={PAGE_SIZE}
                onChange={handlePageChange}
              />
            </div>
          </>
        ) : errorRealOnly ? (
          <div className={styles.state} data-role="product-reviews-error">
            <p className={styles.error_text}>
              {LANG["common.other.load_failed"] || "Failed to load reviews."}
            </p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => setReloadFlag((f) => f + 1)}
            >
              {LANG["common.other.retry"] || "Retry"}
            </button>
          </div>
        ) : (
          // 无营销兜底且真实评论未拉回（未知/加载中）：零高度哨兵，仅用于触发懒加载观察，
          // 不渲染重摘要，避免「先空后隐」闪烁。
          <div className={styles.sentinel} />
        )}
      </div>
    </section>
  );
}
