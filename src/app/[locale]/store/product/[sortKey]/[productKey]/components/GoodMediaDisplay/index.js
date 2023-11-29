"use client";
import styles from "./index.module.scss";
import React from "react";

import "@splidejs/splide/css";
import Splide from "@splidejs/splide";
import useProductStore from "../../productStore";
import ProductContext from "../../productContext";

export default function ContentDisplay({ options = [], productInfo, LANG }) {
  const { lazyLoading } = React.useContext(ProductContext);
  const productCurCombo = useProductStore((state) => state.productCurCombo);
  const productShowType = useProductStore((state) => state.productShowType);
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    if (!lazyLoading) {
      // 初始化Splide
      const splide = new Splide(".splide", {
        type: "fade",
        rewind: true,
        interval: 5000,
        autoplay: productCurCombo.img_list?.length > 0,
        pagination: false,
        arrows: productCurCombo.img_list?.length > 0,
        classes: {
          arrow: `splide__arrow ${styles.splide__arrow}`,
        },
      });
      const $domList = $(`.${styles.splide_image_list}`).find("ul li");
      // 激活index
      splide.on("active", (target) => {
        $domList.each((index) => {
          if (index === target.index) {
            $domList.eq(index).addClass(styles.active);
          } else {
            $domList.eq(index).removeClass(styles.active);
          }
        });
      });
      // 点击轮播图
      $domList.on("click", function () {
        splide.go($(this).index());
      });
      splide.mount();
      return () => {
        splide.destroy();
      };
    }
  }, [productCurCombo, lazyLoading]);

  React.useEffect(() => {
    if (!lazyLoading) {
      const scaleHeight = function () {
        const bili = ((window.innerHeight - 150) / 740).toFixed(2);
        const width = window.innerWidth;
        if (bili < 1 && width > 1200) {
          const $dom = $(`.${styles.left_content}`);
          $dom.css({
            transform: `scale(${bili})`,
            transformOrigin: "top",
          });
        }
      };
      scaleHeight();
      $(window).on("resize", scaleHeight);
    }
  }, [lazyLoading]);
  React.useEffect(() => {
    if (!lazyLoading) {
      // 控制视频播放/暂停
      const $productVideo = $("#product_video").get(0);
      if ($productVideo && productShowType === "video") {
        $productVideo.play();
      } else if (
        $productVideo &&
        productShowType !== "video" &&
        !$productVideo.paused
      ) {
        $productVideo.pause();
      }

      // 控制3D进度条
      if (productShowType === "3d") {
        const $productModelViewer = $("#product-model-viewer");
        $productModelViewer.on("progress", (e) => {
          let process = (e.detail.totalProgress * 100).toFixed(0);
          setProgress(process);
        });
        $productModelViewer.attr("src", $productModelViewer.attr("data-src"));
        $productModelViewer.attr(
          "environment-image",
          $productModelViewer.attr("data-environment-image")
        );
        $productModelViewer.removeAttr("data-src");
        $productModelViewer.removeAttr("data-environment-image");
      }
    }
  }, [productShowType, lazyLoading]);

  return (
    <div className={styles.left_content_top}>
      {options.map((item) => {
        if (item.type === "image") {
          return (
            <div
              key={item.type}
              className={`splide ${styles.splide}`}
              style={{
                display: productShowType === "image" ? "block" : "none",
              }}
            >
              <div className={`splide__track ${styles.splide__track}`}>
                <ul className="splide__list">
                  <li className={`splide__slide ${styles.splide__slide}`}>
                    {productCurCombo.areaInfo.good_discount ? (
                      <div className={styles.good_discount}>
                        <div className={styles.off}>OFF</div>
                        <div className={styles.discount}>
                          {100 - productCurCombo.areaInfo.good_discount}%
                        </div>
                      </div>
                    ) : null}
                    <div className={styles.product_img}>
                      <img alt={productInfo.name} src={productInfo.image_url} />
                    </div>
                  </li>
                  {productCurCombo.img_list?.length > 0
                    ? productCurCombo.img_list?.map((item, index) => {
                        return (
                          <li
                            key={index}
                            className={`splide__slide ${styles.splide__slide}`}
                          >
                            <img alt={productInfo.name} src={item.src} />
                          </li>
                        );
                      })
                    : null}
                </ul>
              </div>
              {productCurCombo.img_list?.length > 0 ? (
                <div className={styles.splide_image_list}>
                  <ul>
                    <li>
                      <div className={styles.product_img}>
                        <img
                          alt={productInfo.name}
                          src={productInfo.image_url}
                        />
                      </div>
                    </li>
                    {productCurCombo.img_list?.map((item, index) => {
                      return (
                        <li key={index}>
                          <img alt={productInfo.name} src={item.src} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        } else if (item.type === "video") {
          return (
            <video
              key={item.type}
              id="product_video"
              controlsList="nodownload"
              playsInline
              controls
              muted
              preload="none"
              height="100%"
              width="100%"
              poster={item.video_poster}
              src={item.video_url}
              style={{
                display: productShowType === "video" ? "block" : "none",
              }}
            />
          );
        } else if (item.type === "3d") {
          return (
            <model-viewer
              key={item.type}
              style={{
                display: productShowType === "3d" ? "block" : "none",
              }}
              id="product-model-viewer"
              data-src={item.three_d}
              data-environment-image={item.three_d_background}
              exposure="1.2"
              shadow-intensity="0"
              camera-controls="true"
              data-js-focus-visible="true"
              interaction-policy="always-allow"
              camera-orbit="0deg 90deg 120%"
              min-camera-orbit="auto auto 120%"
              max-camera-orbit="auto auto 120%"
              loading="eager"
              preload="true"
              max-field-of-view="auto"
              ar-status="not-presenting"
              disable-pan="true"
            >
              <div slot="progress-bar"></div>
              <div slot="poster" className={styles.product_3d_process}>
                <div
                  style={{
                    padding: "24px",
                  }}
                >
                  <img
                    width={38}
                    height={38}
                    alt="3d"
                    src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/media-three-3d.svg`}
                  />
                </div>
                <span>
                  {LANG["store.product.3d_loading"]} {progress}%
                </span>
              </div>
            </model-viewer>
          );
        }
      })}
    </div>
  );
}
