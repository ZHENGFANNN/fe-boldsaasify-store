// 品牌页 /[locale]/company（About / 可持续故事）
//
// Server component：并行取多语言 + 页面配置，渲染 hero + 品牌故事 + 可持续承诺 + CTA。
// 完全照 education/page.jsx 范式：骨架写死 JSX，文案全走 store.company.* + 英文兜底，
// generateMetadata 出 title/description + buildAlternates("/company", locale)。
//
// 重复结构（可持续承诺要点）用「固定数量的扁平 key」（pillar1_title / pillar1_desc …），
// 运营在现有 ERP Language 页即可编辑，无需任何 ERP/后端改动。
//
// next.config.mjs 的 /company/contact 重定向是精确路径，不影响 /company 根。

import getRemoteLanguage from "@/config/Api/getRemoteLanguage";
import getRemoteConfig from "@/config/Api/getRemoteConfig";
import { buildAlternates } from "@/config/seo";

import styles from "./page.module.scss";

const SHOP_HREF = "/product/rings";

async function getData({ locale }) {
  const [LANG, CONFIG] = await Promise.all([
    getRemoteLanguage({
      locale,
      nameSpace: ["store.company", "common.base"]
    }),
    getRemoteConfig({ locale, nameSpace: ["common.base"] })
  ]);
  return { LANG, CONFIG };
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const { LANG, CONFIG } = await getData({ locale });
  const company = CONFIG?.["common.base"]?.company_name || "";
  const title =
    LANG?.["store.company.meta_title"] || "About Us — Our Story & Promise";
  return {
    title: company ? `${title} - ${company}` : title,
    description:
      LANG?.["store.company.meta_description"] ||
      "Learn the story behind our lab-grown diamond jewelry — our commitment to ethical sourcing, sustainability and craftsmanship that lasts a lifetime.",
    alternates: buildAlternates("/company", locale)
  };
}

export default async function CompanyPage({ params }) {
  const { locale } = await params;
  const { LANG } = await getData({ locale });

  const t = (key, fallback) => LANG?.[key] ?? fallback;

  // 可持续 / 品牌承诺要点（固定 4 个，扁平 key 便于运营编辑）。
  const pillars = [
    {
      title: t("store.company.pillar1_title", "Ethically sourced"),
      desc: t(
        "store.company.pillar1_desc",
        "Every diamond is lab-grown, conflict-free and fully traceable — beauty you can feel good about wearing."
      )
    },
    {
      title: t("store.company.pillar2_title", "Kinder to the planet"),
      desc: t(
        "store.company.pillar2_desc",
        "Lab-grown diamonds require no mining, dramatically reducing land disruption, water use and carbon footprint."
      )
    },
    {
      title: t("store.company.pillar3_title", "Honest pricing"),
      desc: t(
        "store.company.pillar3_desc",
        "The same brilliance and certification as mined diamonds, without the markup — value that goes straight to you."
      )
    },
    {
      title: t("store.company.pillar4_title", "Made to last"),
      desc: t(
        "store.company.pillar4_desc",
        "Crafted by skilled jewelers and backed by lasting guarantees, so your piece stays beautiful for generations."
      )
    }
  ];

  // 品牌故事段落（固定 3 段，扁平 key）。
  const story = [
    t(
      "store.company.story_p1",
      "We started with a simple belief: that a symbol of love should never come at the expense of people or the planet. So we set out to create fine jewelry that's as conscientious as it is beautiful."
    ),
    t(
      "store.company.story_p2",
      "Lab-grown diamonds are real diamonds — chemically, physically and optically identical to mined stones. Grown in advanced laboratories rather than dug from the earth, they let us offer exceptional quality and brilliance with full transparency about where every stone comes from."
    ),
    t(
      "store.company.story_p3",
      "From the first sketch to the final polish, every piece is designed and crafted to be treasured. We're proud to make luxury that's modern, meaningful and made to be passed down."
    )
  ];

  return (
    <main className={styles.page} data-role="company">
      {/* ---------- Hero ---------- */}
      <header className={styles.hero}>
        <p className={styles.kicker}>
          {t("store.company.kicker", "Our Story")}
        </p>
        <h1 className={styles.heroTitle}>
          {t("store.company.hero_title", "Brilliance with a conscience")}
        </h1>
        <p className={styles.heroSubtitle}>
          {t(
            "store.company.hero_subtitle",
            "We craft lab-grown diamond jewelry that celebrates love without compromise — ethical, sustainable and made to last a lifetime."
          )}
        </p>
      </header>

      {/* ---------- 品牌故事 ---------- */}
      <section className={styles.story} aria-labelledby="company-story-heading">
        <h2 id="company-story-heading" className={styles.sectionTitle}>
          {t("store.company.story_title", "Who we are")}
        </h2>
        <div className={styles.storyBody}>
          {story.map((p, i) => (
            <p key={i} className={styles.storyText}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ---------- 可持续承诺 ---------- */}
      <section
        className={styles.pillars}
        aria-labelledby="company-promise-heading"
      >
        <div className={styles.pillarsHead}>
          <h2 id="company-promise-heading" className={styles.sectionTitle}>
            {t("store.company.promise_title", "Our promise")}
          </h2>
          <p className={styles.pillarsLead}>
            {t(
              "store.company.promise_lead",
              "Four commitments behind every piece we make."
            )}
          </p>
        </div>
        <div className={styles.pillarGrid}>
          {pillars.map((p, i) => (
            <div key={i} className={styles.pillar}>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 收尾购物 CTA ---------- */}
      <aside className={styles.shopCta}>
        <p className={styles.shopText}>
          {t(
            "store.company.cta_lead",
            "Find a piece that tells your story — beautifully made, responsibly sourced."
          )}
        </p>
        <a className={styles.shopBtn} href={SHOP_HREF}>
          {t("store.company.cta_button", "Shop the collection")}
        </a>
      </aside>

      {/* SEO/可访问性：品牌与可持续主题参考文本（可视隐藏、不 aria-hidden，爬虫与读屏均可获取）。 */}
      <section className={styles.srOnly} aria-label="About our lab-grown diamond brand">
        <h2>About our lab-grown diamonds</h2>
        <p>
          Our jewelry is made exclusively with lab-grown (also called
          lab-created or cultured) diamonds. These are genuine diamonds with the
          same chemical, physical and optical properties as mined diamonds, but
          they are created in controlled laboratory conditions instead of being
          extracted from the earth.
        </p>
        <h2>Ethical and sustainable sourcing</h2>
        <p>
          Because lab-grown diamonds require no mining, they avoid the land
          disruption, water consumption and carbon emissions associated with
          traditional diamond extraction, and they are inherently conflict-free
          and fully traceable. We pair responsibly created stones with
          recycled-metal settings wherever possible to further reduce our
          environmental impact.
        </p>
        <h2>Craftsmanship and lasting value</h2>
        <p>
          Every engagement ring, wedding band, necklace, bracelet and pair of
          earrings is designed and crafted by skilled jewelers and backed by
          lasting guarantees, offering the brilliance and certification of fine
          diamond jewelry at honest, transparent prices.
        </p>
      </section>
    </main>
  );
}
