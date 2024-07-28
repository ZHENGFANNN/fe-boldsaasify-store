/** @format */

export default async function getBlogList(lang) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_DOMAIN}/service/blog/read-blog-data`,
    {
      method: "POST",
      body: JSON.stringify({
        lang,
      }),
    }
  );
  const data = await response.json();
  return data;
}
