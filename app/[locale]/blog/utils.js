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
