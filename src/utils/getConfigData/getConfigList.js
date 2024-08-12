/** @format */

export default async function getConfigList(lang) {
  const startTime = Date.now();
  const { default: configList } = await import(
    "@@/locale/configList/" + lang + ".json"
  );
  const endTime = Date.now();
  console.log(`getConfigList ${lang} time: ${endTime - startTime}`);
  return configList;
}
