"use client";

import React from "react";
import styles from "./index.module.scss";
import Api from "../../api";
import Modal from "@/components/Modal";
import ShowTipModal from "@/components/Modal/ShowTipModal";
import MediaUploader from "@/components/MediaUploader";

// 评论上传限制（与售后申请 CreateWizard 对齐）：最多 6 个文件、单文件 ≤ 200MB。
const MAX_FILES = 6;
const MAX_SIZE = 200 * 1024 * 1024; // 200MB

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
 * props：
 *   - open        是否打开（受控；父级用 reviewTarget 驱动）
 *   - product     被评商品 { productKey, sortKey, comboKey?, name, comboName?, image? }
 *   - orderNumber 订单号（提交入参 order_number）
 *   - LANG        文案对象（LANG["key"] || fallback）
 *   - onClose     请求关闭（背景/×/取消）
 *   - onSuccess(productKey) 提交成功回调（父级据此标记已评 + 刷新状态）
 */
export default function ReviewModal({
  open,
  product,
  orderNumber,
  LANG,
  onClose,
  onSuccess,
}) {
  const modalRef = React.useRef(null);
  const tipRef = React.useRef(null);

  const [rating, setRating] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [mediaList, setMediaList] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  // 关闭动画期间保留商品信息，避免内容瞬间消失。
  const [activeProduct, setActiveProduct] = React.useState(null);

  const tip = React.useCallback((text, type = "info") => {
    tipRef.current?.show({ text, type });
  }, []);

  const title = LANG["store.order_info.write_review"] || "Write a review";

  // open 切换：打开时重置表单并弹出；关闭时收起（保留 activeProduct 供出场动画）。
  React.useEffect(() => {
    if (open && product) {
      setActiveProduct(product);
      setRating(0);
      setContent("");
      setMediaList([]);
      setSubmitting(false);
      modalRef.current?.show({ title });
    } else {
      modalRef.current?.hide();
    }
    // 仅按 open 切换驱动；title/product 变化不重复弹出。
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

  // 本弹窗层做 200MB / 6 个校验，通过后逐个走上传通道，结果回填 mediaList。
  const addAndUpload = React.useCallback(
    (files) => {
      const remaining = MAX_FILES - mediaList.length;
      const maxFilesMsg =
        LANG["store.order_info.review_max_files"] ||
        `You can upload up to ${MAX_FILES} files.`;
      const tooLargeMsg =
        LANG["store.order_info.review_too_large"] ||
        "File exceeds the 200MB limit.";
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
    if (!activeProduct?.productKey) return;
    if (rating < 1) {
      tip(
        LANG["store.order_info.review_need_rating"] ||
          "Please select a rating.",
        "error"
      );
      return;
    }
    if (!content.trim()) {
      tip(
        LANG["store.order_info.review_need_content"] ||
          "Please write your review.",
        "error"
      );
      return;
    }
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
        order_number: orderNumber,
        product_key: activeProduct.productKey,
        sort_key: activeProduct.sortKey,
        ...(activeProduct.comboKey ? { combo_key: activeProduct.comboKey } : {}),
        rating,
        content: content.trim(),
        media,
      });
      if (res.code === 0) {
        tip(
          LANG["store.order_info.review_success"] ||
            "Thanks for your review!",
          "success"
        );
        onSuccess?.(activeProduct.productKey);
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
    activeProduct,
    rating,
    content,
    mediaList,
    orderNumber,
    LANG,
    tip,
    onSuccess,
  ]);

  return (
    <>
      <Modal ref={modalRef} onClose={requestClose} closable={!submitting}>
        {activeProduct ? (
          <div className={styles.body} data-role="review-modal">
            <div className={styles.product}>
              {activeProduct.image ? (
                <div className={styles.thumb}>
                  <img src={activeProduct.image} alt={activeProduct.name || ""} />
                </div>
              ) : null}
              <div className={styles.product_meta}>
                <div className={styles.product_name}>{activeProduct.name}</div>
                {activeProduct.comboName ? (
                  <div className={styles.product_combo}>
                    {activeProduct.comboName}
                  </div>
                ) : null}
              </div>
            </div>

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
                  `Up to ${MAX_FILES} files, max 200MB each`}
              </p>
            </div>

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
