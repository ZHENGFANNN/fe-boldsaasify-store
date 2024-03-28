"use client";
import styles from "./index.module.scss";
import React from "react";

import "@splidejs/splide/css";
import Splide from "@splidejs/splide";
import ProductContext from "../../ProductContext";

// 获取类型
async function getMediaDisplayList({ productInfo, LANG }) {
  if (productInfo) {
    const list = [];
    if (productInfo.image_list.length > 0) {
      list.push({
        type: "image",
        icon_src: `${process.env.NEXT_PUBLIC_IMAGE}/icon/media-image.svg`,
        text: LANG["store.product.image"],
        image_list: productInfo.image_list,
      });
    }
    if (productInfo.video_url) {
      list.push({
        type: "video",
        icon_src: `${process.env.NEXT_PUBLIC_IMAGE}/icon/media-play.svg`,
        text: LANG["store.product.product_introduce"],
        video_url: productInfo.video_url,
        video_cover: productInfo.video_cover,
      });
    }
    if (productInfo.three_d) {
      list.push({
        type: "3d",
        icon_src: `${process.env.NEXT_PUBLIC_IMAGE}/icon/media-three-3d.svg`,
        text: "3D",
        three_d: productInfo.three_d,
        three_d_background: productInfo.three_d_background,
      });
    }
    return list;
  } else {
    return null;
  }
}

export default function GoodMediaDisplay() {
  const { lazyLoading, productInfo, productShowType, productCurCombo } =
    React.useContext(ProductContext);
  const [progress, setProgress] = React.useState(0);

  const mediaDisplayList = React.useMemo(() => {
    if (productInfo) {
      const list = [];
      if (productInfo.image_list.length > 0) {
        list.push({
          type: "image",
          image_list: productInfo.image_list,
        });
      }
      if (productInfo.video_url) {
        list.push({
          type: "video",
          video_url: productInfo.video_url,
          video_cover: productInfo.video_cover,
        });
      }
      if (productInfo.three_d) {
        list.push({
          type: "3d",
          three_d: productInfo.three_d,
          three_d_background: productInfo.three_d_background,
        });
      }
      return list;
    } else {
      return null;
    }
  }, []);

  React.useEffect(() => {
    if (!lazyLoading) {
      // 初始化Splide
      const splide = new Splide(".splide", {
        type: "fade",
        rewind: true,
        interval: 3000,
        pagination: false,
        autoplay: true,
        arrows: true,
        pauseOnHover: true,
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
      {mediaDisplayList.map((item, index) => {
        if (item.type === "image") {
          return (
            <div
              key={index}
              className={`splide ${styles.splide}`}
              style={{
                display: productShowType === "image" ? "block" : "none",
              }}
            >
              <div className={`splide__track ${styles.splide__track}`}>
                <ul className="splide__list">
                  {/* 套餐图 */}
                  {productCurCombo.img_list?.length > 0
                    ? productCurCombo.img_list?.map((item) => {
                        return (
                          <li
                            key={item.src}
                            className={`splide__slide ${styles.splide__slide}`}
                          >
                            <img alt={productInfo.name} src={item.src} />
                          </li>
                        );
                      })
                    : null}
                  {/* 产品图 */}
                  {productInfo.image_list?.length > 0
                    ? productInfo.image_list.map((item, index) => {
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
              {productCurCombo.img_list?.length > 0 ||
              productInfo.image_list?.length > 0 ? (
                <div className={styles.splide_image_list}>
                  <ul>
                    {productCurCombo.img_list?.map((item, index) => {
                      return (
                        <li key={index}>
                          <img alt={productInfo.name} src={item.src} />
                        </li>
                      );
                    })}
                    {productInfo.image_list?.map((item, index) => {
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
        }
        //  else if (item.type === "3d") {
        //   return (
        //     <React.Fragment key={item.type}>
        //       <model-viewer
        //         style={{
        //           display: productShowType === "3d" ? "block" : "none",
        //         }}
        //         id="product-model-viewer"
        //         src={item.three_d}
        //         environment-image={item.three_d_background}
        //         exposure="1.2"
        //         shadow-intensity="0"
        //         camera-controls="true"
        //         data-js-focus-visible="true"
        //         interaction-policy="always-allow"
        //         camera-orbit="0deg 90deg 120%"
        //         min-camera-orbit="auto auto 120%"
        //         max-camera-orbit="auto auto 120%"
        //         loading="eager"
        //         preload="true"
        //         max-field-of-view="auto"
        //         ar-status="not-presenting"
        //         disable-pan="true"
        //       >
        //         <div slot="progress-bar"></div>
        //         <div slot="poster" className={styles.product_3d_process}>
        //           <div
        //             style={{
        //               padding: "24px",
        //             }}
        //           >
        //             <img
        //               width={38}
        //               height={38}
        //               alt="3d"
        //               src={`${process.env.NEXT_PUBLIC_IMAGE}/icon/media-three-3d.svg`}
        //             />
        //           </div>
        //           <span>
        //             {LANG["store.product.3d_loading"]} {progress}%
        //           </span>
        //         </div>
        //       </model-viewer>
        //     </React.Fragment>
        //   );
        // }
      })}
    </div>
  );
}
