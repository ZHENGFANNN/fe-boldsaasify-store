export default async function getLanguageList(lang) {
  if (lang === 'cn') {
    const data = await import('../../locale/languageList/cn.json')
    return data.default
  } else if (lang === 'de') {
    const data = await import('../../locale/languageList/de.json')
    return data.default
  } else if (lang === 'en') {
    const data = await import('../../locale/languageList/en.json')
    return data.default
  } else if (lang === 'es') {
    const data = await import('../../locale/languageList/es.json')
    return data.default
  } else if (lang === 'fr') {
    const data = await import('../../locale/languageList/fr.json')
    return data.default
  } else if (lang === 'hk') {
    const data = await import('../../locale/languageList/hk.json')
    return data.default
  } else if (lang === 'it') {
    const data = await import('../../locale/languageList/it.json')
    return data.default
  } else if (lang === 'ja') {
    const data = await import('../../locale/languageList/ja.json')
    return data.default
  } else if (lang === 'ko') {
    const data = await import('../../locale/languageList/ko.json')
    return data.default
  } else if (lang === 'ru') {
    const data = await import('../../locale/languageList/ru.json')
    return data.default
  }
}
