/** @format */

export default async function getBlogList(lang) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data`,
    {
      method: "GET",
    }
  );
  console.time("---getBlogList---");
  const data = await response.json();
  console.timeEnd("---getBlogList---");
  return data[lang];
}
