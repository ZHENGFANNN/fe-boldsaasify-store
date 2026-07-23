export const COOKIE_ALERT_REGION_LIST = [
  "us",
  "at", // Austria
  "be", // Belgium
  "bg", // Bulgaria
  "hr", // Croatia
  "cz", // Czech Republic
  "dk", // Denmark
  "ee", // Estonia
  "fi", // Finland
  "fr", // France
  "de", // Germany
  "gr", // Greece
  "hu", // Hungary
  "ie", // Ireland
  "it", // Italy
  "lv", // Latvia
  "lt", // Lithuania
  "lu", // Luxembourg
  "mt", // Malta
  "nl", // Netherlands
  "no", // Norway
  "pl", // Poland
  "pt", // Portugal
  "sk", // Slovakia
  "si", // Slovenia
  "es", // Spain
  "se", // Sweden
  "ch", // Switzerland
  "gb", // United Kingdom
];

// GDPR / opt-in 地区（欧盟 + EEA + 英国 + 瑞士）：默认「不自动加载」非必要脚本，需用户 opt-in。
// = COOKIE_ALERT_REGION_LIST 去掉 us（美国为 opt-out，默认自动加载）。
export const GDPR_REGION_LIST = COOKIE_ALERT_REGION_LIST.filter((r) => r !== "us");
