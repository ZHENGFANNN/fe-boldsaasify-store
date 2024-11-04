import React from "react";
import AnnouncementBar from "./AnnouncementBar";
import WebsiteNavBar from "./WebsiteNavBar";

export default function NavBar() {
  return (
    <>
      {/* 顶部广告位 */}
      <AnnouncementBar />
      {/* 网页导航栏 */}
      <WebsiteNavBar />
    </>
  );
}
