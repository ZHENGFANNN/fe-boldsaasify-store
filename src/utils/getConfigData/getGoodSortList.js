/** @format */

export default async function getGoodSortList(lang) {
  const startTime = Date.now();
  const { default: productSortList } = await import(
    "@@/locale/productSort/" + lang + ".json"
  );
  const endTime = Date.now();
  console.log(`getGoodSortList ${lang} time: ${endTime - startTime}`);
  return productSortList;
}
