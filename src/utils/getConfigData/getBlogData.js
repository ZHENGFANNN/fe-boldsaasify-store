/** @format */

const localeData = {};
async function getData(lang) {
  if (!localeData[lang]) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data`,
      {
        method: "GET",
        body: JSON.stringify({ lang }),
      }
    );
    const data = await response.json();
    localeData[lang] = data[lang];
  }
  return localeData[lang];
}

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const data = await getData(lang);
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
