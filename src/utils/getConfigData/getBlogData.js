/** @format */

const localeData = {};
async function getData(lang) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/${lang}/blog/read-blog-data`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  return data;
}

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const data = await getData(lang);
  console.log(`---获取Blog时间: ${Date.now() - startTime}---`);
  return data;
}
