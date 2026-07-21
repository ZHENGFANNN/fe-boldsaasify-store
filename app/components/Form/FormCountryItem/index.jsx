import React from "react";
import GlobalContext from "@/[locale]/context";

import Input from "../FormInput";
import { countryMap } from "@/config/marketSettings";
import readClientArea from "@/utils/readClientArea";

export default function CountryItem({ setValue, value, inputProps, error }) {
  const { LANG, area } = React.useContext(GlobalContext);

  // area 走 useArea 是 useEffect 后异步就绪的，首屏为 undefined —— 会让 countryMap 查空、
  // 父 form 的 area 字段被塞 undefined，提交时 required 校验失败。这里补一个同步 fallback：
  // 客户端直接读 cookie（无则 us），保证首次渲染就能拿到有效 area、锁死当前站点。
  const effectiveArea = React.useMemo(() => {
    if (area) return area;
    if (typeof document !== "undefined") return readClientArea();
    return undefined;
  }, [area]);

  const areaInfo = React.useMemo(() => {
    const data = countryMap[effectiveArea];
    if (!data) return {};
    return {
      area_code: data.country_code,
      area_text: data.country,
    };
  }, [effectiveArea]);

  React.useEffect(() => {
    if (!areaInfo?.area_text) return;
    setValue(areaInfo);
  }, [areaInfo]);

  const displayValue = value || areaInfo?.area_text || "";

  return (
    <Input
      inputProps={{
        ...inputProps,
        value: displayValue,
        disabled: true,
      }}
      focus={!!displayValue}
      error={error}
      label={LANG["common.other.country_region"]}
      tip={LANG["common.other.change_country"]}
    />
  );
}
