// 浏览器定位辅助。
// 反地理编码（坐标 → 地址）已改由后端代理完成：前端只负责取浏览器坐标，
// 然后调 /user/getAddressByLocation，由后端持有 Google key 并解析地址。
// 这样 Google API key 不会暴露在前端 bundle 里。

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

/**
 * 把定位 / 反编码的错误码翻译成给用户看的提示文案（带 LANG 兜底）。
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
