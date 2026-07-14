import React from "react";
import GlobalContext from "@/[locale]/context";

const searchPlaceholderMap = {
  en: "Search country or region",
  "zh-cn": "搜索国家或地区",
  ja: "国・地域を検索",
};

function getCountryLabel(item, locale) {
  if (locale === "zh-cn") return item.country_cn || item.country;
  return item.country;
}

export default function CountryPickerList({
  countries,
  onSelect,
  styles,
  lock,
}) {
  const { locale } = React.useContext(GlobalContext);
  const [keyword, setKeyword] = React.useState("");

  const filteredCountries = React.useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return countries;

    return countries.filter((item) => {
      const label = getCountryLabel(item, locale);
      const searchText = [
        label,
        item.country,
        item.country_cn,
        item.country_english,
        item.currency,
        item.country_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [countries, keyword, locale]);

  return (
    <>
      <div className={styles.search_box}>
        <svg
          className={styles.search_icon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className={styles.search_input}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={searchPlaceholderMap[locale] || searchPlaceholderMap.en}
        />
        {keyword ? (
          <button
            type="button"
            className={styles.search_clear}
            aria-label="clear"
            onClick={() => setKeyword("")}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className={styles.country_panel}>
        <div className={styles.country_list}>
          {filteredCountries.map((countryItem) => (
            <div
              className={styles.country_item}
              key={countryItem.country_code}
              onClick={() => {
                if (lock) return;
                onSelect(countryItem);
              }}
            >
              {`${getCountryLabel(countryItem, locale)} (${countryItem.currency_symbol}${countryItem.currency})`}
            </div>
          ))}
        </div>
        {filteredCountries.length === 0 ? (
          <div className={styles.empty_tip}>
            {locale === "zh-cn" ? "未找到匹配的国家/地区" : "No matching country or region"}
          </div>
        ) : null}
      </div>
    </>
  );
}
