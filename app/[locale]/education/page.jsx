// 钻石教育中心 /[locale]/education
//
// Server component：并行取多语言 + 页面配置，渲染 hero + 4 个交互式 4C 教学组件。
// 每个 4C 组件包在带锚点 id 的 section（#cut #color #clarity #carat）中，便于博客内链跳转。
// 与 sale/page.jsx 一致为 SSG（不读 area cookie）。
//
// SEO：交互组件初始 HTML 只含默认选中等级的文案，其余等级描述仅在 JS 数据里、爬虫看不到。
//   故在此 server 组件额外输出：① DefinedTermSet JSON-LD；② 可视隐藏但可爬取/可读屏的
//   全等级参考文本（srOnly），把全部等级描述（含目标关键词）落进首屏 HTML。

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";

import ColorScale from "./components/ColorScale";
import ClarityCompare from "./components/ClarityCompare";
import CutGrade from "./components/CutGrade";
import CaratVisualizer from "./components/CaratVisualizer";
import {
  COLOR_GRADES,
  COLOR_GROUPS,
  COLOR_GROUP_DESCRIPTIONS,
  CLARITY_GRADES,
  CUT_GRADES,
  CARAT_MM_TABLE
} from "./components/data.js";

import styles from "./page.module.scss";

// 深度文 hub（Phase 1 在 ERP 建 education 分类后生效）与购物 CTA 目标。
const GUIDE_HUB = "/blog/education";
const SHOP_HREF = "/product/rings";

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

// 4Cs 结构化数据（DefinedTermSet），帮助搜索引擎理解页面主题。
function buildLdJson() {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "The 4Cs of Diamonds",
    description:
      "Cut, color, clarity and carat — the four characteristics that determine a diamond's quality, appearance and value.",
    hasDefinedTerm: [
      {
        "@type": "DefinedTerm",
        name: "Cut",
        description:
          "How well a diamond's facets interact with light. Cut has the biggest impact on sparkle and is graded from Excellent to Poor."
      },
      {
        "@type": "DefinedTerm",
        name: "Color",
        description:
          "How colorless a diamond is, graded D (completely colorless) to Z (light yellow). The less color, the rarer the stone."
      },
      {
        "@type": "DefinedTerm",
        name: "Clarity",
        description:
          "The presence of tiny natural inclusions, graded from Flawless (FL) to Included (I3). Many grades are eye-clean."
      },
      {
        "@type": "DefinedTerm",
        name: "Carat",
        description:
          "A diamond's weight, not its size. One carat equals 0.2 grams; face-up diameter also depends on cut and shape."
      }
    ]
  };
}

// 颜色等级按分组归并，供参考文本展示。
function colorGradesByGroup(groupKey) {
  return COLOR_GRADES.filter((g) => g.group === groupKey)
    .map((g) => g.key)
    .join(", ");
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

  const guideLabel = LANG?.["store.education.read_guide"] || "Read the full guide";
  const shopLabel =
    LANG?.["store.education.shop_cta"] || "Shop engagement rings";

  return (
    <main className={styles.page} data-role="education-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildLdJson()) }}
      />

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
            <a className={styles.sectionCta} href={GUIDE_HUB}>
              {guideLabel}
              <span aria-hidden="true"> →</span>
            </a>
          </section>
        ))}
      </div>

      <aside className={styles.shopCta}>
        <p className={styles.shopText}>
          {LANG?.["store.education.shop_lead"] ||
            "Ready to choose? Put the 4Cs into practice and find the diamond that's right for you."}
        </p>
        <a className={styles.shopBtn} href={SHOP_HREF}>
          {shopLabel}
        </a>
      </aside>

      {/* SEO/可访问性：全等级参考文本（可视隐藏、不 aria-hidden，爬虫与读屏均可获取）。
          交互组件初始 HTML 只渲染默认等级，这里补齐其余等级的完整描述。 */}
      <section className={styles.srOnly} aria-label="Diamond 4Cs full reference">
        <h2>Diamond Cut grades</h2>
        <ul>
          {CUT_GRADES.map((g) => (
            <li key={g.key}>
              <strong>{g.label}:</strong> {g.description}
            </li>
          ))}
        </ul>

        <h2>Diamond Color grades (D–Z)</h2>
        <ul>
          {COLOR_GROUPS.map((grp) => (
            <li key={grp.key}>
              <strong>
                {grp.label} ({colorGradesByGroup(grp.key)}):
              </strong>{" "}
              {COLOR_GROUP_DESCRIPTIONS[grp.key]}
            </li>
          ))}
        </ul>

        <h2>Diamond Clarity grades (FL–I3)</h2>
        <ul>
          {CLARITY_GRADES.map((g) => (
            <li key={g.key}>
              <strong>
                {g.label} — {g.name}:
              </strong>{" "}
              {g.description}{" "}
              {g.eyeClean ? "(typically eye-clean)" : "(may be visible to the naked eye)"}
            </li>
          ))}
        </ul>

        <h2>Carat weight and face-up size (round brilliant)</h2>
        <p>
          Carat is a measure of weight, not size. Approximate face-up diameter
          by carat for a round brilliant diamond:
        </p>
        <ul>
          {CARAT_MM_TABLE.map((row) => (
            <li key={row.carat}>
              {row.carat.toFixed(2)} ct ≈ {row.mm.toFixed(1)} mm diameter
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
