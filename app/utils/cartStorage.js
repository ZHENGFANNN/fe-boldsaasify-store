// store_shopping 购物车缓存读写工具。
//
// 购物车是纯客户端 localStorage（key: store_shopping），每行形如
//   { sortKey, productKey, comboKey, productNum, options, customize_data }
// 价格/库存不存本地，运行时按 area 实时取（见 cartClient.js）。
// GoodBtnList 里原有内联的加购合并逻辑，这里抽成公共函数供「买赠一起加购」复用，
// 合并判定与 GoodBtnList 完全一致（sortKey/productKey/comboKey/options/customize 全等则数量累加）。

const CART_KEY = "store_shopping";

// 变体 options 规范化：按 name 排序后 stringify，使去重与选项顺序无关。
export function normalizeOptionsKey(options) {
  let arr;
  if (typeof options === "object" && options !== null) {
    arr = Array.isArray(options) ? options : [];
  } else {
    try {
      arr = JSON.parse(options) || [];
    } catch {
      arr = [];
    }
  }
  const sorted = [...arr].sort((a, b) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? "")),
  );
  return JSON.stringify(sorted);
}

// 两行是否为「同一商品行」（可合并累加数量）。
function isSameRow(a, b) {
  return (
    a.sortKey === b.sortKey &&
    a.productKey === b.productKey &&
    a.comboKey === b.comboKey &&
    normalizeOptionsKey(a.options) === normalizeOptionsKey(b.options) &&
    JSON.stringify(a.customize_data || []) === JSON.stringify(b.customize_data || [])
  );
}

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCart(list) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(list));
}

// 把一行合并进列表：命中同行则累加数量，否则前插新行。
function mergeInto(list, line) {
  const idx = list.findIndex((r) => isSameRow(r, line));
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      productNum: Number(list[idx].productNum || 0) + Number(line.productNum || 0),
    };
  } else {
    list.unshift(line);
  }
  return list;
}

// 加购：把给定行合并进现有购物车（同行累加）。
export function pushCartLines(lines) {
  const list = readCart();
  lines.forEach((l) => mergeInto(list, l));
  writeCart(list);
}

// 立即购买：用给定行【覆盖】购物车缓存（内部先合并同行，避免重复行）。
export function replaceCartLines(lines) {
  const list = [];
  lines.forEach((l) => mergeInto(list, l));
  writeCart(list);
}
