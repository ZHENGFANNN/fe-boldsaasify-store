// Google 地理反编码（坐标 → 结构化地址）
// 需要在 .env 配置 NEXT_PUBLIC_GOOGLE_MAP_KEY，并在 Google Cloud 控制台开启 "Geocoding API"。
//
// 社区通行做法（已采纳）：
//  1. 结果按“最精确 → 最粗略”排序，优先取 street_address/premise 且非 Plus Code 的那条。
//  2. 街道那条结果常常缺 postal_code，所以邮编/城市/省份跨所有结果取第一个非空值。
//  3. 浏览器定位区分 权限拒绝 / 超时 / 不可用，并注意 getCurrentPosition 仅在 HTTPS 下可用。

const GOOGLE_GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json";

// 街道级精度的结果类型
const STREET_TYPES = ["street_address", "premise", "subpremise"];

/**
 * 读取浏览器当前定位坐标。失败时抛出带 message 的错误：
 * PERMISSION_DENIED / POSITION_UNAVAILABLE / TIMEOUT / GEOLOCATION_UNSUPPORTED
 * @returns {Promise<{lat:number,lng:number}>}
 */
export function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEOLOCATION_UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const codeMap = {
          1: "PERMISSION_DENIED",
          2: "POSITION_UNAVAILABLE",
          3: "TIMEOUT",
        };
        const e = new Error(codeMap[err?.code] || "GEOLOCATION_ERROR");
        e.code = err?.code;
        reject(e);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// 从一条结果的 address_components 里按类型取值
function getComp(components, type, key = "long_name") {
  const c = (components || []).find((item) => item.types.includes(type));
  return c ? c[key] : "";
}

// 跨多条结果取某类型的第一个非空值（解决“街道结果缺邮编”的常见问题）
function firstAcross(results, type, key = "long_name") {
  for (const r of results) {
    const v = getComp(r.address_components, type, key);
    if (v) return v;
  }
  return "";
}

/**
 * 从多条结果里挑“最精确且非 Plus Code”的一条。
 */
export function pickBestResult(results = []) {
  return (
    results.find(
      (r) => !r.plus_code && r.types?.some((t) => STREET_TYPES.includes(t))
    ) ||
    results.find((r) => !r.plus_code) ||
    results[0] ||
    null
  );
}

/**
 * 把 Google 的 results 数组解析成表单字段。
 */
export function parseGeocodeResults(results = []) {
  const best = pickBestResult(results);
  const fromBest = (type, key) =>
    getComp(best?.address_components, type, key);

  const streetNumber =
    fromBest("street_number") || firstAcross(results, "street_number");
  const route = fromBest("route") || firstAcross(results, "route");
  const address1 =
    [streetNumber, route].filter(Boolean).join(" ") ||
    best?.formatted_address ||
    "";

  const city =
    firstAcross(results, "locality") ||
    firstAcross(results, "postal_town") ||
    firstAcross(results, "sublocality") ||
    firstAcross(results, "administrative_area_level_2");
  const province = firstAcross(results, "administrative_area_level_1");
  const address2 = [city, province].filter(Boolean).join(", ");

  return {
    address1,
    address2,
    zip_code: firstAcross(results, "postal_code"),
    city,
    province,
    country: firstAcross(results, "country"),
    country_code: firstAcross(results, "country", "short_name").toLowerCase(),
    location_type: best?.geometry?.location_type || "",
    formatted_address: best?.formatted_address || "",
  };
}

/**
 * 调用 Google Geocoding API 做反编码。
 * @param {{lat:number,lng:number,language?:string}} params
 */
export async function reverseGeocode({ lat, lng, language = "en" } = {}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY;
  if (!key) throw new Error("MISSING_GOOGLE_MAP_KEY");

  const url = `${GOOGLE_GEOCODE_API}?latlng=${lat},${lng}&language=${encodeURIComponent(
    language
  )}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  // status 取值：OK / ZERO_RESULTS / OVER_QUERY_LIMIT / REQUEST_DENIED / INVALID_REQUEST
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(data.error_message || data.status || "GEOCODE_FAILED");
  }
  return parseGeocodeResults(data.results);
}

/**
 * 一步到位：取当前定位 → 反编码成地址字段。
 * @param {string} language Google 返回结果的语言（直接传站点 locale 即可）。
 */
export async function locateAndParseAddress(language = "en") {
  const { lat, lng } = await getBrowserPosition();
  return reverseGeocode({ lat, lng, language });
}

/**
 * 把反编码 / 定位的错误码翻译成给用户看的提示文案（带 LANG 兜底）。
 */
export function geocodeErrorMessage(err, LANG = {}) {
  const L = (k, fallback) => (LANG && LANG[k]) || fallback;
  switch (err?.message) {
    case "PERMISSION_DENIED":
      return L(
        "user_account.shipping_address.locate_denied",
        "Location permission denied. Please allow access or enter your address manually."
      );
    case "GEOLOCATION_UNSUPPORTED":
    case "POSITION_UNAVAILABLE":
    case "TIMEOUT":
      return L(
        "user_account.shipping_address.locate_unavailable",
        "Couldn't get your location. Please enter your address manually."
      );
    default:
      return L(
        "user_account.shipping_address.locate_fail",
        "Unable to detect your address. Please enter it manually."
      );
  }
}
