import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://smartlio.in";

type SeoProps = {
  title: string;
  description: string;
  path: string;
  keywords?: string;
  noindex?: boolean;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

/** Per-route head tags (title, description, canonical, og/twitter, JSON-LD). */
const Seo = ({ title, description, path, keywords, noindex, image, type = "website", jsonLd }: SeoProps) => {
  const canonical = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? "noindex,follow" : "index,follow"} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      {image?.startsWith("https://") && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image?.startsWith("https://") && <meta name="twitter:image" content={image} />}
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(b)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
