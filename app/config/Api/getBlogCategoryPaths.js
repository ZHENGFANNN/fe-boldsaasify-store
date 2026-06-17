/** @format */

// ============================================================
// 远程数据 API · GET ${HOST}/config/getBlogCategoryPaths
// app/config/Api 远程数据接口层：运行时从后端拉取数据。
// ============================================================

const HOST = process.env.NEXT_PUBLIC_HOST;

/**
 * 构建期枚举所有 (locale, sortKey)，供分类页 generateStaticParams 预生成。
 * 接口失败时返回空数组，避免开发环境网络抖动导致整页 500；
 * 未列出的 sortKey 仍按需生成（dynamicParams 默认 true）。
 */
export async function getBlogCategoryPaths() {
  if (!HOST) {
    console.error("getBlogCategoryPaths: NEXT_PUBLIC_HOST 未配置");
    return [];
  }

  try {
    const res = await fetch(`${HOST}/config/getBlogCategoryPaths`);
    if (!res.ok) {
      console.error(`getBlogCategoryPaths 失败: HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    return (json?.data?.list || []).map(({ locale, sortKey }) => ({
      locale,
      sortKey,
    }));
  } catch (err) {
    console.error("getBlogCategoryPaths fetch 失败:", err?.message);
    return [];
  }
}

export default getBlogCategoryPaths;
