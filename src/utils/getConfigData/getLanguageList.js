/** @format */

export default async function getLanguageList(lang) {
  const startTime = Date.now();
  const { default: languageList } = await import(
    "@@/locale/languageList/" + lang
  );
  const endTime = Date.now();
  console.log(`getLanguageList ${lang} time: ${endTime - startTime}`);
  return languageList;
}
