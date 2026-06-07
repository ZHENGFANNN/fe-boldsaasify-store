/** @format */

// 产品详情：按 slug 从后端实时拉取单个商品，并打上缓存 tag。
// 这样后台改某个商品后，只需 revalidateTag('product:sortKey:productKey')
// 就能让该商品页在下次访问时重新生成，无需全站重建。
//
// 注意：这里返回的是「未按地区过滤」的完整商品（comboList[].areaList 全保留）。
// 按地区选价(areaInfo)的逻辑下沉到客户端 BaseLayout，以便整页可静态缓存。

const HOST = process.env.NEXT_PUBLIC_HOST;

// 兜底重新验证周期（秒）。真正的实时性靠 on-demand 的 revalidateTag，
// 这个长周期只是防止 tag 漏触发时数据长期陈旧。
const REVALIDATE_FALLBACK = 86400; // 24h

// 与 script/fetch-product.js 的 handleAssociateProductList 保持一致：
// 关联商品只保留首个套餐的 areaList（放到 comboItem.areaList），其余精简。
function handleAssociateProductList(productList) {
  if (Array.isArray(productList) && productList.length > 0) {
    return productList.map(
      ({
        reviewsList,
        image_list,
        reviews_num,
        reviews_score,
        comboList,
        ...item
      }) => {
        const totalScore = reviewsList?.reduce((pre, cur) => pre + cur.score, 0);
        item.reviewScore = totalScore / reviewsList?.length || reviews_score;
        item.reviewsNum = reviewsList?.length || reviews_num;
        item.image = image_list?.[0]?.src;
        const { areaList = {} } = comboList?.[0] || {};
        item.comboItem = { areaList };
        return item;
      }
    );
  }
  return [];
}

// 把后端原始商品对象整形成与物化 JSON 同形的详情对象。
// （等价于 fetch-product.js 里 productMap[`product:sort:key`] 的构造）
function buildDetail(item) {
  const { goodSort = [], associateProduct, ...rest } = item;
  return {
    ...rest,
    goodSort: (goodSort || []).map((g) => ({ enabled: g?.enabled })),
    associateProduct: handleAssociateProductList(associateProduct),
  };
}

export default async function getProductDetail({ locale, sortKey, productKey }) {
  if (!HOST) {
    console.error("getProductDetail: NEXT_PUBLIC_HOST 未配置");
    return null;
  }
  const tag = `product:${sortKey}:${productKey}`;
  const url =
    `${HOST}/config/getProductDetail` +
    `?sortKey=${encodeURIComponent(sortKey)}` +
    `&productKey=${encodeURIComponent(productKey)}` +
    `&language=${encodeURIComponent(locale)}`;

  let res;
  try {
    res = await fetch(url, {
      next: { tags: [tag], revalidate: REVALIDATE_FALLBACK },
    });
  } catch (err) {
    console.error(`getProductDetail fetch 失败 ${tag}:`, err?.message);
    return null;
  }
  if (!res.ok) {
    if (res.status !== 404) {
      console.error(`getProductDetail 异常状态 ${tag}: ${res.status}`);
    }
    return null;
  }
  const json = await res.json().catch(() => null);
  // 后端响应封套：{ data: <商品对象> }（沿用 /config/getProduct 的 res.data 习惯）
  const item = json?.data ?? null;
  if (!item || !item.key) {
    return null;
  }
  return buildDetail(item);
}
