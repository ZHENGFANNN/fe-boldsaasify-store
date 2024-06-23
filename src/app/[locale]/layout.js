import "../../styles/globals.css";
import "../../styles/reset.css";

import Navbar from "@/components/Layout/NavBar";
import Footer from "@/components/Layout/Footer";

import React from "react";
import Layout from "@/components/Layout";

import getConfigData from "@/utils/getConfigData";
import { cookies } from "next/headers";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: "no",
  appleMobileWebAppCapable: "yes",
};

/**
 * 获取数据
 */
async function getData({
  locale,
  area,
  configList,
  configNameSpace,
  languageNameSpace,
}) {
  const result = await getConfigData({
    locale,
    area,
    configList,
    configNameSpace,
    languageNameSpace,
  });
  const GOODLIST = [];
  result.GOODLIST.forEach(
    ({
      name,
      image_list,
      sort_key,
      key,
      comboList,
      review_score,
      review_num,
      goodSort,
    }) => {
      if (goodSort[0].enabled) {
        GOODLIST.push({
          name,
          image: image_list[0].src,
          sort_key,
          key,
          review_score,
          review_num,
          comboList,
        });
      }
    }
  );
  result.GOODLIST = GOODLIST;
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
      languageNameSpace: [
        "common.nav",
        "common.cart",
        "common.footer",
        "common.other",
      ],
      configNameSpace: [
        "company.basic",
        "company.sales_channels.index",
        "company.social_media.index",
      ],
    });

  return (
    <html lang={locale}>
      <body>
        <Layout
          locale={locale}
          area={area}
          LANG={LANG}
          CONFIG={CONFIG}
          goodList={GOODLIST}
          goodSortList={GOODSORTLIST}
          goodDiscountFestival={GOODDISCOUNTFESTIVAL}
        >
          <Navbar />
          <div id="app-content">{children}</div>
          <Footer />
        </Layout>
      </body>
    </html>
  );
}
