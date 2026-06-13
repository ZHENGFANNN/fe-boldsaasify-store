/** @format */

import { notFound } from "next/navigation";
import BaseLayout from "./components/BaseLayout";
import { getProductPage } from "@/config/Api/getProductPage";
import getPricedProduct from "../../../../utils/getConfigData/getPricedProduct";

// 首屏统一用默认 area=us 价格做纯 SSG 预渲染（不读 cookie，避免动态/流式）。
// 非 us 地区的价格差异由客户端 BaseLayout 挂载后补差。
const DEFAULT_AREA = "us";

export async function generateMetadata({ params }) {
  const { locale, productKey, sortKey } = await params;
  const productPageData = await getProductPage({ locale, sortKey, productKey });
  const { CONFIG, productInfo } = productPageData;
  if (!productInfo?.key) {
    return {
      title: CONFIG?.["common.base"]?.company_name,
    };
  }
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
          height: 300
        };
      })
    }
  };
}

export default async function Layout({ children, params }) {
  const { locale, sortKey, productKey } = await params;
  // CONFIG/LANG 走 getProductPage；首屏价格用默认 area=us 的 getPricedProduct。
  const [productPageData, pricedProductInfo] = await Promise.all([
    getProductPage({ locale, sortKey, productKey }),
    getPricedProduct({ locale, sortKey, productKey, area: DEFAULT_AREA }),
  ]);
  const { LANG, CONFIG, productInfo: baseProductInfo } = productPageData;

  if (!baseProductInfo?.key) {
    notFound();
  }

  // 带 us 价格（areaInfo）的商品对象作为首屏种子；拉价失败则退回无价 baseProductInfo。
  const seedProductInfo = pricedProductInfo ?? baseProductInfo;

  return (
    <BaseLayout
      locale={locale}
      sortKey={sortKey}
      productKey={productKey}
      LANG={LANG}
      CONFIG={CONFIG}
      isMobile={false}
      baseProductInfo={seedProductInfo}
      productInfo={seedProductInfo}
    >
      {children}
    </BaseLayout>
  );
}
