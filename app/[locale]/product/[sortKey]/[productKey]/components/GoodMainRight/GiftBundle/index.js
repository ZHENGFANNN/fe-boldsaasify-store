/** @format */

"use client";

import React from "react";
import styles from "./index.module.scss";
import { useRouter } from "next/navigation";
import ProductContext from "../../../ProductContext";
import GlobalContext from "@/[locale]/context";
import Api from "../../../api";
import { readClientArea } from "@/utils/readClientArea";
import { pushCartLines, replaceCartLines } from "@/utils/cartStorage";
import ProductCardPrice from "@/components/ProductCardPrice";

/**
 * 买X送Y 买赠模块（PDP）。仅当「当前商品作为买X、送Y为具体商品」（后端 getProductBxgyOffer
 * 返回一对一/一对多的自动买赠规则）时展示，支持「X+Y 一起加购 / 一起立即购买」一键凑单。
 *
 * 折扣本身由结账引擎按购物车实时计算（服务端唯一真相），本模块只负责展示与把 X、Y 两行
 * 一起写入 store_shopping；按件门槛时自动把 X 数量凑到 buys_value，让买赠真正触发。
 * Y 商品名/图/价与购物车同口径（POST /api/cart → getCartByKeys）。
 */
export default function GiftBundle() {
  const router = useRouter();
  const { showCartModal } = React.useContext(GlobalContext);
  const {
    LANG,
    locale,
    productInfo,
    productCurCombo,
    productNum,
    optionAxes,
    optionSelection,
    variantResolved,
    customizeRef,
  } = React.useContext(ProductContext);

  const [offer, setOffer] = React.useState(null);
  const [gifts, setGifts] = React.useState([]);
  const [selectedKey, setSelectedKey] = React.useState("");

  const sortKey = productInfo?.sort_key;
  const productKey = productInfo?.key;

  React.useEffect(() => {
    if (!sortKey || !productKey) return;
    let alive = true;
    const area = readClientArea();
    (async () => {
      try {
        const res = await Api.getProductBxgyOffer({
          area_code: area,
          sort_key: sortKey,
          product_key: productKey,
        });
        const offers = (res?.code === 0 && res?.data?.offers) || [];
        if (!offers.length) {
          if (alive) resetBundle();
          return;
        }
        // 取第一条命中规则展示（PDP 通常至多一条买赠）。
        const first = offers[0];
        const items = (first.get_products || []).map((g) => ({
          sortKey: g.sort_key,
          productKey: g.product_key,
          comboKey: g.combo_key,
        }));
        // Y 商品名/图/价：与购物车同口径实时取。
        let list = [];
        try {
          const cartRes = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ area, language: locale, items }),
          });
          const cartData = await cartRes.json();
          list = Array.isArray(cartData)
            ? cartData
            : cartData?.data || cartData?.list || [];
        } catch {
          list = [];
        }
        const display = (first.get_products || [])
          .map((g) => {
            const hit =
              list.find(
                (c) => c.productKey === g.product_key && c.comboKey === g.combo_key,
              ) || list.find((c) => c.productKey === g.product_key);
            if (!hit?.areaInfo) return null; // 无价/无库存的赠品不展示
            return {
              sortKey: g.sort_key,
              productKey: g.product_key,
              comboKey: g.combo_key,
              name: hit.name || g.product_key,
              image: hit.image || "",
              areaInfo: hit.areaInfo,
            };
          })
          .filter(Boolean);
        if (!alive) return;
        if (!display.length) {
          resetBundle();
          return;
        }
        setOffer(first);
        setGifts(display);
        setSelectedKey(`${display[0].productKey}|${display[0].comboKey}`);
      } catch {
        if (alive) resetBundle();
      }
    })();

    function resetBundle() {
      setOffer(null);
      setGifts([]);
      setSelectedKey("");
    }
    return () => {
      alive = false;
    };
  }, [sortKey, productKey, locale]);

  if (!offer || !gifts.length) return null;

  const selectedGift =
    gifts.find((g) => `${g.productKey}|${g.comboKey}` === selectedKey) || gifts[0];
  const buyable =
    variantResolved &&
    !!productCurCombo?.areaInfo?.product_price &&
    !!productCurCombo?.areaInfo?.stock;

  const buysText =
    offer.buys_type === "amount"
      ? `${LANG["store.product.bxgy_spend"] || "Spend"} ${offer.buys_value}`
      : `${LANG["store.product.bxgy_buy"] || "Buy"} ${offer.buys_value}`;
  const getsText =
    offer.gets_discount_type === "percent"
      ? `${offer.gets_discount_value}% ${LANG["store.product.bxgy_off"] || "OFF"}`
      : LANG["store.product.bxgy_free"] || "FREE";

  const buildLines = () => {
    if (!buyable) return null;
    // 定制字段必填校验（与加购一致）
    if (customizeRef?.current?.validate && !customizeRef.current.validate()) {
      return null;
    }
    const customizeData = customizeRef?.current?.getData
      ? customizeRef.current.getData()
      : [];
    const cartOptions = (optionAxes || []).map((axis) => {
      const code = optionSelection?.[axis.axis_code];
      const val = axis.values.find((v) => v.value_code === code);
      return { name: axis.axis_name, value: val?.value_label || "", desc: "" };
    });
    // 按件门槛时把 X 数量凑到 buys_value，让买赠真正触发；金额门槛不自动凑量。
    let xNum = productNum;
    if (offer.buys_type === "quantity" && Number(offer.buys_value) > xNum) {
      xNum = Number(offer.buys_value);
    }
    const lineX = {
      sortKey: productInfo.sort_key,
      productKey: productInfo.key,
      comboKey: productCurCombo.key,
      productNum: xNum,
      options: cartOptions,
      customize_data: customizeData,
    };
    const lineY = {
      sortKey: selectedGift.sortKey,
      productKey: selectedGift.productKey,
      comboKey: selectedGift.comboKey,
      productNum: offer.gets_quantity > 0 ? offer.gets_quantity : 1,
      options: [],
      customize_data: [],
    };
    return [lineX, lineY];
  };

  const onAdd = () => {
    const lines = buildLines();
    if (!lines) return;
    pushCartLines(lines);
    showCartModal?.();
  };

  const onBuyNow = () => {
    const lines = buildLines();
    if (!lines) return;
    replaceCartLines(lines);
    router.push(`/${locale}/order`);
  };

  return (
    <div className={styles.bundle} data-role="gift-bundle">
      <div className={styles.header}>
        <span className={styles.tag}>
          {LANG["store.product.bxgy_tag"] || "Bundle & Save"}
        </span>
        <span className={styles.terms}>
          {buysText} · {LANG["store.product.bxgy_get"] || "Get"} {offer.gets_quantity}{" "}
          {getsText}
        </span>
      </div>

      <ul className={styles.gift_list}>
        {gifts.map((g) => {
          const key = `${g.productKey}|${g.comboKey}`;
          const selected = key === selectedKey;
          return (
            <li
              key={key}
              className={`${styles.gift_item} ${selected ? styles.gift_item_active : ""}`}
              onClick={() => setSelectedKey(key)}
            >
              <div className={styles.gift_thumb}>
                {g.image ? <img src={g.image} alt={g.name} /> : null}
                <span className={styles.gift_badge}>{getsText}</span>
              </div>
              <div className={styles.gift_meta}>
                <span className={styles.gift_name}>{g.name}</span>
                <ProductCardPrice
                  areaInfo={g.areaInfo}
                  LANG={LANG}
                  className={styles.gift_price}
                />
              </div>
              {gifts.length > 1 ? (
                <span
                  className={`${styles.gift_radio} ${selected ? styles.gift_radio_on : ""}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btn_add}
          disabled={!buyable}
          onClick={onAdd}
        >
          {LANG["store.product.bxgy_add_bundle"] || "Add bundle to cart"}
        </button>
        <button
          type="button"
          className={styles.btn_buy}
          disabled={!buyable}
          onClick={onBuyNow}
        >
          {LANG["store.product.bxgy_buy_bundle"] || "Buy bundle now"}
        </button>
      </div>
    </div>
  );
}
