/** @format */
const localeData = {};
async function getData(lang) {
  if (!localeData[lang]) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    localeData[lang] = data[lang];
  }
  return localeData[lang];
}

async function getDataV2(lang) {
  switch (lang) {
    case "cn":
      return await require(`@@/locale/blogData/cn.json`);
    case "en":
      return await require(`@@/locale/blogData/en.json`);
    case "ja":
      return await require(`@@/locale/blogData/ja.json`);
    case "ko":
      return await require(`@@/locale/blogData/ko.json`);
    case "ru":
      return await require(`@@/locale/blogData/ru.json`);
    case "fr":
      return await require(`@@/locale/blogData/fr.json`);
    case "de":
      return await require(`@@/locale/blogData/de.json`);
    case "es":
      return await require(`@@/locale/blogData/es.json`);
    case "it":
      return await require(`@@/locale/blogData/it.json`);
    case "hk":
      return await require(`@@/locale/blogData/hk.json`);
    default:
      return await require(`@@/locale/blogData/en.json`);
  }
}

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const data = await getDataV2(lang);
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
