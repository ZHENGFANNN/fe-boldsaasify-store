"use client";

// ============================================================
// 售后创建向导所有 atom / 派生 / 纯函数 helper。
// 页面级 <Provider>（在 CreateWizard 挂载）保证：atom 只在 create 页
// 内活跃，路由切走自动回收。
// ============================================================

import { atom } from "jotai";
import { fillOssImage } from "@/utils";

// ---------- 订单行字段大小写容错（后端原始 order_list 行为大写字段） ----------
export const rowName = (r) => r?.Name ?? r?.name ?? "";
export const rowImage = (r) => r?.Image ?? r?.image ?? "";
export const rowCombo = (r) => r?.ComboName ?? r?.comboName ?? "";
export const rowProductKey = (r) => r?.ProductKey ?? r?.productKey ?? "";
export const rowSortKey = (r) => r?.SortKey ?? r?.sortKey ?? "";

// 全语言全商品：按当前 language 过滤 + 按 sort_key 聚合（复刻 getRemoteProductList 思路）
export function buildProductGroups(list, locale) {
  const byLang = {};
  (list || []).forEach((item) => {
    (byLang[item.language] ||= []).push(item);
  });
  const localeList = byLang[locale] || byLang["en"] || [];
  const map = {};
  localeList.forEach((item) => {
    const sk = item.sort_key;
    const sortInfo = item.goodSort?.[0] || {};
    if (!map[sk]) {
      map[sk] = {
        sort_key: sk,
        name: sortInfo.name || sk,
        weight: sortInfo.weight || 0,
        products: [],
      };
    }
    map[sk].products.push({
      key: item.key,
      sort_key: sk,
      name: item.name,
      image: fillOssImage(item.image_list?.[0]?.src || ""),
    });
  });
  return Object.values(map).sort((a, b) => (b.weight || 0) - (a.weight || 0));
}

// ---------- Step 1: 商品/订单 ----------
export const methodAtom = atom("order"); // "order" | "product"
export const selectedOrderNumberAtom = atom("");
export const selectedRowIndexAtom = atom(-1);
export const selectedProductKeyAtom = atom("");
export const purchaseTimeAtom = atom("");
export const purchaseChannelAtom = atom("");
export const purchaseOrderNoAtom = atom("");

// ---------- Step 2: 问题 ----------
export const afterTypeAtom = atom("repair"); // 默认「维修」；与 CreateWizard AFTER_SALE_TYPES 首项对齐
export const descriptionAtom = atom("");
export const mediaListAtom = atom([]);
// media item: {localId, file, name, size, type, previewUrl, url, uploading}

// ---------- Step 3: 联系 ----------
export const contactEmailAtom = atom("");
export const contactPhoneAtom = atom("");
export const agreePrivacyAtom = atom(false);

// ---------- Remote data（手动 loading，与仓库现有 client fetch 惯例一致） ----------
export const ordersAtom = atom([]);
export const ordersLoadingAtom = atom(false);
export const productGroupsAtom = atom([]);
export const productsLoadingAtom = atom(false);
export const productsLoadedAtom = atom(false);

// ---------- UI 状态 ----------
export const activeStepAtom = atom(1); // 1 | 2 | 3
export const submittingAtom = atom(false);
export const submittedServiceNoAtom = atom(null); // null=未提交，""/string=提交成功

// ---------- 派生：选中订单 / 选中订单行 / 选中产品 ----------
export const selectedOrderAtom = atom((get) => {
  const list = get(ordersAtom);
  const no = get(selectedOrderNumberAtom);
  return (
    list.find((o) => String(o.order_number) === String(no)) || null
  );
});

export const selectedRowAtom = atom((get) => {
  const order = get(selectedOrderAtom);
  const index = get(selectedRowIndexAtom);
  return order?.order_list?.[index] ?? null;
});

export const selectedProductAtom = atom((get) => {
  const groups = get(productGroupsAtom);
  const key = get(selectedProductKeyAtom);
  for (const g of groups) {
    const p = g.products.find((x) => x.key === key);
    if (p) return p;
  }
  return null;
});

// 归一化的产品信息（提交所需字段——三字段与后端 createAfterService 契约一致）
export const productPayloadAtom = atom((get) => {
  const method = get(methodAtom);
  if (method === "order") {
    const row = get(selectedRowAtom);
    if (!row) return null;
    return {
      product_name: rowName(row),
      product_key: rowProductKey(row),
      sort_key: rowSortKey(row),
    };
  }
  const product = get(selectedProductAtom);
  if (!product) return null;
  return {
    product_name: product.name,
    product_key: product.key,
    sort_key: product.sort_key,
  };
});

// ---------- 派生：各步完成态 ----------
export const step1DoneAtom = atom((get) => {
  const method = get(methodAtom);
  if (method === "order") {
    return !!(get(selectedOrderAtom) && get(selectedRowAtom));
  }
  return !!(
    get(selectedProductAtom) &&
    get(purchaseTimeAtom) &&
    get(purchaseChannelAtom).trim()
  );
});

export const step2DoneAtom = atom(
  (get) => !!(get(afterTypeAtom) && get(descriptionAtom).trim())
);

// 上传中媒体数量：ContactModule 提交前校验
export const uploadingCountAtom = atom(
  (get) => get(mediaListAtom).filter((m) => m.uploading).length
);
