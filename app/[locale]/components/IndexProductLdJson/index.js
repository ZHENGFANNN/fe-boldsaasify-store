/** @format */

import Script from "next/script";
import { formatCurrency } from "@/utils";
import getProductsPricing from "@/config/Api/getProductsPricing";
import { defaultArea as DEFAULT_AREA } from "@/config/marketSettings";

// SSG 阶段以默认 area 价批量取齐首页商品定价，逐商品输出 JSON-LD 给爬虫。
// 默认地区跟随 ERP「默认市场」配置，逐级兜底到 us（见 marketSettings.resolveDefaultArea）。
// 客户端实际显示走 IndexProductList 的 useArea + 批量取价路径。

function pickAreaInfo(item) {
  const combos = Array.isArray(item?.combos) ? item.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

/**
 * 首页商品 JSON-LD（server component，纯静态）。
 * @param goodSortList 同 IndexProductList，源自 getRemoteProductList。
 * @param locale       当前 locale，用于后端语言回退。
 * @param companyName  CONFIG["common.base"]?.company_name，作为 sku/brand 名称。
 */
export default async function IndexProductLdJson({
  goodSortList,
  locale,
  companyName,
}) {
  if (!Array.isArray(goodSortList) || goodSortList.length === 0) return null;

  const products = [];
  goodSortList.forEach((sort) => {
    (sort.goodList || []).forEach((p) => {
      if (p?.sort_key && p?.key) products.push(p);
    });
  });
  if (products.length === 0) return null;

  const pricing = await getProductsPricing({
    area: DEFAULT_AREA,
    locale,
    keys: products.map((p) => ({ sortKey: p.sort_key, productKey: p.key })),
  });
  const map = {};
  (pricing?.list || []).forEach((item) => {
    map[`${item.sortKey}:${item.productKey}`] = item;
  });

  return (
    <>
      {products.map((product, idx) => {
        const areaInfo = pickAreaInfo(map[`${product.sort_key}:${product.key}`]);
        const ldJson = {
          "@context": "https://schema.org/",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.image_list,
          offers: {
            "@type": "Offer",
            price:
              formatCurrency(areaInfo?.selling_price, areaInfo?.currency_unit) ??
              99999,
            priceCurrency: areaInfo?.currency ?? "USD",
          },
          sku: companyName,
          mpn: product.key,
          brand: {
            "@type": "Brand",
            name: `${companyName}`,
          },
          review: {
            "@type": " Organization",
            reviewRating: {
              "@type": "Rating",
              ratingValue: 5,
              bestRating: product.reviewScore || 4.8,
            },
            author: {
              "@type": "Organization",
              name: `${companyName}`,
            },
          },
        };
        return (
          <Script
            key={idx}
            id={`store-index-ld-json-${idx}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(ldJson, null, "\t"),
            }}
          />
        );
      })}
    </>
  );
}
