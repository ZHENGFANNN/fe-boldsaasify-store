import React from "react";
import CookieSetting from "./CookieSetting";
import CookieAlert from "./CookieAlert";

function CookieModal(_, ref) {
  const cookieAlertRef = React.useRef();
  const cookieSettingRef = React.useRef();

  React.useImperativeHandle(ref, () => ({
    showCookieAlert: () => {
      cookieAlertRef.current.show();
    },
    showCookieSetting: () => {
      cookieSettingRef.current.show();
    },
  }));

  return (
    <>
      <CookieAlert
        ref={cookieAlertRef}
        showCookieSetting={() => cookieSettingRef.current.show()}
      />
      <CookieSetting ref={cookieSettingRef} />
    </>
  );
}

export default React.forwardRef(CookieModal);
