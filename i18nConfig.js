import languageSettings from "@/config/languageSettings.js";

const { locales, defaultLocale, resolveLocale } = languageSettings;

const i18nConfig = {
  locales,
  defaultLocale,
  localeDetector: (request) => resolveLocale(request.locale)
};

export default i18nConfig;
