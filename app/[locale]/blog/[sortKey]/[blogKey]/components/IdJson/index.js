/** @format */

import Script from "next/script";

export default function IdJson({ article, CONFIG }) {
  return (
    <Script
      id="blog-article-ld-json"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          image: [article.image],
          datePublished: article.created_time,
          dateModified: article.updated_time,
          author: [
            {
              "@type": "Organization",
              name: CONFIG["company.basic.company_name"],
            },
          ],
        }),
      }}
    />
  );
}
