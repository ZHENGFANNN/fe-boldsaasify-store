import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // 做好的静态页（ISR 产物）存到 R2
  incrementalCache: r2IncrementalCache,
  // 刷新任务排队（用 Durable Object，随部署自动创建）
  queue: doQueue,
  // 记录“哪个页打了哪些标签”，支持后台改商品后只刷那一页（存 D1）
  tagCache: d1NextTagCache,
});
