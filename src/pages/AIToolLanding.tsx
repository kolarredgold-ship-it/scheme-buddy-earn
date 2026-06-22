import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { findLanding, aiToolLandings } from "@/data/aiToolLandings";

const SITE_URL = "https://techrola.in";

const AIToolLanding = () => {
  const { slug = "" } = useParams();
  const data = findLanding(slug);

  if (!data) return <Navigate to="/ai-tools" replace />;

  const canonical = `${SITE_URL}/ai/${data.slug}`;
  const related = aiToolLandings.filter((l) => l.slug !== data.slug).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: data.h1,
    description: data.metaDescription,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: canonical,
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    provider: { "@type": "Organization", name: "Techrola", url: SITE_URL },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <Layout>
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.metaDescription} />
        <meta name="keywords" content={data.keywords} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={data.metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={data.title} />
        <meta name="twitter:description" content={data.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>

      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 pb-24 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-4" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-primary">Home</Link> /{" "}
          <Link to="/ai-tools" className="hover:text-primary">AI Tools</Link> /{" "}
          <span className="text-foreground">{data.h1}</span>
        </nav>

        {/* Hero */}
        <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${data.gradient} p-6 md:p-10 text-white mb-8`}>
          <div className="absolute -right-10 -top-10 text-9xl opacity-20 select-none">{data.icon}</div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> AI-Powered • Free to Start
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
              {data.h1}
            </h1>
            <p className="text-base md:text-lg opacity-95 max-w-2xl mb-6">{data.tagline}</p>
            <Link
              to={data.toolPath}
              className="inline-flex items-center gap-2 bg-white text-foreground font-bold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition"
            >
              {data.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Intro */}
        <section className="prose prose-sm md:prose-base max-w-none mb-10">
          <p className="text-foreground/85 text-base md:text-lg leading-relaxed">{data.intro}</p>
        </section>

        {/* Benefits */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold mb-5">Why use {data.h1}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.benefits.map((b, i) => (
              <div key={i} className="rounded-2xl border border-border bg-background p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold mb-5">How it works</h2>
          <ol className="space-y-3">
            {data.howItWorks.map((step, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
                <span className={`h-7 w-7 rounded-full bg-gradient-to-br ${data.gradient} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                  {i + 1}
                </span>
                <span className="text-sm md:text-base text-foreground/85 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Use cases */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold mb-5">Who is this for?</h2>
          <div className="flex flex-wrap gap-2">
            {data.useCases.map((u, i) => (
              <span key={i} className="inline-flex items-center bg-primary/10 text-primary text-xs md:text-sm font-medium rounded-full px-3 py-1.5">
                {u}
              </span>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-bold mb-5">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {data.faqs.map((f, i) => (
              <details key={i} className="group rounded-xl border border-border bg-background p-4">
                <summary className="font-semibold text-foreground cursor-pointer list-none flex justify-between items-center gap-3">
                  <span>{f.q}</span>
                  <span className="text-primary text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={`rounded-3xl bg-gradient-to-br ${data.gradient} p-6 md:p-10 text-white text-center mb-10`}>
          <h2 className="text-xl md:text-3xl font-extrabold mb-2">Ready to try {data.h1}?</h2>
          <p className="text-sm md:text-base opacity-95 mb-5">{data.tagline}</p>
          <Link
            to={data.toolPath}
            className="inline-flex items-center gap-2 bg-white text-foreground font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition"
          >
            {data.cta} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs opacity-80 mt-4">
            Note: All AI-generated content is for guidance. Please review and personalise before submission.
          </p>
        </section>

        {/* Related tools */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-5">Explore more AI tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/ai/${r.slug}`}
                className="group rounded-xl border border-border bg-background p-3 md:p-4 hover:border-primary transition"
              >
                <div className="text-2xl mb-1.5">{r.icon}</div>
                <div className="font-semibold text-xs md:text-sm text-foreground leading-tight mb-1">
                  {r.h1}
                </div>
                <div className="text-[11px] md:text-xs text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Learn more <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AIToolLanding;
