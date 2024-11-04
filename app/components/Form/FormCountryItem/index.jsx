import React from "react";
import GlobalContext from "@/[locale]/context";

import Input from "../FormInput";
import { countryList } from "@/config/COUNTRY";

export default function CountryItem({ setValue, value, inputProps, error }) {
  const { LANG, area } = React.useContext(GlobalContext);

  const areaInfo = React.useMemo(() => {
    let obj = {};
    for (let i = 0; i < countryList.length; i++) {
      const data = countryList[i].countries.find(
        (countryObj) => countryObj.country_code === area
      );
      if (data) {
        obj = {
          area_code: data.country_code,
          area_text: data.country,
        };
        break;
      }
    }
    return obj;
  }, [countryList, area]);

  React.useEffect(() => {
    setValue(areaInfo);
  }, []);

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
