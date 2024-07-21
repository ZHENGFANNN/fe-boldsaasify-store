/** @format */

import dayjs from "dayjs";
import "dayjs/locale/de";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(LocalizedFormat);

export function formateTime({ time, locale }) {
  const timestamp = new Date(time);
  switch (locale) {
    case "de":
      return dayjs(timestamp).locale("de").format("ll");
    case "it":
      return dayjs(timestamp).format("DD/MM/YYYY");
    case "ja":
      return dayjs(timestamp).format("YYYY/MM/DD");
    default:
      return dayjs(timestamp).format("MMM DD, YYYY");
  }
}

function getHeadTitleId(title) {
  return title
    .toLowerCase()
    .replace(/<.*?>(.*?)<.*?>/gis, "$1")
    .replace(/[\'\"?:]/g, "")
    .replace(/\s+/g, "-");
}

export function getHeadTitleList(html) {
  const headerRegex = /<h([23])[^>]*>.*?<\/h\1>/gis;
  const tagRegex = /<\/?[^>]+(>|$)/g; // Regex to match any HTML tag
  let matches = [];
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    // Get the full match (incl. tags) and strip HTML tags only for the inner content
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const content = contentWithTags.replace(tagRegex, "").trim();
    const id = getHeadTitleId(content);
    matches.push({ tag: tagName, content: content, id });
  }

  return matches;
}

export function addHeadTitleId(html) {
  const headerRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gis;
  let match;
  while ((match = headerRegex.exec(html)) !== null) {
    // Get the full match (incl. tags) and strip HTML tags only for the inner content
    const contentWithTags = match[0];
    const tagName = `h${match[1]}`;
    const content = match[2];
    const id = getHeadTitleId(content);
    html = html.replace(
      contentWithTags,
      `<${tagName} id="${id}">${content}</${tagName}>`
    );
  }
  return html;
}
