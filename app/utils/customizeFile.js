/**
 * 商品定制字段「文件上传」相关工具：
 *   - 上传 accept 映射（按运营配置的 file_type 限制可选文件）
 *   - 已上传文件的媒体类型判断（图片/视频/其他，用于点击预览分流）
 *   - 客户端上传校验（按 file_type 拦截不匹配的文件）
 *
 * 判类型优先看后端返回的 type（上传接口返回 image|video|file），
 * 再退回按扩展名推断（后端 type 粒度有限，展示侧更可靠）。
 */

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"];
const VIDEO_EXT = ["mp4", "mov", "webm", "m4v", "ogv", "ogg", "avi", "mkv"];

function extOf(nameOrUrl) {
  const clean = String(nameOrUrl || "").split("?")[0].split("#")[0];
  const i = clean.lastIndexOf(".");
  return i >= 0 ? clean.slice(i + 1).toLowerCase() : "";
}

// 已上传文件的媒体类型："image" | "video" | "other"。
// file 可能是浏览器 File（type=MIME）或展示用 {url,name,type}（type=image|video|file）。
export function mediaKindOf(file) {
  if (!file) return "other";
  const t = String(file.type || "").toLowerCase();
  if (t === "image" || t.startsWith("image/")) return "image";
  if (t === "video" || t.startsWith("video/")) return "video";
  const ext = extOf(file.name || file.url);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  return "other";
}

// file_type → <input accept>。不限返回 undefined（不加 accept 属性）。
export function acceptForFileType(fileType) {
  switch (fileType) {
    case "image":
      return "image/*";
    case "video":
      return "video/*";
    case "zip":
      return ".zip,.rar,application/zip,application/x-zip-compressed,application/x-rar-compressed";
    default:
      return undefined;
  }
}

// 客户端上传校验：选中的浏览器 File 是否符合 file_type 限制。
export function isFileAllowedForType(file, fileType) {
  if (!fileType) return true; // 不限
  const ext = extOf(file?.name);
  const t = String(file?.type || "").toLowerCase();
  if (fileType === "image") return t.startsWith("image/") || IMAGE_EXT.includes(ext);
  if (fileType === "video") return t.startsWith("video/") || VIDEO_EXT.includes(ext);
  if (fileType === "zip") return ["zip", "rar"].includes(ext) || t.includes("zip") || t.includes("rar");
  return true;
}

// file_type → 校验失败时的中文提示类别名。
export function fileTypeLabel(fileType) {
  switch (fileType) {
    case "image":
      return "图片";
    case "video":
      return "视频";
    case "zip":
      return "ZIP/RAR 压缩包";
    default:
      return "";
  }
}
