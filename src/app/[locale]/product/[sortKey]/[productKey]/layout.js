/** @format */

import BaseLayout from "./components/BaseLayout";
import getConfigData from "@/utils/getConfigData";
import { cookies, headers } from "next/headers";
import Script from "next/script";

import { isUserMobile } from "@/utils";
import { formatCurrency } from "@/utils";

// 匹配产品信息
async function getProductInfo({ productList, productKey }) {
  return productList.find((item) => {
    return item.key === productKey;
  });
}
// 获取关联产品
async function getAssociateProduct({ productInfo, area }) {
  if (!productInfo?.associateProduct) return [];

  let newAssociateProduct = productInfo.associateProduct.filter(
    (item) => item.key !== productInfo.key
  );
  newAssociateProduct = newAssociateProduct.map(
    ({
      reviewsList,
      image_list,
      comboList,
      reviews_num,
      reviews_score,
      ...item
    }) => {
      let areaInfo = null;
      comboList.find((combo) => {
        combo.areaList.find((area_item) => {
          if (area_item.country_code === area) {
            areaInfo = area_item;
          }
          return area_item.country_code === area;
        });
        return areaInfo?.stock;
      });
      const totalScore = reviewsList.reduce((pre, cur) => pre + cur.score, 0);
      item.reviewScore = totalScore / reviewsList.length || reviews_score;
      item.reviewsNum = reviewsList.length || reviews_num;
      item.image = image_list[0].src;
      item.areaInfo = areaInfo;
      return item;
    }
  );
  return newAssociateProduct;
}
/**
 * 获取数据
 */
async function getData({
  productKey,
  locale,
  area,
  configList,
  languageNameSpace,
  configNameSpace,
}) {
  const result = await getConfigData({
    locale,
    area,
    configList,
    languageNameSpace,
    configNameSpace,
  });
  // 获取产品信息
  result.productInfo = await getProductInfo({
    productList: result.GOODLIST,
    productKey,
  });

  if (result.productInfo) {
    const [associateProduct] = await Promise.all([
      // 获取关联产品
      await getAssociateProduct({
        productInfo: result.productInfo,
        area,
      }),
    ]);
    result.productInfo.associateProduct = associateProduct;
  }
  return result;
}

// 设置元信息
export async function generateMetadata({ params: { locale, productKey } }) {
  const area = cookies().get("area")?.value || "us";
  const { CONFIG, GOODLIST } = await getConfigData({
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
      title: `${productInfo.page_title} - ${CONFIG["company.basic.company_name"]}`,
      description: productInfo.page_description,
      keywords: productInfo.page_keywords,
      metadataBase: new URL(productInfo.image_list[0].src),
      openGraph: {
        title: `${productInfo.page_title} - ${CONFIG["company.basic.company_name"]}`,
        description: productInfo.page_description,
        images: productInfo.image_list.map((item) => {
          return {
            url: item.src,
            width: 300,
            height: 300,
          };
        }),
      },
    };
  } else {
    return {
      title: CONFIG["company.basic.company_name"],
    };
  }
}

export default async function Layout({
  children,
  params: { locale, productKey },
}) {
  const area = cookies().get("area")?.value || "us";
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = isUserMobile(userAgent);
  const { LANG, CONFIG, GOODDISCOUNTFESTIVAL, productInfo } = await getData({
    productKey,
    area,
    locale,
    configList: ["config", "language", "good", "goodDiscountFestival"],
    languageNameSpace: ["store.product", "common.nav.sales_policy"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
    ],
  });
  return (
    <BaseLayout
      locale={locale}
      area={area}
      LANG={LANG}
      CONFIG={CONFIG}
      isMobile={isMobile}
      productInfo={productInfo}
      goodDiscountFestival={GOODDISCOUNTFESTIVAL}
    >
      {children}
      {productInfo ? (
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
                description:
                  productInfo.description || productInfo.sellingList.join(","),
                offers: {
                  "@type": "Offer",
                  price:
                    formatCurrency(
                      productInfo.comboList[0]?.areaInfo?.selling_price,
                      productInfo.comboList[0]?.areaInfo?.currency_unit
                    ) ?? 99999,
                  priceCurrency:
                    productInfo.comboList[0]?.areaInfo?.currency ?? "USD",
                },
                sku: `${CONFIG["company.basic.company_name"]}:${productInfo.sort_key}:${productInfo.key}`,
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
      ) : null}
    </BaseLayout>
  );
}
