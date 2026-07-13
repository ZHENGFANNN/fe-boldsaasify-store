"use client";

import React from "react";
import { useAtom } from "jotai";
import Api from "../../../api";
import { useCreateWizard } from "../../context";
import { mediaListAtom } from "../../atoms";
import MediaUploader from "@/components/MediaUploader";
import styles from "./index.module.scss";

// 售后媒体上传容器：状态/上传/删除逻辑留在本组件（atom + Api.uploadMedia），
// 展示复用共享 <MediaUploader>（实线选择框 + 已传列表 + 底部 x/max 计数），与商详自定义上传一致。
export default function AfterSaleMediaUploader() {
  const { T, LANG, tip, MAX_FILES, MAX_SIZE } = useCreateWizard();
  const [mediaList, setMediaList] = useAtom(mediaListAtom);

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

      <MediaUploader
        files={mediaList}
        max={MAX_FILES}
        accept="image/*,video/*"
        onPick={addAndUpload}
        onRemove={(i, item) => removeMedia(item?.localId)}
        LANG={LANG}
        pickerText={T(
          LANG,
          "user_account.after_sale.media.add",
          "Add photos / videos"
        )}
      />
    </>
  );
}
