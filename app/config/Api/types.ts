/** @format */

// ============================================================
// app/config/Api 共享类型（务实型：入参精确、关键结构定义 interface，
// 后端透传的大对象用宽松类型）。
// ============================================================

/** 通用 locale 入参 */
export interface LocaleArg {
  locale: string;
}

/** 商品 slug 路径项（getProductPaths） */
export interface ProductPathItem {
  locale: string;
  sortKey: string;
  productKey: string;
}

/** 博客 slug 路径项（getBlogPaths） */
export interface BlogPathItem {
  locale: string;
  sortKey: string;
  blogKey: string;
}

/** 购物车定位三元组（getCartByKeys 入参 items） */
export interface CartItemKey {
  sortKey: string;
  productKey: string;
  comboKey: string;
}

/** getCartByKeys 入参 */
export interface CartByKeysArg {
  area?: string;
  language?: string;
  items: CartItemKey[];
}

/** 地区价格信息（后端 erp_countries_config，按 area 解析） */
export interface AreaInfo {
  currency?: string;
  currency_symbol?: string;
  currency_unit?: number;
  product_price?: number;
  selling_price?: number;
  product_discount?: number;
  stock?: boolean;
  country_code?: string;
  [key: string]: unknown;
}

/** 购物车行（getCartByKeys 返回项） */
export interface CartLine {
  id: number;
  comboName: string;
  comboKey: string;
  name: string;
  image: string;
  sortKey: string;
  productKey: string;
  areaInfo: AreaInfo;
}

/** 博客 banner 项 */
export interface BlogBannerItem {
  image: string;
  title: string;
  key: string;
  sort_key: string;
}

/** 博客分类（含文章列表） */
export interface BlogSort {
  key: string;
  name: string;
  weight: number;
  blogList: BlogArticleCard[];
}

/** 博客文章卡片（列表用精简结构） */
export interface BlogArticleCard {
  image: string;
  title: string;
  key: string;
  sort_key: string;
  updated_time?: string;
}

/** 轻量分类导航项 */
export interface CategoryNav {
  key: string;
  name: string;
  weight: number;
}

/** getBlogCategory 返回 */
export interface BlogCategoryResult {
  category: CategoryNav | null;
  blogList: BlogArticleCard[];
  categories: CategoryNav[];
}

/** 商品卡片（列表用精简结构，保留 comboList 供客户端选地区价） */
export interface SimpleProduct {
  key: string;
  sort_key: string;
  name: string;
  description?: string;
  image?: string;
  image_list?: unknown;
  image_scenes?: string;
  reviewScore?: number;
  reviewsNum?: number;
  reviews_score?: number;
  reviews_num?: number;
  weight?: number;
  comboList: unknown[];
  tags?: string[];
}

/** 商品分类（含 goodList，首页用） */
export interface ProductSort {
  key: string;
  name: string;
  description?: string;
  image_src?: string;
  weight?: number;
  goodList: SimpleProduct[];
}
