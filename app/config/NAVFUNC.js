/**
 * 作用：导航栏列表
 * 注意：所有语言相关的数据都在这里获取
 *
 * @format
 */

export default function NAVFUNC({ type, LANG, BLOG, CONFIG, PRODUCT }) {
  // 产品分类
  const navGoodSort = {
    key: "product_categories",
    title: LANG["common.nav.product_categories"],
    href: "/",
    list: PRODUCT.layout.sortList,
  };

  // 产品列表
  // const navGoodList = {
  //   key: "product_info",
  //   href: "/",
  //   title: LANG["common.nav.product_info"],
  //   list: goodList?.map((item) => {
  //     return {
  //       sub_title: item.name,
  //       href: `/product/${item.sort_key}/${item.key}`,
  //       img: (
  //         <img
  //           height={60}
  //           width={60}
  //           data-src={item.image || item.image_list?.[0]?.src}
  //           alt={item.name}
  //         />
  //       ),
  //     };
  //   }),
  // };

  // 博客分类
  const navBlogSortTop = {
    key: "blog",
    title: LANG["common.nav.blog"],
    href: "/blog",
    list: BLOG.layout.nav.map((item) => {
      return {
        sub_title: item.title,
        href: `/blog/${item.sort_key}/${item.key}`,
      };
    }),
  };
  const navBlogSortBottom = {
    key: "blog",
    title: LANG["common.nav.blog"],
    href: "/blog",
    list: [
      {
        key: "all",
        sub_title: LANG["common.nav.all"],
        href: "/blog",
      },
      ...BLOG.layout.footer.map((item) => ({
        key: item.key,
        sub_title: item.name,
        href: `/blog/${item.key}`,
      })),
    ],
  };
  // 购买方式
  const navBuyWay = {
    key: "where_buy",
    title: LANG["common.nav.where_buy"],
    href: "/",
    list: CONFIG["company.sales_channels.index"]?.map((item) => {
      return {
        sub_title: item.title,
        href: item.href,
        img: item.src,
      };
    }),
  };

  // 网站协议
  const navWebsiteSupport = {
    key: "support",
    href: "/protocol/sales",
    title: LANG["common.nav.support"],
    list: [
      {
        sub_title: LANG["common.nav.sales_policy"],
        href: "/protocol/sales",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-sales.svg`,
      },
      {
        sub_title: LANG["common.nav.privacy_policy"],
        href: "/protocol/policy",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-privacy.svg`,
      },
      {
        sub_title: LANG["common.nav.user_service"],
        href: "/protocol/user",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-argeement.svg`,
      },
      {
        sub_title: LANG["common.nav.faq"],
        href: "/protocol/faq",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-faq.svg`,
      },
    ],
  };

  // 关于我们
  const navAboutUs = {
    key: "about_us",
    href: "/company/introduce",
    title: LANG["common.nav.about_us"],
    list: [
      {
        sub_title: LANG["common.nav.company_profile"],
        href: "/company/introduce",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-company.svg`,
      },
      {
        sub_title: LANG["common.nav.market_collaboration"],
        href: "/company/market",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-market.svg`,
      },
      {
        sub_title: LANG["common.nav.technical_cooperation"],
        href: "/company/technology",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-technology.svg`,
      },
      {
        sub_title: LANG["common.nav.supplier_cooperation"],
        href: "/company/supplier",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-suppiler.svg`,
      },
      {
        sub_title: LANG["common.nav.contact_us"],
        href: "/company/contact",
        img: `${process.env.NEXT_PUBLIC_FILE}/image/icon/nav-contact.svg`,
      },
    ],
  };

  if (type === "nav") {
    return [
      navGoodSort,
      navBlogSortTop,
      navBuyWay,
      navWebsiteSupport,
      navAboutUs,
    ].filter((item) => item.list.length > 0);
  } else {
    return [
      navGoodSort,
      navBlogSortBottom,
      navBuyWay,
      navWebsiteSupport,
      navAboutUs,
    ].filter((item) => item.list.length > 0);
  }
}
