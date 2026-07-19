"use client";

import React from "react";
import Link from "next/link";
import ProductContext from "../../ProductContext";
import Api from "../../api";
import styles from "./index.module.scss";

import DropSelect from "@/components/DropSelect";
import { ReviewList, Pagination } from "@/components/Review";
import readClientArea from "@/utils/readClientArea";
import { defaultLocale } from "@/config/languageSettings";

const PAGE_SIZE = 10;

// 商品详情页评论模块。
// 懒加载：评论不参与首屏，section 滚动进入视口（IntersectionObserver）后才客户端拉取；
// 分页：pageSize=10，行业标准页码分页；
// 「写评论」按钮跳转「我的账号 → 订单列表」（带 locale 前缀），从订单去评价。
export default function GoodReviewsContent() {
  const { LANG, locale, productKey } = React.useContext(ProductContext);

  const sectionRef = React.useRef(null);
  const area = React.useMemo(() => readClientArea(), []);

  const [inViewed, setInViewed] = React.useState(false);
  const [list, setList] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [current, setCurrent] = React.useState(1);
  const [sortOrder, setSortOrder] = React.useState("latest");
  const [reloadFlag, setReloadFlag] = React.useState(0);

  const localeHref = React.useCallback(
    (path) => (locale && locale !== defaultLocale ? `/${locale}${path}` : path),
    [locale]
  );

  const sortOptions = React.useMemo(
    () => [
      {
        label: LANG["store.product.review_sort_latest"] || "Latest",
        value: "latest",
      },
      {
        label: LANG["store.product.review_sort_highest"] || "Highest rating",
        value: "rating_desc",
      },
      {
        label: LANG["store.product.review_sort_lowest"] || "Lowest rating",
        value: "rating_asc",
      },
    ],
    [LANG]
  );

  // 懒加载触发：滚动进入视口（提前 200px）后置 inViewed，首拉随即发生，且只触发一次。
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

  // 拉取当前页评论：inViewed 后按 (排序, 页码) 拉取；换排序/页码/重试均触发。
  React.useEffect(() => {
    if (!inViewed || !productKey) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    Api.getProductReviews({
      productKey,
      sortKey: sortOrder,
      current,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return;
        if (res?.code !== 0) throw new Error("load reviews failed");
        const data = res.data || {};
        setList(Array.isArray(data.list) ? data.list : []);
        setTotal(Number(data.total) || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setList([]);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inViewed, productKey, sortOrder, current, reloadFlag]);

  const handleSortChange = React.useCallback((value) => {
    setSortOrder(value);
    setCurrent(1);
  }, []);

  const handlePageChange = React.useCallback((page) => {
    setCurrent(page);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const titleText =
    total > 0
      ? LANG["store.product.reviews"]?.replace("${num}", total)
      : LANG["store.product.nav.reviews"] || "Reviews";

  return (
    <section
      ref={sectionRef}
      className={styles.reviews}
      id="product_reviews"
      data-role="product-reviews"
    >
      <div className={styles.reviews_container}>
        <div className={styles.header}>
          <div className={styles.title}>{titleText}</div>
          <div className={styles.actions}>
            <div className={styles.sort}>
              <span className={styles.sort_tip}>
                {LANG["store.product.filter"] || "Sort"}
              </span>
              <DropSelect
                zIndex={9}
                position="bottom"
                tanslatefromX={16}
                selectValue={handleSortChange}
                options={sortOptions}
              >
                <div className={styles.sort_label}>
                  {sortOptions.find((o) => o.value === sortOrder)?.label}
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

        <div className={styles.body}>
          {inViewed ? (
            <>
              <ReviewList
                list={list}
                LANG={LANG}
                locale={locale}
                area={area}
                loading={loading}
                error={error}
                onRetry={() => setReloadFlag((f) => f + 1)}
              />
              {!loading && !error ? (
                <Pagination
                  current={current}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={handlePageChange}
                />
              ) : null}
            </>
          ) : (
            <div className={styles.placeholder} />
          )}
        </div>
      </div>
    </section>
  );
}
