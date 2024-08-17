/** @format */
const localeData = {};
async function getDataV3(lang) {
  if (!localeData[lang]) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CLOUDFLARE_KV_ID}/values/blog:${lang}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
        },
      }
    );
    const result = await response.json();
    localeData[lang] = result;
    return result;
  } else {
    return localeData[lang];
  }
}

async function getData(lang) {
  // if (!localeData[lang]) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data?language=${lang}`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  return data;
  // localeData[lang] = data[lang];
  // }
  // return localeData[lang];
}

// async function getDataV2(lang) {
//   if (!localeData[lang]) {
//     switch (lang) {
//       case "cn":
//         localeData[lang] = await import(`@@/locale/blogData/cn.json`);
//         break;
//       case "en":
//         localeData[lang] = await import(`@@/locale/blogData/en.json`);
//         break;
//       case "ja":
//         localeData[lang] = await import(`@@/locale/blogData/ja.json`);
//         break;
//       case "ko":
//         localeData[lang] = await import(`@@/locale/blogData/ko.json`);
//         break;
//       case "ru":
//         localeData[lang] = await import(`@@/locale/blogData/ru.json`);
//         break;
//       case "fr":
//         localeData[lang] = await import(`@@/locale/blogData/fr.json`);
//         break;
//       case "de":
//         localeData[lang] = await import(`@@/locale/blogData/de.json`);
//         break;
//       default:
//         throw new Error(`Unsupported language: ${lang}`);
//     }
//   }
//   return localeData[lang];
// }

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const data = await getData(lang);
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
