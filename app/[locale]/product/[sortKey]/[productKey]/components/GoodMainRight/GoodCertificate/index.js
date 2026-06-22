"use client";

// 商品详情页买点区 · GIA/IGI 证书展示 + 溯源叙事
// 证书：读 productInfo.certificateList，每条 = { lab, report_id, cert_image, cert_pdf, verify_url }。
//   列表为空则整块证书区不渲染（不留空区块）；点击徽章 → 共享 Modal 展示证书图/PDF/官网核验外链。
// 溯源叙事：品牌级文案，不依赖商品数据，始终渲染。
// LANG 取 ProductContext（带英文兜底）。

import React from "react";

import Modal from "@/components/Modal";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { fillOssImage, getJsonData, trackingCustomClick } from "@/utils";
import ProductContext from "../../../ProductContext";

import styles from "./index.module.scss";

// 按 lab + report_id 拼官网核验外链；未知 lab 或无 report_id 返回空。
function buildVerifyUrl(lab, reportId) {
  if (!reportId) return "";
  const key = String(lab || "").trim().toUpperCase();
  if (key === "GIA") {
    return `https://www.gia.edu/report-check?reportno=${encodeURIComponent(
      reportId
    )}`;
  }
  if (key === "IGI") {
    return `https://www.igi.org/verify-your-report/?r=${encodeURIComponent(
      reportId
    )}`;
  }
  return "";
}

export default function GoodCertificate() {
  const { LANG, productInfo } = React.useContext(ProductContext);
  const modalRef = React.useRef();
  const [activeCert, setActiveCert] = React.useState(null);

  // certificateList 可能是已解析数组，也可能是 JSON 字符串，统一规整为数组。
  const certificates = React.useMemo(() => {
    const raw = productInfo?.certificateList;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim()) {
      const parsed = getJsonData(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  }, [productInfo]);

  const verifyLabel = (lab) =>
    (LANG?.["store.product.certificate.verify"] || "Verify on {lab} official site").replace(
      "{lab}",
      lab || LANG?.["store.product.certificate.lab_fallback"] || "official"
    );

  function open(cert) {
    setActiveCert(cert);
    trackingCustomClick({
      click_type: `Certificate-${cert?.lab || "unknown"}`
    });
    modalRef.current.show({
      title: cert?.lab
        ? `${cert.lab} ${
            LANG?.["store.product.certificate.report_label"] || "Report"
          }`
        : LANG?.["store.product.certificate.title"] || "Diamond Certificate"
    });
  }

  const verifyUrl = activeCert
    ? activeCert.verify_url || buildVerifyUrl(activeCert.lab, activeCert.report_id)
    : "";
  const certImage = activeCert?.cert_image
    ? fillOssImage(activeCert.cert_image)
    : "";

  return (
    <div className={styles.container} data-role="good-certificate">
      {certificates.length > 0 ? (
        <>
          <div className={styles.heading}>
            {LANG?.["store.product.certificate.title"] || "Diamond Certificate"}
          </div>
          <div className={styles.list}>
            {certificates.map((cert, idx) => (
              <div
                key={cert?.report_id || `${cert?.lab || "cert"}-${idx}`}
                className={styles.item}
                onClick={() => open(cert)}
              >
                <div className={styles.left_content}>
                  <span className={styles.badge}>{cert?.lab || "—"}</span>
                  {cert?.report_id ? (
                    <span className={styles.report}>
                      {LANG?.["store.product.certificate.report_label"] ||
                        "Report"}
                      {" #"}
                      {cert.report_id}
                    </span>
                  ) : null}
                </div>
                <div className={styles.arrow} aria-hidden="true" />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* 溯源叙事：始终渲染，不依赖商品数据 */}
      <div className={styles.traceability} data-role="traceability">
        <div className={styles.traceTitle}>
          {LANG?.["store.product.traceability.title"] ||
            "Ethically Sourced, Beautifully Traceable"}
        </div>
        <p className={styles.traceBody}>
          {LANG?.["store.product.traceability.body_1"] ||
            "Every diamond we set is lab-grown using renewable energy, sharing the exact same physical, chemical and optical properties as a mined diamond."}
        </p>
        <p className={styles.traceBody}>
          {LANG?.["store.product.traceability.body_2"] ||
            "Free from conflict and intensive mining, each stone arrives with a clear origin you can trust — beauty without compromise."}
        </p>
        <p className={styles.traceBody}>
          {LANG?.["store.product.traceability.body_3"] ||
            "From responsibly grown crystal to a finished piece, your jewelry is crafted to last a lifetime and beyond."}
        </p>
      </div>

      <Modal ref={modalRef}>
        <div className={styles.modalBody}>
          {certImage ? (
            <div className={styles.certImageWrap}>
              <ImageWithSkeleton
                src={certImage}
                alt={
                  activeCert?.lab
                    ? `${activeCert.lab} certificate`
                    : "certificate"
                }
                wrapClassName={styles.certImage}
              />
            </div>
          ) : null}

          <div className={styles.modalActions}>
            {activeCert?.cert_pdf ? (
              <a
                className={styles.actionLink}
                href={activeCert.cert_pdf}
                target="_blank"
                rel="noopener noreferrer"
              >
                {LANG?.["store.product.certificate.view_pdf"] ||
                  "View / download certificate"}
              </a>
            ) : null}
            {verifyUrl ? (
              <a
                className={styles.actionLink}
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {verifyLabel(activeCert?.lab)}
              </a>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}
