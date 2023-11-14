export default async function getGoodSortList(lang) {
  if (lang === "cn") {
    const data = await import("@@/locale/productSort/cn.json");
    return data.default;
  } else if (lang === "de") {
    const data = await import("@@/locale/productSort/de.json");
    return data.default;
  } else if (lang === "en") {
    const data = await import("@@/locale/productSort/en.json");
    return data.default;
  } else if (lang === "es") {
    const data = await import("@@/locale/productSort/es.json");
    return data.default;
  } else if (lang === "fr") {
    const data = await import("@@/locale/productSort/fr.json");
    return data.default;
  } else if (lang === "hk") {
    const data = await import("@@/locale/productSort/hk.json");
    return data.default;
  } else if (lang === "it") {
    const data = await import("@@/locale/productSort/it.json");
    return data.default;
  } else if (lang === "ja") {
    const data = await import("@@/locale/productSort/ja.json");
    return data.default;
  } else if (lang === "ko") {
    const data = await import("@@/locale/productSort/ko.json");
    return data.default;
  } else if (lang === "ru") {
    const data = await import("@@/locale/productSort/ru.json");
    return data.default;
  }
}
