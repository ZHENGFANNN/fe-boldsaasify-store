/**
 * 公共评论组件集 —— 商品页评论模块与账户端评价列表/弹窗共用。
 *   import { StarRating, ReviewCard, ReviewList, Pagination } from "@/components/Review";
 *
 * - StarRating  星级展示（支持小数）/ 输入（打分），独立可复用
 * - ReviewCard  单条评论卡（脱敏用户名 + 星级 + 日期 + 内容 + 媒体 + 运营回复）
 *               媒体缩略图 + 点击左右切换预览走通用 @/components/PreviewMediaList
 * - ReviewList  列表容器（loading / error / empty 三态）
 * - Pagination  行业标准页码分页器
 */

export { default as StarRating } from "./StarRating";
export { default as ReviewCard } from "./ReviewCard";
export { default as ReviewList } from "./ReviewList";
export { default as Pagination } from "./Pagination";
