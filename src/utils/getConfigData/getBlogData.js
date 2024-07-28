/** @format */

const localeData = {};
async function getData(lang) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data`,
    {
      method: "GET",
    }
  );
  const data = await response.json();
  localeData[lang] = data[lang];
  return localeData[lang];
}

export default async function getBlogList(lang) {
  return await getData(lang);
}
