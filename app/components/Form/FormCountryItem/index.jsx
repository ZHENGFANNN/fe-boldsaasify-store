import React from "react";
import GlobalContext from "@/[locale]/context";

import Input from "../FormInput";
import { countryMap } from "@/config/marketSettings";

export default function CountryItem({ setValue, value, inputProps, error }) {
  const { LANG, area } = React.useContext(GlobalContext);

  const areaInfo = React.useMemo(() => {
    const data = countryMap[area];
    if (!data) return {};
    return {
      area_code: data.country_code,
      area_text: data.country,
    };
  }, [area]);

  React.useEffect(() => {
    setValue(areaInfo);
  }, [areaInfo]);

  return (
    <Input
      inputProps={{
        ...inputProps,
        disabled: true,
      }}
      focus={!!value}
      error={error}
      label={LANG["common.other.country_region"]}
      tip={LANG["common.other.change_country"]}
    />
  );
}
