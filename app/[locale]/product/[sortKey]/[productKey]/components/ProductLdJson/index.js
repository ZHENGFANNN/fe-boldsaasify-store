import { getProductPage } from "@/config/Api/getProductPage";
import { getProductPricing } from "@/config/Api/getProductPricing";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { formatCurrency } from "@/utils";
import { pickCombo } from "@/utils/productPricing";
import Script from "next/script";

// JSON-LD 价格用默认 area=us（纯 SSG，不读 cookie，避免页面变动态）。
// 爬虫不执行客户端 JS，故此处价格仍需服务端取（直接 getProductPricing，
// 不经 applyProductPricing 合并进 productInfo）。
const DEFAULT_AREA = "us";

/**
 * 商品 JSON-LD（server component，纯静态，无 Suspense）。
 */
export default async function ProductLdJson({ locale, sortKey, productKey }) {
  const [{ productInfo }, pricing, CONFIG] = await Promise.all([
    getProductPage({ locale, sortKey, productKey }),
    getProductPricing({ locale, sortKey, productKey, area: DEFAULT_AREA }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] })
  ]);

  if (!productInfo?.key) {
    return null;
  }

  // 直接从定价结果里按默认 combo 取 areaInfo（不合并进 productInfo）。
  const defaultComboKey = pickCombo(productInfo?.comboList)?.key;
  const ldAreaInfo =
    (pricing?.combos || []).find((c) => c.comboKey === defaultComboKey)
      ?.areaInfo ||
    pricing?.combos?.[0]?.areaInfo ||
    null;
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
      priceCurrency: ldAreaInfo?.currency ?? "USD"
    },
    sku: `${companyName}:${productInfo.sort_key}:${productInfo.key}`,
    mpn: productInfo.key,
    brand: {
      "@type": "Brand",
      name: `${companyName}`
    }
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
