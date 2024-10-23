/** @format */

import BaseLayout from "./components/BaseLayout";
import getConfigData from "@/utils/getConfigData";
import { cookies, headers } from "next/headers";
import Script from "next/script";

import { isUserMobile } from "@/utils";
import { formatCurrency } from "@/utils";

/**
 * 获取数据
 */
async function getData({ locale, area, sortKey, productKey }) {
  const { PRODUCT, ...result } = await getConfigData({
    locale,
    area,
    configList: ["config", "language", "product", "goodDiscountFestival"],
    productNameSpace: [`product:${sortKey}:${productKey}`],
    languageNameSpace: ["store.product", "common.nav.sales_policy"],
    configNameSpace: [
      "company.basic.company_name",
      "company.basic.customer_service",
    ],
  });
  result.productInfo = PRODUCT[`product:${sortKey}:${productKey}`];
  return result;
}

// 设置元信息
export async function generateMetadata({ params }) {
  const { locale, productKey, sortKey } = await params;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const { CONFIG, productInfo } = await getData({
    area,
    locale,
    sortKey,
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

export default async function Layout({ children, params }) {
  const { locale, sortKey, productKey } = await params;
  const cookieStore = await cookies();
  const area = cookieStore.get("area")?.value || "us";
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = isUserMobile(userAgent);
  const { LANG, CONFIG, GOODDISCOUNTFESTIVAL, productInfo } = await getData({
    area,
    locale,
    sortKey,
    productKey,
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
