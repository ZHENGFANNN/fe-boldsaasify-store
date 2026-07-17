"use client";
import styles from "./index.module.scss";
import React from "react";

import "@splidejs/splide/css";
import Splide from "@splidejs/splide";
import ProductContext from "../../../ProductContext";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import { track } from "@/utils/analytics";

/** sRGB 分量(0~1) → 线性空间；glTF baseColorFactor 定义在线性空间，
 *  而颜色选择器给的 hex 是 sRGB，需做 gamma 转换才能所见即所得。 */
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** hex(#RRGGBB, sRGB) → model-viewer 线性 baseColorFactor [r,g,b,a](0~1, a=1)；非法值返回 null。
 *  model-viewer 对传入的数组按线性空间直写（不做 sRGB→线性），故此处显式转换，避免颜色偏亮。 */
function hexToColorFactor(hex) {
  if (typeof hex !== "string") return null;
  const m = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  return [
    srgbToLinear(parseInt(m.slice(0, 2), 16) / 255),
    srgbToLinear(parseInt(m.slice(2, 4), 16) / 255),
    srgbToLinear(parseInt(m.slice(4, 6), 16) / 255),
    1,
  ];
}

/** 套餐 three_d_colors 归一为 { 材质名: hex } 对象；兼容后端下发对象或 JSON 字符串。 */
function parseThreeDColors(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

export default function GoodMediaDisplay() {
  const { LANG, lazyLoading, productInfo, productShowType, productCurCombo } =
    React.useContext(ProductContext);
  const [progress, setProgress] = React.useState(0);

  const mediaDisplayList = React.useMemo(() => {
    if (productInfo) {
      const list = [];
      if (
        Array.isArray(productInfo.image_list) &&
        productInfo.image_list.length > 0
      ) {
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
  }, [productInfo]);

  const splideRef = React.useRef(null);
  const productCurComboRef = React.useRef(productCurCombo);
  React.useEffect(() => {
    productCurComboRef.current = productCurCombo;
  }, [productCurCombo]);

  // ===== 套餐 3D 上色 =====
  // 外层 model-viewer 的材质按当前套餐 productCurCombo.three_d_colors 逐个上色（同名材质）；
  // 未配色的材质保持/恢复原始色。model-viewer 懒加载(data-src)，须等 load 事件后再上色。
  const modelSrc = productInfo?.three_d || null;
  // 已完成 load 且已缓存原始色的模型 URL；等于当前 modelSrc 时才对该模型上色（避免竞态/切商品残留）。
  const [loadedSrc, setLoadedSrc] = React.useState(null);
  // 首次 load 时缓存每个材质的原始 baseColorFactor（按材质名），用于切换套餐时恢复未配色材质。
  const originalColorsRef = React.useRef({});

  // 绑定 model-viewer 的 load 事件：挂载即绑定，早于用户切到 3D 视图时才设置的 src，故不漏听。
  // 切商品（modelSrc 变化）时重跑：清空上个模型的原始色缓存，待新模型 load 后按新材质重建。
  React.useEffect(() => {
    if (lazyLoading || !modelSrc) return;
    const mv = document.getElementById("product-model-viewer");
    if (!mv) return;
    originalColorsRef.current = {};
    const onLoad = () => {
      const materials = mv.model?.materials;
      if (Array.isArray(materials)) {
        materials.forEach((mat) => {
          const name = mat?.name;
          const factor = mat?.pbrMetallicRoughness?.baseColorFactor;
          if (
            name != null &&
            Array.isArray(factor) &&
            !(name in originalColorsRef.current)
          ) {
            originalColorsRef.current[name] = factor.slice();
          }
        });
      }
      // load 回调内 setState（非 effect 同步体），驱动上色 effect 重跑。
      setLoadedSrc(modelSrc);
    };
    mv.addEventListener("load", onLoad);
    return () => mv.removeEventListener("load", onLoad);
  }, [lazyLoading, modelSrc]);

  // 套餐变化（或模型就绪）→ 逐材质上色：命中 three_d_colors 用套餐色，
  // 其余一律恢复原始色，避免上一个套餐的颜色残留。仅在当前模型已 load 时执行。
  React.useEffect(() => {
    if (!modelSrc || loadedSrc !== modelSrc) return;
    const mv = document.getElementById("product-model-viewer");
    const materials = mv?.model?.materials;
    if (!Array.isArray(materials)) return;
    const colorMap = parseThreeDColors(productCurCombo?.three_d_colors);
    materials.forEach((mat) => {
      const pbr = mat?.pbrMetallicRoughness;
      if (!pbr?.setBaseColorFactor) return;
      const factor = hexToColorFactor(colorMap[mat?.name]);
      if (factor) {
        pbr.setBaseColorFactor(factor);
      } else {
        const original = originalColorsRef.current[mat?.name];
        if (Array.isArray(original)) pbr.setBaseColorFactor(original);
      }
    });
  }, [loadedSrc, modelSrc, productCurCombo]);

  React.useEffect(() => {
    if (!lazyLoading) {
      // 图片总数 = 套餐图 + 产品图(见下方轮播渲染)。只有一张时无需左右切换箭头。
      const totalSlides =
        (productCurCombo.img_list?.length || 0) +
        (productInfo.image_list?.length || 0);
      // 初始化Splide
      const splide = new Splide(".splide", {
        type: "fade",
        rewind: true,
        interval: 3000,
        pagination: false,
        autoplay: true,
        arrows: totalSlides > 1,
        pauseOnHover: true,
        classes: {
          arrow: `splide__arrow ${styles.splide__arrow}`,
        },
      });
      splideRef.current = splide;
      const $domListContainer = $(`.${styles.splide_image_list}`);
      // 激活index
      splide.on("active", (target) => {
        const $domList = $(`.${styles.splide_image_list}`).find("ul li");
        $domList.each((index) => {
          if (index === target.index) {
            $domList.eq(index).addClass(styles.active);
            const top = $domList.eq(index).position().top;
            $domListContainer.get(0).scrollTo({
              top: $domListContainer.scrollTop() + top,
              behavior: "smooth",
            });
          } else {
            $domList.eq(index).removeClass(styles.active);
          }
        });
      });
      // 点击轮播图(委托绑到容器,避免 refresh 后 li 换了对象丢事件)
      $domListContainer.on("click", "ul li", function () {
        track("ProductMediaCoverItem");
        splide.go($(this).index());
      });
      // 选项跳转
      $("[data-carousel]").on("click", function () {
        let index = parseInt($(this).attr("data-carousel"));
        if (!isNaN(index)) {
          index = index + (productCurComboRef.current.img_list?.length || 0);
          splide.go(index - 1);
        }
      });
      splide.mount();
      return () => {
        splide.destroy();
        splideRef.current = null;
        $("[data-carousel]").off("click");
        $domListContainer.off("click");
      };
    }
  }, [lazyLoading]);

  // 套餐切换时,同步 Splide 的 slide 列表并跳回首图。
  // 套餐图会因当前 combo.img_list 增删变化,首图即当前套餐首图(套餐图排在产品图前)。
  React.useEffect(() => {
    const splide = splideRef.current;
    if (!splide) return;
    const totalSlides =
      (productCurCombo.img_list?.length || 0) +
      (productInfo.image_list?.length || 0);
    splide.options = { arrows: totalSlides > 1 };
    splide.refresh();
    splide.go(0);
  }, [productCurCombo, productInfo.image_list]);

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
    <div className={styles.left_content_top_container}>
      <div className={styles.left_content_top}>
        {mediaDisplayList.map((item, index) => {
          if (item.type === "image") {
            return (
              <React.Fragment key={index}>
                {productCurCombo.img_list?.length > 0 ||
                productInfo.image_list?.length > 0 ? (
                  <div
                    className={styles.splide_image_list}
                    style={{
                      display: productShowType === "image" ? "block" : "none",
                    }}
                  >
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
                {/* 显隐挂在 React 完全掌控的 wrapper 上（display:contents 不生成盒子、布局不变）。
                    切 variant 时 Splide.destroy 会抹掉 .splide 根节点的 style 属性，若把 display 挂在
                    .splide 上会被清除且 React 因 prop 未变不补写 → 出现「半图半3D」。挂 wrapper 可规避。 */}
                <div
                  style={{
                    display: productShowType === "image" ? "contents" : "none",
                  }}
                >
                  <div className={`splide ${styles.splide}`}>
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
                                <ImageWithSkeleton
                                  wrapClassName={styles.media_img_wrap}
                                  alt={productInfo.name}
                                  src={item.src}
                                />
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
                                <ImageWithSkeleton
                                  wrapClassName={styles.media_img_wrap}
                                  alt={productInfo.name}
                                  src={item.src}
                                />
                              </li>
                            );
                          })
                        : null}
                    </ul>
                  </div>
                  </div>
                </div>
              </React.Fragment>
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
                poster={item.video_cover}
                src={item.video_url}
                style={{
                  display: productShowType === "video" ? "block" : "none",
                }}
              />
            );
          } else if (item.type === "3d") {
            return (
              <React.Fragment key={item.type}>
                <model-viewer
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
                  disable-pan="true"
                >
                  <div slot="progress-bar"></div>
                  <div slot="poster" className={styles.product_3d_process}>
                    <div className={styles.loader3d}>
                      <span className={styles.loaderRing} aria-hidden="true" />
                      <span className={styles.loaderText}>
                        {LANG["store.product.3d_loading"] || "Loading 3D model"}
                      </span>
                      <span className={styles.loaderBar}>
                        <span
                          className={styles.loaderBarFill}
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                      <span className={styles.loaderPct}>{progress}%</span>
                    </div>
                  </div>
                </model-viewer>
              </React.Fragment>
            );
          }
        })}
      </div>
    </div>
  );
}
