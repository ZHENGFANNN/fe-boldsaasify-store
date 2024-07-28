/** @format */

export default async function getBlogList(lang) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data?lang=${lang}`,
    {
      method: "POST",
    }
  );
  const data = await response.json();
  return data;
}
