export default async function getGoodList(lang) {
  if (lang === "cn") {
    const data = await import("@@/locale/productList/cn.json");
    return data.default;
  } else if (lang === "de") {
    const data = await import("@@/locale/productList/de.json");
    return data.default;
  } else if (lang === "en") {
    const data = await import("@@/locale/productList/en.json");
    return data.default;
  } else if (lang === "es") {
    const data = await import("@@/locale/productList/es.json");
    return data.default;
  } else if (lang === "fr") {
    const data = await import("@@/locale/productList/fr.json");
    return data.default;
  } else if (lang === "hk") {
    const data = await import("@@/locale/productList/hk.json");
    return data.default;
  } else if (lang === "it") {
    const data = await import("@@/locale/productList/it.json");
    return data.default;
  } else if (lang === "ja") {
    const data = await import("@@/locale/productList/ja.json");
    return data.default;
  } else if (lang === "ko") {
    const data = await import("@@/locale/productList/ko.json");
    return data.default;
  } else if (lang === "ru") {
    const data = await import("@@/locale/productList/ru.json");
    return data.default;
  }
}
