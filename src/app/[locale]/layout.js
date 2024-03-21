import "../../styles/globals.css";
import "../../styles/reset.css";

import Navbar from "@/components/Layout/NavBar";
import Footer from "@/components/Layout/Footer";

import React from "react";
import Layout from "@/components/Layout";

import getConfigDataV2 from "@/utils/getConfigDataV2";
import { cookies } from "next/headers";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: "no",
};

/**
 * 获取数据
 */
async function getData({ locale, area, configList }) {
  const result = await getConfigDataV2({ locale, area, configList });
  result.GOODLIST = result.GOODLIST.map(
    ({
      name,
      path,
      image_list,
      sort_key,
      key,
      comboList,
      review_score,
      review_num,
    }) => {
      return {
        name,
        path,
        image_list,
        sort_key,
        key,
        review_score,
        review_num,
        comboList,
      };
    }
  );
  result.GOODSORTLIST = result.GOODSORTLIST.map(({ name, key, image_src }) => {
    return {
      name,
      key,
      image_src,
    };
  });
  return result;
}

export default async function RootLayout(props) {
  const {
    children,
    params: { locale },
  } = props;
  const area = cookies().get("area")?.value || "us";
  const { CONFIG, LANG, GOODLIST, GOODSORTLIST, GOODDISCOUNTFESTIVAL } =
    await getData({
      locale,
      area,
      configList: [
        "config",
        "language",
        "goodSort",
        "good",
        "goodDiscountFestival",
      ],
    });
  return (
    <html lang="en">
      <body>
        <Layout
          GOODDISCOUNTFESTIVAL={GOODDISCOUNTFESTIVAL}
          GOODLIST={GOODLIST}
          LANG={LANG}
        >
          <Navbar
            locale={locale}
            LANG={LANG}
            CONFIG={CONFIG}
            GOODLIST={GOODLIST}
            GOODSORTLIST={GOODSORTLIST}
          />
          <div id="app-content">{children}</div>
          <Footer
            LANG={LANG}
            CONFIG={CONFIG}
            GOODLIST={GOODLIST}
            GOODSORTLIST={GOODSORTLIST}
          />
        </Layout>
      </body>
    </html>
  );
}
