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
import GoodBtnList from "./components/GoodBtnList";
import Countdown from "./components/Countdown";

import styles from "./page.module.scss";
import { cookies } from "next/headers";
import Script from "next/script";

import GoodPrice from "./components/GoodPrice";
import GoodFooter from "./components/GoodFooter";
import Loading from "@/components/Loading";
import NavigatorIndex from "./components/NavigatorIndex";
import GoodReviewsRate from "./components/GoodReviewsRate";
import GoodReviewsContent from "./components/GoodReviewsContent";

import getConfigDataV2 from "@/utils/getConfigDataV2";
export const runtime = "edge";

// 匹配产品信息
async function getProductInfo({ productList, productKey }) {
  return productList.find((item) => {
    return item.key === productKey;
  });
}

/**
 * 获取数据
 */
async function getData({ productKey, locale, area, configList }) {
  const result = await getConfigDataV2({ locale, area, configList });
  result.productInfo = await getProductInfo({
    productList: result.GOODLIST,
    productKey,
  });
  result.typeList = await getTypeList({
    productInfo: result.productInfo,
    LANG: result.LANG,
  });
  return result;
}

// 设置元信息
export async function generateMetadata({ params: { locale, productKey } }) {
  const area = cookies().get("area")?.value || "us";
  const { CONFIG, GOODLIST } = await getConfigDataV2({
    locale,
    area,
    configList: ["config", "good"],
  });
  const productInfo = await getProductInfo({
    productList: GOODLIST,
    productKey,
  });
  if (productInfo) {
    return {
      title: `${productInfo.indexConfig[0]?.page_title} - ${CONFIG["company.basic.company_name"]}`,
      description: productInfo.indexConfig[0]?.page_description,
      keywords: productInfo.indexConfig[0]?.page_keywords,
      metadataBase: new URL(productInfo.image_list[0].src),
      openGraph: {
        title: `${productInfo.indexConfig[0]?.page_title} - ${CONFIG["company.basic.company_name"]}`,
        description: productInfo.indexConfig[0]?.page_description,
        image: productInfo.image_list.map((item) => item.src),
      },
    };
  } else {
    return {
      title: CONFIG["company.basic.company_name"],
    };
  }
}

// 获取类型
async function getTypeList({ productInfo, LANG }) {
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

export default async function Product({ params: { locale, productKey } }) {
  const area = cookies().get("area")?.value || "us";
  const { LANG, CONFIG, GOODDISCOUNTFESTIVAL, productInfo, typeList } =
    await getData({
      locale,
      area,
      productKey,
      configList: ["config", "language", "good", "goodDiscountFestival"],
    });

  return (
    <div className={styles.container}>
      {!productInfo || !productInfo?.comboList ? (
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
                goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                productInfo={productInfo}
              />
              <Countdown
                goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                LANG={LANG}
              />
              <GoodMediaTabs options={typeList} />
            </div>
            <div className={styles.right_content}>
              <div>
                <h1>{productInfo.name}</h1>
                {/* 配置的亮点 */}
                {productInfo.sellingList.length > 0 ? (
                  <ul className={styles.product_advantage}>
                    {productInfo.sellingList.map((item, index) => {
                      if (index > 3) {
                        return null;
                      } else {
                        return (
                          <li key={index}>
                            <span className={styles.product_advantage_symbol}>
                              ✅
                            </span>
                            {item.light}
                          </li>
                        );
                      }
                    })}
                  </ul>
                ) : null}
                {/* 价格配置 */}
                <GoodPrice
                  goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                  comboList={productInfo.comboList}
                />
                {/* 产品评价 */}
                {productInfo.reviewsList.length > 0 ? (
                  <GoodReviewsRate
                    configList={productInfo.reviewsList}
                    LANG={LANG}
                  />
                ) : null}
                <div className={styles.line}></div>
                {/* 产品选项 */}
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
                <GoodComboList
                  goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                  LANG={LANG}
                  title={LANG["store.product.combo"]}
                  options={productInfo.comboList}
                />
              </div>
              <div>
                <GoodNumber LANG={LANG} />
                <GoodBtnList
                  goodDiscountFestival={GOODDISCOUNTFESTIVAL}
                  LANG={LANG}
                  areaCode={area}
                  locale={locale}
                  productInfo={productInfo}
                />
              </div>
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
          {/* 产品评论 */}
          <GoodReviewsContent
            configList={productInfo.reviewsList}
            LANG={LANG}
          />
          {/* 关联产品列表 */}
          {/* {productInfo.associateProduct.length > 0 ? (
            <>
              <div className={styles.sec_line}></div>
              <AssociateProductList
                products={productInfo.associateProduct}
                title={LANG["store.product.maybe_you_like"]}
              />
            </>
          ) : null} */}
          {/* 产品底部 */}
          <GoodFooter
            areaCode={area}
            locale={locale}
            LANG={LANG}
            productInfo={productInfo}
            goodDiscountFestival={GOODDISCOUNTFESTIVAL}
          />
          {/* <Script
            id="product-3d-script"
            defer
            type="module"
            src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"
          ></Script> */}
          <Script
            id="store-product-ld-json"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                {
                  "@context": "https://schema.org/",
                  "@type": "Product",
                  name: productInfo.name,
                  image: productInfo.image_list.map((item) => item.src),
                  description: productInfo.description,
                  offers: {
                    "@type": "Offer",
                    price: productInfo.comboList[0]?.areaInfo?.price ?? 99999,
                    priceCurrency:
                      productInfo.comboList[0]?.areaInfo?.currency ?? "USD",
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
