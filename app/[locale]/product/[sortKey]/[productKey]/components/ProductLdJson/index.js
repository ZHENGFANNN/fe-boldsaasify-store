/** @format */

import getPricedProduct from "@/utils/getConfigData/getPricedProduct";
import { getProductPage } from "@/utils/getConfigData/getProductPage";
import { formatCurrency } from "@/utils";
import { pickCombo } from "@/utils/productPricing";
import Script from "next/script";

// JSON-LD 价格用默认 area=us（纯 SSG，不读 cookie，避免页面变动态）。
const DEFAULT_AREA = "us";

/**
 * 商品 JSON-LD（server component，纯静态，无 Suspense）。
 */
export default async function ProductLdJson({ locale, sortKey, productKey }) {
  const [{ CONFIG, productInfo }, pricedProductInfo] = await Promise.all([
    getProductPage({ locale, sortKey, productKey }),
    getPricedProduct({ locale, sortKey, productKey, area: DEFAULT_AREA }),
  ]);

  if (!productInfo?.key) {
    return null;
  }

  const pricedCombo = pickCombo(pricedProductInfo?.comboList);
  const ldAreaInfo = pricedCombo?.areaInfo || null;
  const companyName = CONFIG["common.base"]?.company_name;

  const ldJson = {
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
        formatCurrency(ldAreaInfo?.selling_price, ldAreaInfo?.currency_unit) ??
        99999,
      priceCurrency: ldAreaInfo?.currency ?? "USD",
    },
    sku: `${companyName}:${productInfo.sort_key}:${productInfo.key}`,
    mpn: productInfo.key,
    brand: {
      "@type": "Brand",
      name: `${companyName}`,
    },
  };

  return (
    <Script
      id="store-product-ld-json"
      type="application/ld+json"
      strategy="afterInteractive"
    >
      {`${JSON.stringify(ldJson, null, "\t")}`}
    </Script>
  );
}
