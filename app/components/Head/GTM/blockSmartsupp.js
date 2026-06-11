import Script from "next/script";

/**
 * Smartsupp 已下线，改用自研 LiveChat。线上 GTM 容器 (NEXT_PUBLIC_GTM) 可能仍注入
 * smartsuppchat.com loader，在 GTM 控制台发布移除前，此处拦截第三方脚本与浮窗 DOM。
 */
export function BlockSmartsupp() {
  return (
    <Script
      id="block-smartsupp"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function () {
  var noop = function () {};
  try {
    Object.defineProperty(window, "smartsupp", {
      value: noop,
      writable: false,
      configurable: false,
    });
    Object.defineProperty(window, "_smartsupp", {
      value: { key: "" },
      writable: false,
      configurable: false,
    });
  } catch (e) {
    window.smartsupp = noop;
    window._smartsupp = window._smartsupp || { key: "" };
  }

  var origCreate = Document.prototype.createElement;
  Document.prototype.createElement = function (tagName) {
    var el = origCreate.apply(this, arguments);
    if (String(tagName).toLowerCase() !== "script") return el;

    var desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
    if (!desc || !desc.set) return el;

    var origSet = desc.set;
    Object.defineProperty(el, "src", {
      configurable: true,
      get: desc.get ? function () { return desc.get.call(this); } : undefined,
      set: function (value) {
        if (typeof value === "string" && value.indexOf("smartsuppchat.com") !== -1) {
          return;
        }
        origSet.call(this, value);
      },
    });
    return el;
  };

  function purgeSmartsupp() {
    document
      .querySelectorAll(
        'script[src*="smartsuppchat.com"], iframe[src*="smartsupp"], [data-testid="widgetButton"]'
      )
      .forEach(function (node) {
        node.remove();
      });

    document.querySelectorAll('[aria-label="Open Smartsupp chat"]').forEach(function (node) {
      var host = node.closest("div");
      if (host) host.remove();
      else node.remove();
    });
  }

  function observe() {
    purgeSmartsupp();
    new MutationObserver(purgeSmartsupp).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.documentElement) {
    observe();
  } else {
    document.addEventListener("DOMContentLoaded", observe);
  }
})();`,
      }}
    />
  );
}
