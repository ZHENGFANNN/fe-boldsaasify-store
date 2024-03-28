import BaseLayout from "./components/BaseLayout";
import getConfigDataV2 from "@/utils/getConfigDataV2";
import { cookies, headers } from "next/headers";
import Script from "next/script";

import { isUserMobile } from "@/utils";
import formatCurrency from "@/utils/formatCurrency";
import NotFound from "./components/NotFound";

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
      const areaInfo = comboList[0]?.areaList.find((item) => {
        return item.country_code === area;
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
async function getData({ productKey, locale, area, configList }) {
  const result = await getConfigDataV2({ locale, area, configList });
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
  });

  if (!productInfo) return <NotFound LANG={LANG} />;

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
                    productInfo.comboList[0]?.areaInfo?.selling_price
                  ) ?? 99999,
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
    </BaseLayout>
  );
}
