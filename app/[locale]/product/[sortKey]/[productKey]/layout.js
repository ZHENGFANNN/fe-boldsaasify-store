/** @format */

import BaseLayout from "./components/BaseLayout";
import getConfigData from "../../../../utils/getConfigData";
import getProductDetail from "../../../../utils/getConfigData/getProductDetail";
import Script from "next/script";

import { formatCurrency } from "../../../../utils";

// 默认地区：整页静态生成时按 us 渲染（结构化数据/首屏价格），
// 客户端 BaseLayout 再按浏览器 area cookie 重算实际地区价。
const DEFAULT_AREA = "us";

/**
 * 获取数据
 * 不再读取 area cookie / user-agent —— 保持本路由可静态化（ISR）。
 * 商品详情走 getProductDetail（按 slug fetch + tag），与全站 config/language 解耦。
 */
async function getData({ locale, sortKey, productKey }) {
  const [config, productInfo] = await Promise.all([
    getConfigData({
      locale,
      configList: ["config", "language", "goodDiscountFestival"],
      languageNameSpace: [
        "store.product",
        "common.pay",
        "common.footer.sales_policy",
      ],
      configNameSpace: [
        "company.basic.company_name",
        "company.basic.customer_service",
      ],
    }),
    getProductDetail({ locale, sortKey, productKey }),
  ]);
  return { ...config, productInfo };
}

// 设置元信息
export async function generateMetadata({ params }) {
  const { locale, productKey, sortKey } = await params;
  const { CONFIG, productInfo } = await getData({ locale, sortKey, productKey });
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

export default async function Layout({ children, params }) {
  const { locale, sortKey, productKey } = await params;
  const { LANG, CONFIG, GOODDISCOUNTFESTIVAL, productInfo } = await getData({
    locale,
    sortKey,
    productKey,
  });

  // 结构化数据用默认地区(us)的首个套餐价；comboList 此时仍带完整 areaList。
  const firstCombo = productInfo?.comboList?.[0];
  const ldAreaInfo =
    firstCombo?.areaList?.find((a) => a.country_code === DEFAULT_AREA) ||
    firstCombo?.areaList?.[0] ||
    null;

  return (
    <BaseLayout
      locale={locale}
      area={DEFAULT_AREA}
      LANG={LANG}
      CONFIG={CONFIG}
      isMobile={false}
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
                  productInfo.description ||
                  productInfo.sellingList?.join(",") ||
                  productInfo.page_description ||
                  "",
                offers: {
                  "@type": "Offer",
                  price:
                    formatCurrency(
                      ldAreaInfo?.selling_price,
                      ldAreaInfo?.currency_unit
                    ) ?? 99999,
                  priceCurrency: ldAreaInfo?.currency ?? "USD",
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
