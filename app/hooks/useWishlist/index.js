/** @format */

// ============================================================
// 收藏 / 愿望清单 store（zustand）
//
// 登录态判定：cookie `token`（与 @/request 拦截器一致；有 token 即视为登录）。
//   - 游客：仅 localStorage 持久化（key `wishlist`）。
//   - 登录：init 时以后端为准；并在「登录瞬间」把本地游客收藏逐条 push 到后端
//           （saveCollection 幂等），合并完成后再读后端列表覆盖本地。
//
// SSR 安全：store 本身不读 localStorage（避免 server/client 初值不一致导致 hydration
//   mismatch）。所有对 localStorage / cookie 的读取都发生在 init()（仅客户端 useEffect 里调）。
//
// item 形状：{ sortKey, productKey }。唯一键 `${sortKey}:${productKey}`。
// ============================================================

import { create } from "zustand";
import Cookies from "js-cookie";

import {
  getCollections,
  saveCollection,
  deleteCollection,
} from "@/[locale]/wishlist/api";

const STORAGE_KEY = "wishlist";

const keyOf = (sortKey, productKey) => `${sortKey}:${productKey}`;

function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return !!Cookies.get("token");
}

// ---------- localStorage 读写（仅客户端调用） ----------
function readLocal() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 仅保留形状合法的元素，做一次去重。
    const seen = new Set();
    const out = [];
    arr.forEach((it) => {
      if (!it || !it.sortKey || !it.productKey) return;
      const k = keyOf(it.sortKey, it.productKey);
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ sortKey: it.sortKey, productKey: it.productKey });
    });
    return out;
  } catch {
    return [];
  }
}

function writeLocal(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* 配额满 / 隐私模式：忽略，内存态仍可用 */
  }
}

const useWishlist = create((set, get) => ({
  // 收藏项数组：[{ sortKey, productKey }]
  items: [],
  // init 是否完成（首屏未就绪时按钮不闪选中态）
  ready: false,
  // 防止并发/重复 init
  _initing: false,

  // 收藏总数：组件直接用 useWishlist((s) => s.items.length) 订阅（保持响应式）。
  // 此方法供非响应式场景一次性读取。
  count() {
    return get().items.length;
  },

  has(sortKey, productKey) {
    const k = keyOf(sortKey, productKey);
    return get().items.some((it) => keyOf(it.sortKey, it.productKey) === k);
  },

  // 初始化：游客读本地；登录则合并本地→后端，再以后端为准。
  async init() {
    if (get().ready || get()._initing) return;
    set({ _initing: true });

    if (!isLoggedIn()) {
      // 游客：本地态
      set({ items: readLocal(), ready: true, _initing: false });
      return;
    }

    // 登录：先把本地游客收藏合并到后端（逐条幂等 save），再拉后端列表。
    const local = readLocal();
    try {
      // 逐条合并（幂等：后端已存在不会重复）。失败不阻塞后续读取。
      await Promise.all(
        local.map((it) =>
          saveCollection({
            sortKey: it.sortKey,
            productKey: it.productKey,
          }).catch(() => null)
        )
      );
    } catch {
      /* 合并失败：忽略，下面以后端列表为准 */
    }

    let remote = [];
    try {
      const res = await getCollections();
      const list = res?.data?.list || [];
      remote = list
        .filter((it) => it && it.sortKey && it.productKey)
        .map((it) => ({ sortKey: it.sortKey, productKey: it.productKey }));
    } catch {
      // 后端不可用：退回本地态，避免登录用户看到空清单。
      remote = local;
    }

    // 登录后以后端为准；清掉本地游客缓存（已合并入后端）。
    writeLocal([]);
    set({ items: remote, ready: true, _initing: false });
  },

  // 切换收藏：已存在→删，否则→加。乐观更新本地，接口失败回滚。
  async toggle({ sortKey, productKey }) {
    if (!sortKey || !productKey) return;
    const k = keyOf(sortKey, productKey);
    const exists = get().items.some(
      (it) => keyOf(it.sortKey, it.productKey) === k
    );
    const logged = isLoggedIn();

    if (exists) {
      // ---- 删除 ----
      const prev = get().items;
      const next = prev.filter((it) => keyOf(it.sortKey, it.productKey) !== k);
      set({ items: next });
      if (logged) {
        try {
          await deleteCollection({ sortKey, productKey });
        } catch {
          set({ items: prev }); // 回滚
        }
      } else {
        writeLocal(next);
      }
    } else {
      // ---- 新增 ----
      const prev = get().items;
      const next = [...prev, { sortKey, productKey }];
      set({ items: next });
      if (logged) {
        try {
          await saveCollection({ sortKey, productKey });
        } catch {
          set({ items: prev }); // 回滚
        }
      } else {
        writeLocal(next);
      }
    }
  },
}));

export default useWishlist;
