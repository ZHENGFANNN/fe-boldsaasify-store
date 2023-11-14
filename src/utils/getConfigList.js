export default async function getConfigList(lang) {
  if (lang === "cn") {
    const data = await import("@@/locale/configList/cn.json");
    return data.default;
  } else if (lang === "de") {
    const data = await import("@@/locale/configList/de.json");
    return data.default;
  } else if (lang === "en") {
    const data = await import("@@/locale/configList/en.json");
    return data.default;
  } else if (lang === "es") {
    const data = await import("@@/locale/configList/es.json");
    return data.default;
  } else if (lang === "fr") {
    const data = await import("@@/locale/configList/fr.json");
    return data.default;
  } else if (lang === "hk") {
    const data = await import("@@/locale/configList/hk.json");
    return data.default;
  } else if (lang === "it") {
    const data = await import("@@/locale/configList/it.json");
    return data.default;
  } else if (lang === "ja") {
    const data = await import("@@/locale/configList/ja.json");
    return data.default;
  } else if (lang === "ko") {
    const data = await import("@@/locale/configList/ko.json");
    return data.default;
  } else if (lang === "ru") {
    const data = await import("@@/locale/configList/ru.json");
    return data.default;
  }
}
