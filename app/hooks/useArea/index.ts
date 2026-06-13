"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";


export type UseAreaResult = {
  /** cookie 未就绪时为 undefined；就绪后为 cookie 值或 undefined（无 cookie） */
  area: string | undefined;
  areaReady: boolean;
};

/** 客户端读 cookie `area`，避免 layout 服务端 cookies() 影响 SSG。 */
export function useArea(): UseAreaResult {
  const [area, setArea] = useState<string | undefined>(undefined);
  const [areaReady, setAreaReady] = useState(false);

  useEffect(() => {
      const cookieArea = Cookies.get("area") ;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArea(cookieArea);
      setAreaReady(true);
  }, []);

  return { area, areaReady };
}

export default useArea;
