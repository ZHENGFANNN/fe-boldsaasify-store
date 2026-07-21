/** @format */

import { notFound } from "next/navigation";
import BaseLayout from "./components/BaseLayout";
import { getProductPage } from "@/config/Api/getProductPage";
import { getProductOptions } from "@/config/Api/getProductOptions";
import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";

// 价格完全交客户端：layout 只产出无价的 productInfo 种子，
// 地区价格由 BaseLayout 挂载后对所有地区（含 us）拉取并合并。

// 商品详情页多语言/页面配置命名空间（各接口独立拉取，互不耦合）。
// store.order_info + common.other：商品页评论区就地复用账户端 ReviewModal（文案在
// store.order_info.review_*）与其取消/加载/重试提示（common.other.*），需一并加载，
// 否则弹窗在非 en 语言下整体退英文兜底。
const LANG_NAMESPACE = [
  "store.product",
  "store.order_info",
  "common.pay",
  "common.other",
  "common.footer.sales_policy"
];
const CONFIG_NAMESPACE = ["common.base", "setting.pay"];

export async function generateMetadata({ params }) {
  const { locale, productKey, sortKey } = await params;
  const [{ productInfo }, CONFIG] = await Promise.all([
    getProductPage({ locale, sortKey, productKey }),
    getRemoteConfig({ locale, nameSpace: CONFIG_NAMESPACE })
  ]);
  if (!productInfo?.key) {
    return {
      title: CONFIG?.["common.base"]?.company_name
    };
  }
  return {
    title: `${productInfo.page_title} - ${CONFIG["common.base"]?.company_name}`,
    description: productInfo.page_description,
    keywords: productInfo.page_keywords,
    metadataBase: new URL(productInfo.image_list[0].src),
    alternates: buildAlternates(`/product/${sortKey}/${productKey}`, locale),
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
  // 商品本身 / 选项树 / 多语言 / 页面配置 四路独立并发；价格不在服务端取。
  // 商品详情直接走 getProductPage，不再经 getConfigData 转发。
  // 定制字段随 getProductPage 一并下发（customizeFields），不再单独客户端拉。
  const [
    { productInfo: baseProductInfo, customizeFields },
    productOptions,
    LANG,
    CONFIG
  ] = await Promise.all([
    getProductPage({ locale, sortKey, productKey }),
    getProductOptions({ locale, sortKey, productKey }),
    getRemoteLanguage({ locale, nameSpace: LANG_NAMESPACE }),
    getRemoteConfig({ locale, nameSpace: CONFIG_NAMESPACE })
  ]);

  if (!baseProductInfo?.key) {
    notFound();
  }

  // 无价种子：价格（含 us）由客户端 BaseLayout 挂载后按真实 area 拉取并合并。
  return (
    <BaseLayout
      locale={locale}
      sortKey={sortKey}
      productKey={productKey}
      LANG={LANG}
      CONFIG={CONFIG}
      isMobile={false}
      baseProductInfo={baseProductInfo}
      productInfo={baseProductInfo}
      productOptions={productOptions}
      customizeFields={customizeFields}
    >
      {children}
    </BaseLayout>
  );
}
