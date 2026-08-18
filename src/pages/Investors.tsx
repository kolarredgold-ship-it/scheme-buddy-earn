import Layout from "@/components/Layout";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  TrendingUp,
  Users,
  Landmark,
  Sparkles,
  Wallet,
  Target,
  ShieldCheck,
  Mail,
  Phone,
  ArrowRight,
  PieChart,
} from "lucide-react";

const EMAIL = "omlaytechnologies@gmail.com";
const PHONE = "7899666679";
const PHONE_INTL = "+917899666679";

const highlights = [
  { icon: Landmark, label: "Government schemes indexed", value: "7,700+" },
  { icon: Sparkles, label: "AI tools for students", value: "20+" },
  { icon: Users, label: "Annual plan price", value: "₹999 (₹83.25/m)" },
  { icon: TrendingUp, label: "SEO blog articles published", value: "500+" },
];

const useOfFunds = [
  {
    share: "55%",
    title: "Marketing & user acquisition",
    body: "The primary use of capital. Performance marketing on Google, Meta and YouTube targeting students and job-seekers in Tier 2/3 India, campus ambassador drives, regional-language creatives, and influencer partnerships with education creators.",
    icon: Megaphone,
    accent: "bg-orange-500",
  },
  {
    share: "20%",
    title: "Product & AI infrastructure",
    body: "AI model usage, scheme-data pipelines, faster mobile experience, and new tools requested by students.",
    icon: Sparkles,
    accent: "bg-blue-600",
  },
  {
    share: "15%",
    title: "Content & SEO engine",
    body: "Daily scheme updates and SEO articles across states and languages — our lowest-cost, compounding acquisition channel.",
    icon: TrendingUp,
    accent: "bg-green-600",
  },
  {
    share: "10%",
    title: "Operations & compliance",
    body: "Support team, payment operations, legal and data-protection compliance.",
    icon: ShieldCheck,
    accent: "bg-slate-600",
  },
];

const marketingPlan = [
  {
    title: "Paid acquisition",
    body: "Search and social campaigns mapped to high-intent queries such as scholarship, government job and internship report searches.",
  },
  {
    title: "Organic SEO moat",
    body: "Every scheme and blog page is indexed with canonical tags, sitemap automation and IndexNow submission — traffic that keeps paying back after spend stops.",
  },
  {
    title: "Campus & referral growth",
    body: "Student referral rewards and campus promoters through the Techrola Career Program convert word-of-mouth into measurable signups.",
  },
  {
    title: "Regional language expansion",
    body: "Hindi, Kannada, Tamil, Telugu and Marathi creatives and landing pages to reach first-time internet users.",
  },
];

const revenue = [
  { title: "Pro subscriptions", body: "₹999 per year (₹83.25/month equivalent) unlocking full scheme details and AI tools." },
  { title: "Credit top-ups", body: "₹499 packs for additional AI tool credits beyond the included quota." },
  { title: "Career Program", body: "Guided work-from-home program with referral payouts that drives retention and virality." },
];

const Investors = () => (
  <Layout>
    <Seo
      title="Investor Relations | Techrola — India's Schemes & AI Career Platform"
      description="Investor information for Techrola: business model, traction, growth strategy and use of funds, with the majority of capital allocated to marketing and user acquisition across India."
      path="/investors"
      keywords="Techrola investors, edu-tech investment India, invest in Techrola, startup funding marketing, government schemes platform investment"
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "InvestorRelationsWebPage",
          name: "Techrola Investor Relations",
          url: "https://techrola.in/investors",
          description:
            "Business model, traction, growth strategy and use of funds for Techrola, an Indian edu-tech platform for government schemes and AI career tools.",
          about: {
            "@type": "Organization",
            name: "Techrola",
            legalName: "Omlay Technologies",
            url: "https://techrola.in",
            email: EMAIL,
            telephone: PHONE_INTL,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Bengaluru",
              addressRegion: "Karnataka",
              addressCountry: "IN",
            },
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://techrola.in/" },
            { "@type": "ListItem", position: 2, name: "Investors", item: "https://techrola.in/investors" },
          ],
        },
      ]}
    />

    <div className="container mx-auto px-4 py-8 pb-20 md:pb-14 max-w-5xl">
      {/* Hero */}
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Investor Relations</p>
      <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight">
        Invest in Techrola — India's schemes discovery and AI career platform
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground max-w-3xl">
        Techrola (operated by Omlay Technologies, Bengaluru) helps Indian students and citizens
        discover government schemes and build careers with AI tools. We are raising growth capital,
        with the majority of it directed at marketing and user acquisition to convert an already
        working product and SEO base into national scale.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <a href={`mailto:${EMAIL}?subject=Investor%20enquiry%20-%20Techrola`}>
            Request the investor deck <ArrowRight className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={`tel:${PHONE_INTL}`}>Talk to the founders</a>
        </Button>
      </div>

      {/* Snapshot */}
      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-semibold">Company snapshot</h2>
        <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <Card key={h.label}>
              <CardContent className="p-4">
                <h.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-lg font-bold leading-tight">{h.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{h.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Figures reflect the live platform. Detailed revenue, cohort and unit-economics data is
          shared with qualified investors under NDA.
        </p>
      </section>

      {/* Problem & solution */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">The problem</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Thousands of central and state schemes, scholarships and job notifications are spread
              across hundreds of government portals. Students in Tier 2 and Tier 3 India miss
              benefits simply because the information is fragmented, in English, and hard to act on.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">Our solution</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              One mobile-first platform that aggregates and updates schemes daily, explains
              eligibility in plain language, and pairs it with AI tools — internship reports,
              resumes, SOPs, mock interviews — that students pay for at an affordable annual price.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Use of funds — main focus */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold">Use of funds</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-3xl">
          The product, payments and content engine already run. Capital is therefore weighted
          heavily toward <strong className="text-foreground">marketing and user acquisition</strong>,
          where every rupee maps to trackable signups and subscription conversions.
        </p>

        <div className="mt-5 space-y-3">
          {useOfFunds.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-semibold">{f.title}</h3>
                      <span className="text-sm font-bold text-primary shrink-0">{f.share}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${f.accent} rounded-full`} style={{ width: f.share }} />
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Marketing strategy */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold">Where the marketing funds go</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {marketingPlan.map((m) => (
            <Card key={m.title}>
              <CardContent className="p-5">
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          Spend is governed by clear guardrails: campaign-level CAC targets, payback measured against
          the ₹999 annual plan, weekly channel reviews, and a hard rule that scaling only follows a
          proven cohort — no untracked brand spend.
        </div>
      </section>

      {/* Revenue model */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-xl md:text-2xl font-semibold">Revenue model</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {revenue.map((r) => (
            <Card key={r.title}>
              <CardContent className="p-5">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Payments are processed securely through Razorpay (UPI, cards and net banking), with
          subscriptions renewing annually.
        </p>
      </section>

      {/* Governance */}
      <section className="mt-12">
        <h2 className="text-xl md:text-2xl font-semibold">Governance & transparency</h2>
        <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
          <li>• Operated by Omlay Technologies, Bengaluru, Karnataka, India.</li>
          <li>• Monthly investor reporting on traffic, signups, subscriptions, CAC and runway.</li>
          <li>• Marketing spend reported channel-by-channel with attribution data.</li>
          <li>• Techrola is an independent private platform and is not a government body; scheme information is aggregated from public sources with a verification disclaimer.</li>
          <li>
            • Policies:{" "}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy</Link>,{" "}
            <Link to="/terms-conditions" className="text-primary hover:underline">Terms</Link>,{" "}
            <Link to="/refund-policy" className="text-primary hover:underline">Refunds</Link>.
          </li>
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-12 rounded-xl border bg-muted/30 p-6">
        <h2 className="text-xl md:text-2xl font-semibold">Investor contact</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          For the detailed deck, financials and data room access, reach out directly. We respond
          within one working day.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <a href={`mailto:${EMAIL}?subject=Investor%20enquiry%20-%20Techrola`} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Mail className="h-4 w-4" /> {EMAIL}
          </a>
          <a href={`tel:${PHONE_INTL}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Phone className="h-4 w-4" /> {PHONE}
          </a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          This page is for information only and is not an offer or solicitation to buy or sell
          securities. Any investment is subject to definitive documentation and applicable law.
        </p>
      </section>
    </div>
  </Layout>
);

export default Investors;
