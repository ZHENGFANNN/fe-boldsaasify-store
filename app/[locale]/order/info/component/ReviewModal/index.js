"use client";

import React from "react";
import styles from "./index.module.scss";
import Api from "../../api";
import Modal from "@/components/Modal";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import MediaUploader from "@/components/MediaUploader";

// 评论上传限制（与售后申请 CreateWizard 对齐）：最多 6 个文件、单文件 ≤ 5MB。
// 与后端 /chat/upload 的 chatUploadMaxSize（5MB）保持一致，超出会被后端 413/“file too large”拒绝。
const MAX_FILES = 6;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// 1-5 星评分输入（可点选，鼠标悬停预览）。纯展示 + 回调，无内部业务。
function StarRating({ value, onChange, disabled }) {
  const [hover, setHover] = React.useState(0);
  const active = hover || value;
  return (
    <div className={styles.stars} role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          className={`${styles.star} ${n <= active ? styles.star_on : ""}`}
          aria-label={`${n}`}
          aria-checked={n === value}
          role="radio"
          onMouseEnter={() => !disabled && setHover(n)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(n)}
        >
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path
              d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.48-.94L12 2.5z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

/**
 * 可复用「写评论」弹窗（账户订单详情 → 评论）。
 *
 * 逻辑内聚：评分 / 内容 / 媒体上传的本地状态、校验与上传编排全在本组件；
 * 复用 portal 到 body 的共享 <Modal>（遮罩天然压过导航）、共享 <MediaUploader>
 * 展示（上传通道走 Api.uploadReviewMedia → /chat/upload，与售后同口径）。
 *
 * 两种驱动方式（互斥）：
 *   - 账户订单详情页：传 product + orderNumber（单一订单，无选择器）；
 *   - 商品详情页就地评价：传 orders 列表（同一商品的多笔可评订单），
 *     长度 >1 时弹窗顶部出订单选择器，提交用选中那笔。
 *
 * props：
 *   - open        是否打开（受控；父级用 reviewTarget / reviewOrders 驱动）
 *   - product     被评商品 { productKey, sortKey, comboKey?, name, comboName?, image? }（单订单模式）
 *   - orderNumber 订单号（单订单模式提交入参 order_number）
 *   - orders      可评订单列表 [{ order_number, order_time, product_key, sort_key, combo_key, combo_name, name, image }]（多订单模式）
 *   - LANG        文案对象（LANG["key"] || fallback）
 *   - onClose     请求关闭（背景/×/取消）
 *   - onSuccess(productKey) 提交成功回调（父级据此标记已评 + 刷新状态）
 */
export default function ReviewModal({
  open,
  product,
  orderNumber,
  orders,
  LANG,
  onClose,
  onSuccess,
}) {
  const modalRef = React.useRef(null);
  const tipRef = React.useRef(null);

  const [rating, setRating] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [mediaList, setMediaList] = React.useState([]);
  const [anonymous, setAnonymous] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  // 关闭动画期间保留数据，避免内容瞬间消失。
  const [activeProduct, setActiveProduct] = React.useState(null);
  const [activeOrders, setActiveOrders] = React.useState(null);
  const [selIdx, setSelIdx] = React.useState(0);

  // 多订单模式下当前选中的可评订单；单订单模式为 null。
  const selectedOrder =
    Array.isArray(activeOrders) && activeOrders.length ? activeOrders[selIdx] : null;
  // 弹窗顶部展示的商品信息：多订单取选中订单行，单订单取 product。
  const displayProduct = selectedOrder
    ? {
        name: selectedOrder.name,
        comboName: selectedOrder.combo_name,
        image: selectedOrder.image,
      }
    : activeProduct;

  const tip = React.useCallback((text, type = "info") => {
    tipRef.current?.show({ text, type });
  }, []);

  const title = LANG["store.order_info.write_review"] || "Write a review";

  // open 切换：打开时重置表单并弹出；关闭时收起（保留 active* 供出场动画）。
  React.useEffect(() => {
    const hasOrders = Array.isArray(orders) && orders.length > 0;
    if (open && (product || hasOrders)) {
      if (hasOrders) {
        setActiveOrders(orders);
        setSelIdx(0);
        setActiveProduct(null);
      } else {
        setActiveProduct(product);
        setActiveOrders(null);
      }
      setRating(0);
      setContent("");
      setMediaList([]);
      setAnonymous(false);
      setSubmitting(false);
      modalRef.current?.show({ title });
    } else {
      modalRef.current?.hide();
    }
    // 仅按 open 切换驱动；title/product/orders 变化不重复弹出。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 卸载时回收本地预览 URL。
  React.useEffect(
    () => () => {
      mediaList.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 本弹窗层做 5MB / 6 个校验，通过后逐个走上传通道，结果回填 mediaList。
  const addAndUpload = React.useCallback(
    (files) => {
      const remaining = MAX_FILES - mediaList.length;
      const maxFilesMsg =
        LANG["store.order_info.review_max_files"] ||
        `You can upload up to ${MAX_FILES} files.`;
      const tooLargeMsg =
        LANG["store.order_info.review_too_large"] ||
        "File exceeds the 5MB limit.";
      if (remaining <= 0) {
        tip(maxFilesMsg, "error");
        return;
      }
      const accepted = [];
      for (const file of files) {
        if (accepted.length >= remaining) {
          tip(maxFilesMsg, "error");
          break;
        }
        if (file.size > MAX_SIZE) {
          tip(`${file.name}: ${tooLargeMsg}`, "error");
          continue;
        }
        accepted.push(file);
      }
      if (!accepted.length) return;

      const items = accepted.map((file) => {
        const isImage = (file.type || "").startsWith("image");
        const isVideo = (file.type || "").startsWith("video");
        return {
          localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          size: file.size,
          type: isVideo ? "video" : isImage ? "image" : "file",
          previewUrl: isImage || isVideo ? URL.createObjectURL(file) : "",
          url: "",
          uploading: true,
        };
      });
      setMediaList((prev) => [...prev, ...items]);

      items.forEach((item) => {
        Api.uploadReviewMedia(item.file)
          .then((r) => {
            const info = r?.url ? r : r?.data || {};
            if (!info.url) throw new Error("no url");
            setMediaList((prev) =>
              prev.map((m) =>
                m.localId === item.localId
                  ? {
                      ...m,
                      url: info.url,
                      name: info.name || m.name,
                      type: info.type || m.type,
                      size: info.size || m.size,
                      uploading: false,
                    }
                  : m
              )
            );
          })
          .catch(() => {
            setMediaList((prev) =>
              prev.map((m) =>
                m.localId === item.localId
                  ? { ...m, uploading: false, failed: true }
                  : m
              )
            );
            tip(
              `${item.name}: ${
                LANG["store.order_info.review_upload_fail"] ||
                "Upload failed. Please try again."
              }`,
              "error"
            );
          });
      });
    },
    [mediaList.length, LANG, tip]
  );

  const removeMedia = React.useCallback((localId) => {
    setMediaList((prev) => {
      const target = prev.find((m) => m.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.localId !== localId);
    });
  }, []);

  const requestClose = React.useCallback(() => {
    if (submitting) return;
    mediaList.forEach((m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl));
    onClose?.();
  }, [submitting, mediaList, onClose]);

  const handleSubmit = React.useCallback(async () => {
    if (submitting) return;
    // 多订单模式取选中订单，单订单模式取 product/orderNumber。
    const productKey = selectedOrder
      ? selectedOrder.product_key
      : activeProduct?.productKey;
    const submitOrderNumber = selectedOrder
      ? selectedOrder.order_number
      : orderNumber;
    const submitSortKey = selectedOrder
      ? selectedOrder.sort_key
      : activeProduct?.sortKey;
    const submitComboKey = selectedOrder
      ? selectedOrder.combo_key
      : activeProduct?.comboKey;
    if (!productKey || !submitOrderNumber) return;
    if (rating < 1) {
      tip(
        LANG["store.order_info.review_need_rating"] ||
          "Please select a rating.",
        "error"
      );
      return;
    }
    // 正文选填（对齐业界「仅星级必填」）：留空也可提交，一键打星即可。
    if (mediaList.some((m) => m.uploading)) {
      tip(
        LANG["store.order_info.review_uploading"] ||
          "Please wait for uploads to finish.",
        "error"
      );
      return;
    }

    const media = mediaList
      .filter((m) => m.url && !m.failed)
      .map((m) => ({
        url: m.url,
        type: m.type,
        name: m.name,
        size: m.size,
      }));

    setSubmitting(true);
    try {
      const res = await Api.submitReview({
        order_number: submitOrderNumber,
        product_key: productKey,
        sort_key: submitSortKey,
        ...(submitComboKey ? { combo_key: submitComboKey } : {}),
        rating,
        content: content.trim(),
        media,
        anonymous,
      });
      if (res.code === 0) {
        tip(
          LANG["store.order_info.review_success"] ||
            "Thanks for your review!",
          "success"
        );
        onSuccess?.(productKey);
      } else {
        throw new Error("submit failed");
      }
    } catch {
      tip(
        LANG["store.order_info.review_fail"] ||
          "Failed to submit review. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    selectedOrder,
    activeProduct,
    orderNumber,
    rating,
    content,
    mediaList,
    anonymous,
    LANG,
    tip,
    onSuccess,
  ]);

  return (
    <>
      <Modal ref={modalRef} onClose={requestClose} closable={!submitting}>
        {displayProduct ? (
          <div className={styles.body} data-role="review-modal">
            <div className={styles.product}>
              {displayProduct.image ? (
                <div className={styles.thumb}>
                  <img src={displayProduct.image} alt={displayProduct.name || ""} />
                </div>
              ) : null}
              <div className={styles.product_meta}>
                <div className={styles.product_name}>{displayProduct.name}</div>
                {displayProduct.comboName ? (
                  <div className={styles.product_combo}>
                    {displayProduct.comboName}
                  </div>
                ) : null}
              </div>
            </div>

            {/* 多订单：同一商品分属多笔已完成订单，让用户选评哪一笔 */}
            {Array.isArray(activeOrders) && activeOrders.length > 1 ? (
              <div className={styles.field}>
                <div className={styles.label}>
                  {LANG["store.order_info.review_select_order"] ||
                    "Which order?"}
                </div>
                <select
                  className={styles.order_select}
                  value={selIdx}
                  disabled={submitting}
                  onChange={(e) => setSelIdx(Number(e.target.value))}
                >
                  {activeOrders.map((o, i) => (
                    <option key={o.order_number} value={i}>
                      {`#${o.order_number}${o.order_time ? ` · ${o.order_time}` : ""}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={styles.field}>
              <div className={styles.label}>
                {LANG["store.order_info.review_rating"] || "Rating"}
              </div>
              <StarRating
                value={rating}
                onChange={setRating}
                disabled={submitting}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>
                {LANG["store.order_info.review_content"] || "Your review"}
                <span className={styles.optional}>
                  {LANG["store.order_info.review_optional"] || "(optional)"}
                </span>
              </div>
              <textarea
                className={styles.textarea}
                value={content}
                disabled={submitting}
                maxLength={2000}
                placeholder={
                  LANG["store.order_info.review_content_ph"] ||
                  "Share your thoughts about this product…"
                }
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>
                {LANG["store.order_info.review_media"] || "Photos / Videos"}
              </div>
              <MediaUploader
                files={mediaList}
                max={MAX_FILES}
                accept="image/*,video/*"
                onPick={addAndUpload}
                onRemove={(i, item) => removeMedia(item?.localId)}
                LANG={LANG}
                pickerText={
                  LANG["store.order_info.review_media_add"] ||
                  "Add photos / videos"
                }
              />
              <p className={styles.media_hint}>
                {LANG["store.order_info.review_media_note"] ||
                  `Up to ${MAX_FILES} files, max 5MB each`}
              </p>
            </div>

            <label className={styles.anonymous}>
              <input
                type="checkbox"
                checked={anonymous}
                disabled={submitting}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              <span>
                {LANG["store.order_info.review_anonymous"] ||
                  "Post anonymously"}
              </span>
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancel_btn}
                disabled={submitting}
                onClick={requestClose}
              >
                {LANG["common.other.cancel"] || "Cancel"}
              </button>
              <button
                type="button"
                className={styles.submit_btn}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting
                  ? "..."
                  : LANG["store.order_info.review_submit"] || "Submit"}
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
      <ShowTipModal ref={tipRef} />
    </>
  );
}
