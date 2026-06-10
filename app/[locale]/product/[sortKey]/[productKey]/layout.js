/** @format */

import BaseLayout from "./components/BaseLayout";
import { getProductPage } from "../../../../utils/getConfigData/getProductPage";
import { fetchProductPricing } from "../../../../utils/productPricing";
import Script from "next/script";

import { formatCurrency } from "../../../../utils";

const DEFAULT_AREA = "us";

async function getData({ locale, sortKey, productKey }) {
  return getProductPage({ locale, sortKey, productKey });
}

export async function generateMetadata({ params }) {
  const { locale, productKey, sortKey } = await params;
  const { CONFIG, productInfo } = await getData({ locale, sortKey, productKey });
  if (productInfo) {
    return {
      title: `${productInfo.page_title} - ${CONFIG["common.base"]?.company_name}`,
      description: productInfo.page_description,
      keywords: productInfo.page_keywords,
      metadataBase: new URL(productInfo.image_list[0].src),
      openGraph: {
        title: `${productInfo.page_title} - ${CONFIG["common.base"]?.company_name}`,
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
      title: CONFIG["common.base"]?.company_name,
    };
  }
}

export default async function Layout({ children, params }) {
  const { locale, sortKey, productKey } = await params;
  const { LANG, CONFIG, productInfo } = await getData({
    locale,
    sortKey,
    productKey,
  });

  let ldAreaInfo = null;
  if (productInfo?.key) {
    try {
      const pricing = await fetchProductPricing({
        sortKey,
        productKey,
        area: DEFAULT_AREA,
        language: locale,
      });
      ldAreaInfo = pricing?.combos?.[0]?.areaInfo || null;
    } catch {
      ldAreaInfo = null;
    }
  }

  return (
    <BaseLayout
      locale={locale}
      sortKey={sortKey}
      productKey={productKey}
      area={DEFAULT_AREA}
      LANG={LANG}
      CONFIG={CONFIG}
      isMobile={false}
      productInfo={productInfo}
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
                sku: `${CONFIG["common.base"]?.company_name}:${productInfo.sort_key}:${productInfo.key}`,
                mpn: productInfo.key,
                brand: {
                  "@type": "Brand",
                  name: `${CONFIG["common.base"]?.company_name}`,
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
