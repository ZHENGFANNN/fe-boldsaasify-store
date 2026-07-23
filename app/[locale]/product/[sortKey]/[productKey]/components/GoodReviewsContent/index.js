"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ProductContext from "../../ProductContext";
import Api from "../../api";
import styles from "./index.module.scss";

import DropSelect from "@/components/DropSelect";
import { StarRating, ReviewList, Pagination } from "@/components/Review";
import { StarActiveIcon } from "@/components/Icon";
import ReviewModal from "@/[locale]/order/info/component/ReviewModal";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import { useAuthGate } from "@/components/Auth/AuthGateContext";
import readClientArea from "@/utils/readClientArea";
import { defaultLocale } from "@/config/languageSettings";

const PAGE_SIZE = 10;
// 评论已合并到单表 erp_content_reviews（营销 + 真实），前台一次性把全量评论拉回（分页 API），
// 供聚合摘要（平均分 + 星条 + 条数 + 5~1 星分布）+ 客户端分页用。
// 后端 getProductReviews 只返回 { list, total }，无跨页平均分/星级分布，故这里循环拉全，前端自算。
const FETCH_SIZE = 50;
const MAX_PAGES = 40;

// 后端评论项 → 卡片结构。media 已是原生数组 [{url,type,name}]；email 字段承载展示名（写入时已定型/脱敏）。
function reviewToCard(item, idx) {
  let media = [];
  const raw = item?.media;
  let parsed = null;
  if (Array.isArray(raw)) {
    parsed = raw;
  } else if (typeof raw === "string" && raw.trim()) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    media = parsed
      .filter((m) => m && m.url)
      .map((m) => ({
        url: m.url,
        type: m.type === "video" ? "video" : "image",
        name: m.name || item?.email || "",
      }));
  }
  return {
    id: item?.id != null ? `r-${item.id}` : `r-${idx}`,
    rating: Number(item?.rating) || 0,
    content: item?.content || "",
    media,
    seller_reply: item?.seller_reply || "",
    email: item?.email || "",
    created_time: item?.created_time || null,
  };
}

// 判断卡片是否含有效图片/视频（含图评价优先排序用）。
function cardHasMedia(card) {
  return Array.isArray(card?.media) && card.media.some((m) => m && m.url);
}

// 循环拉全某商品的 published 评论（合并后单一数据源）。language 传当前 locale：
// 营销评论按语言命中，真实评论 language='all' 跨语言恒命中。
async function fetchAllReviews(productKey, language) {
  let acc = [];
  let total = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await Api.getProductReviews({
      productKey,
      language,
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

// PLACEHOLDER_COMPONENT
// 商品详情页评论模块（纯客户端渲染，不做 SEO）。
// 单一数据源：懒加载滚入视口后调 Api.getProductReviews 拉全 published 评论（营销 + 真实合并表），
// 聚合出顶部摘要（大号平均分 + 星条 + 条数 + 5~1 星分布），下方按「含图评价优先」排成卡片列表。
// 判空：拉回为 0 条 → 整块 return null（并通过 ProductContext.setReviewsVisible 通知导航隐藏该 tab）。
export default function GoodReviewsContent() {
  const { LANG, locale, productKey, setReviewsVisible } =
    React.useContext(ProductContext);

  const router = useRouter();
  const { authed } = useAuthGate();

  const sectionRef = React.useRef(null);
  const tipRef = React.useRef(null);
  const area = React.useMemo(() => readClientArea(), []);

  // 就地写评价：点击后按 product_key 定位当前用户可评订单列表，命中则原地弹 ReviewModal
  // （多笔可评时弹窗内出订单选择器）。
  const [resolving, setResolving] = React.useState(false);
  const [reviewOrders, setReviewOrders] = React.useState(null);

  const [inViewed, setInViewed] = React.useState(false);
  const [cards, setCards] = React.useState([]);
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

  const tip = React.useCallback((text, type = "info") => {
    tipRef.current?.show({ text, type });
  }, []);

  // 「Write a Review」点击：未登录→带回跳跳登录；已登录→查可评订单，
  // 命中就地弹 ReviewModal，未命中按 reason 提示（未购买/未完成/已评价）。
  const handleWriteClick = React.useCallback(async () => {
    if (resolving) return;
    if (authed !== true) {
      const back = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      router.push(`${localeHref("/user/login")}?redirect=${back}`);
      return;
    }
    setResolving(true);
    try {
      const res = await Api.getReviewableOrder({ product_key: productKey });
      const data = res?.data || {};
      if (res?.code === 0 && data.reviewable && data.orders?.length) {
        setReviewOrders(data.orders);
      } else {
        const reasonKey = {
          already_reviewed: "store.product.review_already",
          not_completed: "store.product.review_not_completed",
          not_purchased: "store.product.review_not_purchased",
        }[data.reason || "not_purchased"];
        const fallback = {
          already_reviewed: "You've already reviewed this item.",
          not_completed:
            "You can write a review once your order is completed.",
          not_purchased: "Only customers who purchased this item can review it.",
        }[data.reason || "not_purchased"];
        tip(LANG[reasonKey] || fallback, "info");
      }
    } catch {
      tip(LANG["common.other.load_failed"] || "Something went wrong.", "error");
    } finally {
      setResolving(false);
    }
  }, [resolving, authed, router, localeHref, productKey, LANG, tip]);

  // 就地评价提交成功：关闭弹窗并重拉评论，让新评价即时出现在列表。
  const handleReviewSuccess = React.useCallback(() => {
    setReviewOrders(null);
    setReloadFlag((f) => f + 1);
  }, []);

  // 「含图评价优先」稳定分区——含图/视频的卡片整体上浮，组内保留原相对次序（最新在前）。
  // 珠宝高客单强视觉，含图真实评价对转化最有说服力。
  const allCards = React.useMemo(() => {
    const withMedia = cards.filter(cardHasMedia);
    const withoutMedia = cards.filter((c) => !cardHasMedia(c));
    return [...withMedia, ...withoutMedia];
  }, [cards]);

  // 聚合摘要：总条数 + 平均分 + 5~1 星分布。
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

  // 内容判定：评论拉回后 > 0 即有内容。
  const hasContent = cards.length > 0;
  // 拉回且为 0 且无错误 → 整块不渲染。
  const determinedEmpty = fetched && !error && cards.length === 0;
  // 拉取失败且无内容：给一个重试口，避免静默丢失。
  const errorEmpty = fetched && error && cards.length === 0;

  // 向导航同步「评论 tab 是否可见」：有内容→显示；确定为空→隐藏。
  React.useEffect(() => {
    if (typeof setReviewsVisible !== "function") return;
    if (determinedEmpty) setReviewsVisible(false);
    else if (hasContent || errorEmpty) setReviewsVisible(true);
  }, [determinedEmpty, hasContent, errorEmpty, setReviewsVisible]);

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

  // 评论全量拉取：inViewed 后一次拉全，重试/提交成功时重拉。language 传当前 locale。
  React.useEffect(() => {
    if (!inViewed || !productKey) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchAllReviews(productKey, locale)
      .then(({ list }) => {
        if (cancelled) return;
        setCards(list.map((r, i) => reviewToCard(r, i)));
      })
      .catch(() => {
        if (cancelled) return;
        setCards([]);
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
  }, [inViewed, productKey, locale, reloadFlag]);

  const handleStarChange = React.useCallback((value) => {
    setStarFilter(value);
    setCurrent(1);
  }, []);

  const handlePageChange = React.useCallback((page) => {
    setCurrent(page);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // 拉回为空 → 整块不渲染（hooks 已全部执行，安全早返回）。
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
                  <button
                    type="button"
                    className={styles.write_btn}
                    disabled={resolving}
                    onClick={handleWriteClick}
                  >
                    {LANG["store.product.write_review"] || "Write a Review"}
                  </button>
                </div>
              </div>

              <ReviewList
                list={pagedCards}
                LANG={LANG}
                locale={locale}
                area={area}
                loading={loading && cards.length === 0}
              />
              <Pagination
                current={current}
                total={filteredCards.length}
                pageSize={PAGE_SIZE}
                onChange={handlePageChange}
              />
            </div>
          </>
        ) : errorEmpty ? (
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
          // 加载中/未拉回：零高度哨兵，仅用于触发懒加载观察，避免「先空后隐」闪烁。
          <div className={styles.sentinel} />
        )}
      </div>

      {/* 就地写评价弹窗（复用账户订单页同款 ReviewModal）+ 分支提示 */}
      <ReviewModal
        open={!!reviewOrders}
        orders={reviewOrders}
        LANG={LANG}
        onClose={() => setReviewOrders(null)}
        onSuccess={handleReviewSuccess}
      />
      <ShowTipModal ref={tipRef} />
    </section>
  );
}
