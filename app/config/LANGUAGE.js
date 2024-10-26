const list = [
  {
    value: "en",
    label: "English",
    area: "us",
  },
  {
    value: "de",
    label: "Deutsch",
    area: "de",
  },
  {
    value: "cn",
    label: "简体中文",
    area: "cn",
  },
  {
    value: "hk",
    label: "繁體中文",
    area: "hk",
  },
  {
    value: "ja",
    label: "日本語",
    area: "jp",
  },
  {
    value: "es",
    label: "Español",
    area: "es",
  },
  {
    value: "ko",
    label: "한국어",
    area: "kr",
  },
  {
    value: "fr",
    label: "Français",
    area: "fr",
  },
  {
    value: "it",
    label: "Italiano",
    area: "it",
  },
  {
    value: "ru",
    label: "Русский",
    area: "ru",
  },
];

const map = {};
list.forEach((item) => {
  map[item.value] = item;
});

/**
 * key：
 * list: 返回语言列表
 * map: 返回语言映射
 */
exports.languageList = list;
exports.languageMap = map;
