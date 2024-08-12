/** @format */

export default async function getGoodList(lang) {
  const startTime = new Date();
  const { default: productInfo } = await import(
    "@@/locale/productList/" + lang + ".json"
  );
  const endTime = new Date();
  console.log(`getGoodList ${lang} time: ${endTime - startTime}`);
  return productInfo;
}
