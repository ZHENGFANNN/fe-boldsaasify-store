/** @format */

import Script from "next/script";
import { formatCurrency } from "@/utils";
import getProductsPricing from "@/config/Api/getProductsPricing";
import { defaultArea as DEFAULT_AREA } from "@/config/marketSettings";

// SSG 阶段以默认 area 价批量取齐分类页商品定价，逐商品输出 JSON-LD 给爬虫。
// 默认地区跟随 ERP「默认市场」配置，逐级兜底到 us（见 marketSettings.resolveDefaultArea）。
// 客户端实际显示走 CategoryList 的 useArea + 批量取价路径（不影响此处 SEO）。

function pickAreaInfo(item) {
  const combos = Array.isArray(item?.combos) ? item.combos : [];
  for (const c of combos) {
    if (c?.areaInfo) return c.areaInfo;
  }
  return null;
}

/**
 * 分类页商品 JSON-LD（server component，纯静态）。
 * @param goodList     当前分类的商品数组（与 CategoryList 入参同源）。
 * @param locale       当前 locale，用于后端语言回退。
 * @param companyName  CONFIG["common.base"]?.company_name。
 */
export default async function CategoryListLdJson({
  goodList,
  locale,
  companyName,
}) {
  if (!Array.isArray(goodList) || goodList.length === 0) return null;

  const products = goodList.filter((p) => p?.sort_key && p?.key);
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
              formatCurrency(areaInfo?.product_price, areaInfo?.currency_unit) ??
              99999,
            priceCurrency: areaInfo?.currency ?? "USD",
          },
          sku: companyName,
          mpn: product.key,
          brand: {
            "@type": "Brand",
            name: `${companyName}`,
          },
        };
        return (
          <Script
            key={idx}
            id={`store-category-ld-json-${idx}`}
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
