/** @format */

export default async function getBlogList(lang) {
  const startTime = Date.now();
  const { default: blogData } = await import(
    "@@/locale/blogData/" + lang + ".json"
  );
  const endTime = Date.now();
  console.log(`getBlogList ${lang} time: ${endTime - startTime}`);
  return blogData;
}
