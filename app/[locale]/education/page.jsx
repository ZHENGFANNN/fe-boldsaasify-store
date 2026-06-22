// 钻石教育中心 /[locale]/education
//
// Server component：并行取多语言 + 页面配置，渲染 hero + 4 个交互式 4C 教学组件。
// 每个 4C 组件包在带锚点 id 的 section（#cut #color #clarity #carat）中，便于博客内链跳转。
// 与 sale/page.jsx 一致为 SSG（不读 area cookie）。

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";

import ColorScale from "./components/ColorScale";
import ClarityCompare from "./components/ClarityCompare";
import CutGrade from "./components/CutGrade";
import CaratVisualizer from "./components/CaratVisualizer";

import styles from "./page.module.scss";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["store.education", "common.base"]
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] })
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  const company = CONFIG["common.base"]?.company_name || "";
  const title =
    LANG?.["store.education.meta_title"] ||
    "Diamond Education — The 4Cs Guide";
  return {
    title: company ? `${title} - ${company}` : title,
    description:
      LANG?.["store.education.meta_description"] ||
      "Learn the 4Cs of diamonds — cut, color, clarity and carat — with interactive guides that show exactly how each grade affects a lab-grown diamond's beauty and value.",
    alternates: buildAlternates("/education", locale)
  };
}

export default async function EducationPage({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });

  const sections = [
    {
      id: "cut",
      title: LANG?.["store.education.cut_title"] || "Cut",
      lead:
        LANG?.["store.education.cut_lead"] ||
        "Cut determines how brilliantly a diamond returns light. It is the C that most affects sparkle — explore how each grade changes the way light dances inside the stone.",
      Component: CutGrade
    },
    {
      id: "color",
      title: LANG?.["store.education.color_title"] || "Color",
      lead:
        LANG?.["store.education.color_lead"] ||
        "Color grades run from D (completely colorless) to Z (light yellow). The less color a diamond shows, the rarer it is. Slide along the scale to see the difference.",
      Component: ColorScale
    },
    {
      id: "clarity",
      title: LANG?.["store.education.clarity_title"] || "Clarity",
      lead:
        LANG?.["store.education.clarity_lead"] ||
        "Clarity measures the tiny natural inclusions inside a diamond. Many grades look flawless to the naked eye — compare grades to find your eye-clean sweet spot.",
      Component: ClarityCompare
    },
    {
      id: "carat",
      title: LANG?.["store.education.carat_title"] || "Carat",
      lead:
        LANG?.["store.education.carat_lead"] ||
        "Carat is a diamond's weight, not its size. Use the slider to see how carat translates into the millimeter diameter you actually see face-up.",
      Component: CaratVisualizer
    }
  ];

  return (
    <main className={styles.page} data-role="education-center">
      <header className={styles.hero}>
        <p className={styles.kicker}>
          {LANG?.["store.education.kicker"] || "Diamond Education"}
        </p>
        <h1 className={styles.heroTitle}>
          {LANG?.["store.education.hero_title"] || "Understanding the 4Cs"}
        </h1>
        <p className={styles.heroSubtitle}>
          {LANG?.["store.education.hero_subtitle"] ||
            "Cut, color, clarity and carat are the four characteristics that define every diamond. Explore each one with our interactive guides to choose with confidence."}
        </p>
      </header>

      <div className={styles.sections}>
        {sections.map(({ id, title, lead, Component }) => (
          <section key={id} id={id} className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{title}</h2>
              <p className={styles.sectionLead}>{lead}</p>
            </div>
            <Component LANG={LANG} />
          </section>
        ))}
      </div>
    </main>
  );
}
