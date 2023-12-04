import React from "react";

import GoodMediaDisplay from "./components/GoodMediaDisplay";
import GoodMediaTabs from "./components/GoodMediaTabs";
import GoodOptionList from "./components/GoodOptionList";
import GoodComboList from "./components/GoodComboList";
import AssociateProductList from "./components/AssociateProductList/index";
import GoodPackageList from "./components/GoodPackageList";
import GoodAccessoriesList from "./components/GoodAccessoriesList";
import GoodFunctionList from "./components/GoodFunctionList";
import GoodMediaList from "./components/GoodMediaList";
import GoodNumber from "./components/GoodNumber";
import Countdown from "./components/Countdown";

import styles from "./page.module.scss";
import { cookies } from "next/headers";
import Script from "next/script";

import getAllConfigData from "@/utils/getAllConfigData";
import GoodPrice from "./components/GoodPrice";
import GoodFooter from "./components/GoodFooter";
import Loading from "@/components/Loading";
import NavigatorIndex from "./components/NavigatorIndex";
export const runtime = "edge";

export async function generateMetadata({ params: { locale, productKey } }) {
  const { CONFIG, GOODLIST } = await getAllConfigData(locale);
  const productInfo = await getProductInfo({
    productList: GOODLIST,
    productKey,
  });
  if (productInfo) {
    return {
      title: `${productInfo.indexConfig[0]?.page_title} - ${CONFIG["company.basic.company_name"]}`,
      description: productInfo.indexConfig[0]?.page_description,
      keywords: productInfo.indexConfig[0]?.page_keywords,
      openGraph: {
        title: `${productInfo.indexConfig[0]?.page_title} - ${CONFIG["company.basic.company_name"]}`,
        description: productInfo.indexConfig[0]?.page_description,
        image: productInfo.image_url,
      },
    };
  } else {
    return {
      title: CONFIG["company.basic.company_name"],
    };
  }
}

// 获取产品信息
async function getProductInfo({ productList, productKey, order_page = null }) {
  return productList.find((item) => {
    return item.key === productKey;
  });
}

// 获取产品套餐
async function getComboList({ area, productInfo }) {
  if (productInfo) {
    const list = productInfo.comboList.map((item) => {
      let areaInfo = null;
      item.areaList.forEach((country) => {
        if (country.country_code === area) {
          areaInfo = country;
        }
      });
      return {
        ...item,
        areaInfo,
      };
    });
    return list;
  } else {
    return null;
  }
}

// 获取类型
async function getTypeList({ productInfo, LANG }) {
  if (productInfo) {
    const list = [];
    if (productInfo.image_url) {
      list.push({
        type: "image",
        icon_src: `${process.env.NEXT_PUBLIC_IMAGE}/icon/media-image.svg`,
        text: LANG["store.product.image"],
        image_url: productInfo.image_url,
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

export default async function Product({ params: { locale, productKey } }) {
  const area = cookies().get("area")?.value || "us";
  const { LANG, CONFIG, GOODLIST } = await getAllConfigData(locale);
  const productInfo = await getProductInfo({
    productList: GOODLIST,
    productKey,
  });
  const comboList = await getComboList({ area, productInfo });
  const typeList = await getTypeList({ productInfo, LANG });

  return (
    <div className={styles.container}>
      {!productInfo || !comboList ? (
        <>
          <Loading height="80vh" />
          <NavigatorIndex />
        </>
      ) : (
        <>
          {/* 首屏信息配置 */}
          <section className={styles.main_content}>
            <div className={styles.left_content}>
              <GoodMediaDisplay
                LANG={LANG}
                options={typeList}
                productInfo={productInfo}
              />
              {/* <Countdown /> */}
              <GoodMediaTabs options={typeList} />
            </div>
            <div className={styles.right_content}>
              <div>
                <h1>{productInfo.name}</h1>
                <GoodPrice />
                {productInfo.sellingList.length > 0 ? (
                  <ul className={styles.product_advantage}>
                    {productInfo.sellingList.map((item, index) => {
                      return <li key={index}>{item.light}</li>;
                    })}
                  </ul>
                ) : null}
                {/* <a
              className={styles.product_detail}
              href={`/product/${productInfo.sort_key}/${productInfo.key}`}
            >
              <span>{LANG["store.product.product_info"]}</span>
              <div className={styles.arrow_icon}></div>
            </a> */}

                {productInfo.typeList?.length > 0
                  ? productInfo.typeList.map((item, index) => {
                      return (
                        <GoodOptionList
                          key={index}
                          title={item.title}
                          options={item.options}
                          type={item.type}
                        />
                      );
                    })
                  : null}
                {/* 套餐列表 */}
                {comboList.length > 0 ? (
                  <GoodComboList
                    LANG={LANG}
                    title={LANG["store.product.combo"]}
                    options={comboList}
                  />
                ) : null}
              </div>

              <GoodNumber LANG={LANG} />
            </div>
          </section>
          <div className={styles.sec_line}></div>
          {/* 产品媒体列表 */}
          <GoodMediaList configList={productInfo.mediaList} LANG={LANG} />
          {/* 产品功能 */}
          <GoodFunctionList configList={productInfo.funcionList} LANG={LANG} />
          {/* 产品参数 */}
          <GoodAccessoriesList
            configList={productInfo.associationsList}
            LANG={LANG}
          />
          {/* 产品包装列表 */}
          <GoodPackageList configList={productInfo.packageList} LANG={LANG} />
          {/* 关联产品列表 */}
          {productInfo.associateProduct.length > 0 ? (
            <>
              <div className={styles.sec_line}></div>
              <AssociateProductList
                products={productInfo.associateProduct}
                title={LANG["store.product.maybe_you_like"]}
              />
            </>
          ) : null}
          {/* 产品底部 */}
          <GoodFooter LANG={LANG} productInfo={productInfo} />
          <Script
            id="product-3d-script"
            async
            type="module"
            src="https://unpkg.com/@google/model-viewer/dist/model-viewer.js"
          ></Script>
          <Script
            id="store-product-ld-json"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org/",
                  "@type": "Product",
                  name: productInfo.name,
                  image: [productInfo.image_url],
                  description: productInfo.description,
                  offers: {
                    "@type": "Offer",
                    price: comboList[0]?.areaInfo?.price ?? 99999,
                    priceCurrency: comboList[0]?.areaInfo?.currency ?? "USD",
                  },
                  sku: CONFIG["company.basic.company_name"],
                  mpn: productInfo.key,
                  brand: {
                    "@type": "Brand",
                    name: `${CONFIG["company.basic.company_name"]}`,
                  },
                },
                null,
                "\t"
              ),
            }}
          />
        </>
      )}
    </div>
  );
}
