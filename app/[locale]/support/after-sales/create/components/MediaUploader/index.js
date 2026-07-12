"use client";

import React from "react";
import { useAtom } from "jotai";
import styles from "./index.module.scss";
import Api from "../../../api";
import { useCreateWizard } from "../../context";
import { mediaListAtom } from "../../atoms";

export default function MediaUploader() {
  const { T, LANG, tip, MAX_FILES, MAX_SIZE } = useCreateWizard();
  const [mediaList, setMediaList] = useAtom(mediaListAtom);
  const fileRef = React.useRef(null);

  // 卸载时回收本地预览 URL（挂载/切页时才触发一次）
  React.useEffect(
    () => () => {
      mediaList.forEach(
        (m) => m.previewUrl && URL.revokeObjectURL(m.previewUrl)
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const addAndUpload = React.useCallback(
    (files) => {
      const remaining = MAX_FILES - mediaList.length;
      if (remaining <= 0) {
        tip(
          T(
            LANG,
            "user_account.after_sale.media.max_files",
            `You can upload up to ${MAX_FILES} files.`
          ),
          "error"
        );
        return;
      }
      const accepted = [];
      for (const file of files) {
        if (accepted.length >= remaining) {
          tip(
            T(
              LANG,
              "user_account.after_sale.media.max_files",
              `You can upload up to ${MAX_FILES} files.`
            ),
            "error"
          );
          break;
        }
        if (file.size > MAX_SIZE) {
          tip(
            `${file.name}: ${T(
              LANG,
              "user_account.after_sale.media.too_large",
              "File exceeds the 200MB limit."
            )}`,
            "error"
          );
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
        Api.uploadMedia(item.file)
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
              prev.filter((m) => m.localId !== item.localId)
            );
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            tip(
              `${item.name}: ${T(
                LANG,
                "user_account.after_sale.media.upload_fail",
                "Upload failed. Please try again."
              )}`,
              "error"
            );
          });
      });
    },
    [mediaList.length, LANG, tip, T, MAX_FILES, MAX_SIZE, setMediaList]
  );

  const onPickFiles = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length) addAndUpload(files);
  };

  const removeMedia = (localId) => {
    setMediaList((prev) => {
      const target = prev.find((m) => m.localId === localId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((m) => m.localId !== localId);
    });
  };

  return (
    <>
      <div className={`${styles.section_label} ${styles.section_label_mt}`}>
        {T(LANG, "user_account.after_sale.media", "Photos / Videos")}
        <span className={styles.section_note}>
          {T(
            LANG,
            "user_account.after_sale.media.note",
            `Up to ${MAX_FILES} files, max 200MB each`
          )}
        </span>
      </div>

      <div className={styles.media_list}>
        {mediaList.map((m) => (
          <div key={m.localId} className={styles.media_item}>
            {m.type === "video" ? (
              <video
                src={m.previewUrl || m.url}
                className={styles.media_thumb}
              />
            ) : (
              <img
                src={m.previewUrl || m.url}
                alt={m.name}
                className={styles.media_thumb}
              />
            )}
            {m.uploading ? (
              <div className={styles.media_uploading}>
                <span className={styles.spinner} />
              </div>
            ) : null}
            <button
              type="button"
              className={styles.media_remove}
              onClick={() => removeMedia(m.localId)}
              aria-label="remove"
            >
              ×
            </button>
          </div>
        ))}
        {mediaList.length < MAX_FILES ? (
          <button
            type="button"
            className={styles.media_add}
            onClick={() => fileRef.current?.click()}
          >
            <span>+</span>
            {T(LANG, "user_account.after_sale.media.add", "Add")}
          </button>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={onPickFiles}
      />
    </>
  );
}
