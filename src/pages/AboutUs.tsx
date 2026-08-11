import Layout from "@/components/Layout";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Landmark, Sparkles, Briefcase, ShieldCheck, ArrowRight } from "lucide-react";

const offerings = [
  {
    icon: Landmark,
    title: "Government schemes discovery",
    body: "A searchable database of 2500+ central and state government schemes, scholarships and welfare programs with eligibility, documents and official apply links.",
  },
  {
    icon: Sparkles,
    title: "AI tools for students",
    body: "Internship report generator, resume and cover-letter builder, SOP writer, study notes, career roadmap and 20+ more tools built for Indian students.",
  },
  {
    icon: GraduationCap,
    title: "AI mock interviews",
    body: "Practice HR and technical interviews with instant AI feedback, plus thousands of curated interview questions and flash cards.",
  },
  {
    icon: Briefcase,
    title: "Career Program (work from home)",
    body: "A guided 6-step program that helps students build skills, apply to internships and jobs, and earn through our referral rewards.",
  },
];

const AboutUs = () => (
  <Layout>
    <Seo
      title="About Techrola | Government Schemes & AI Career Tools for India"
      description="Techrola is an Indian edu-tech platform helping students and citizens discover 2500+ government schemes and use AI tools for resumes, reports, interviews and careers."
      path="/about-us"
      keywords="about Techrola, government schemes platform India, AI tools for students, career program"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Techrola",
        url: "https://techrola.in",
        description:
          "Indian edu-tech platform for government scheme discovery, AI student tools and career training.",
        email: "omlaytechnologies@gmail.com",
        telephone: "+91-7899666679",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          addressCountry: "IN",
        },
      }}
    />

    <div className="container mx-auto px-4 py-8 pb-20 md:pb-12 max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">About us</p>
      <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight">
        Techrola — government schemes and AI career tools for India
      </h1>
      <p className="mt-4 text-base md:text-lg leading-relaxed text-muted-foreground">
        Techrola is an Indian edu-tech platform operated by Omlay Technologies, Bengaluru. We help
        students, job-seekers, farmers, women and every citizen find the government benefits they are
        entitled to — and give them the AI tools they need to build a career.
      </p>

      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-semibold">Our mission</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Thousands of schemes go unclaimed every year simply because people never hear about them, or
          cannot decode the eligibility rules. We bridge that gap: one place to discover, understand and
          apply — in plain language, on a phone, for free.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-semibold">What we offer</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {offerings.map((o) => (
            <Card key={o.title} className="h-full">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <o.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-3 font-semibold">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-semibold">How Techrola works</h2>
        <ol className="mt-4 space-y-3 text-muted-foreground">
          <li className="flex gap-3">
            <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
            <span>Search or browse schemes by state, category and beneficiary type — no account needed.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
            <span>Read simplified eligibility, documents and benefits, then apply on the official portal.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
            <span>Use our AI tools to build your resume, internship report, SOP and interview skills.</span>
          </li>
          <li className="flex gap-3">
            <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
            <span>Join the Career Program (work from home) to keep learning and earn referral rewards.</span>
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-semibold">Trust & transparency</h2>
        <div className="mt-4 flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Scheme information is aggregated from public government sources and enriched with AI.
            Note: This is AI-generated updates. Please verify details from official government
            websites before applying. Payments are processed securely by Razorpay. Techrola is not a
            government body and never charges for a government application.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-xl border bg-primary/5 p-6 text-center">
        <h2 className="text-xl md:text-2xl font-semibold">Have a question?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Our Bengaluru support team replies within one working day.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/contact-us">
              Contact us <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/ai-tools">Explore AI tools</Link>
          </Button>
        </div>
      </section>
    </div>
  </Layout>
);

export default AboutUs;
