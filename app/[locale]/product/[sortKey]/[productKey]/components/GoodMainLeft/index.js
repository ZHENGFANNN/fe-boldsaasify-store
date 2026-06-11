import React from "react";

import GoodMediaDisplay from "./GoodMediaDisplay";
import Countdown from "./Countdown";
import GoodMediaTabs from "./GoodMediaTabs";

export default function GoodMainLeft() {
  return (
    <>
      <GoodMediaDisplay />
      <Countdown />
      <GoodMediaTabs />
    </>
  );
}
