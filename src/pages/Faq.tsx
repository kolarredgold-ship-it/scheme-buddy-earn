import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import Seo from "@/components/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Landmark, CheckCircle2, FileText, CreditCard, ArrowRight } from "lucide-react";

type Faq = { q: string; a: string };

const sections: { id: string; title: string; icon: typeof Landmark; items: Faq[] }[] = [
  {
    id: "how-schemes-work",
    title: "How government schemes work on Techrola",
    icon: Landmark,
    items: [
      {
        q: "What is Techrola and what does it do with government schemes?",
        a: "Techrola is an Indian edu-tech platform that collects central and state government schemes, scholarships and welfare programmes into one searchable place. Each listing summarises the benefit, who it is meant for, the documents usually asked for, and where to apply on the official government website.",
      },
      {
        q: "Where does the scheme information come from?",
        a: "Listings are compiled from public government sources and refreshed daily. Scheme summaries are AI-assisted, so always confirm the final details on the official government portal linked on the scheme page before you apply.",
      },
      {
        q: "Does Techrola process my scheme application or pay the benefit?",
        a: "No. Techrola is an information and career-tools platform. Applications are submitted on the official government portal, and the benefit is paid by the concerned government department directly to you. Techrola never asks for money on behalf of a government scheme.",
      },
      {
        q: "How do I find schemes for my state?",
        a: "Use the state selector and the category filters on the home page, or type a plain-language question in the search bar (for example: 'scholarship for girl students in Karnataka'). Your state preference is saved for future visits.",
      },
    ],
  },
  {
    id: "eligibility",
    title: "Checking your eligibility",
    icon: CheckCircle2,
    items: [
      {
        q: "How do I know if I am eligible for a scheme?",
        a: "Every scheme page has an eligibility section listing the typical conditions — age, income limit, state of residence, caste or category, education level, occupation and gender criteria where they apply. Compare each condition against your documents before you start the application.",
      },
      {
        q: "What documents are usually required?",
        a: "Most schemes ask for Aadhaar, a recent photograph, a bank passbook or cancelled cheque for direct benefit transfer, an income certificate, a caste or category certificate where relevant, a domicile or residence proof, and education marksheets for scholarships.",
      },
      {
        q: "Can I apply for more than one scheme at a time?",
        a: "Usually yes, as long as the schemes are not mutually exclusive. Some scholarships specifically state that a student may not receive two government scholarships for the same academic year — check the conditions on the official page.",
      },
      {
        q: "Are there schemes for students, farmers and women specifically?",
        a: "Yes. Techrola groups schemes by category — students and scholarships, farmers and agriculture, women and girl child, employment and jobs, health, housing, business loans and senior citizens — so you can browse only what fits you.",
      },
    ],
  },
  {
    id: "application-steps",
    title: "Application steps",
    icon: FileText,
    items: [
      {
        q: "What are the steps to apply for a scheme?",
        a: "1) Open the scheme page and read the eligibility conditions. 2) Keep scanned copies of the required documents ready. 3) Click the official apply link on the scheme page. 4) Register or log in on the government portal. 5) Fill the application form and upload documents. 6) Submit and save the application or reference number. 7) Track the status on the same portal.",
      },
      {
        q: "How long does approval take?",
        a: "It depends entirely on the department and the scheme — some scholarships are processed within a few weeks of the closing date, while housing or loan schemes can take a few months. Techrola cannot influence or speed up approval.",
      },
      {
        q: "My application was rejected. What should I do?",
        a: "Check the rejection reason on the government portal. Most rejections are caused by a mismatched name or date of birth across documents, an unreadable upload, or a missing income certificate. Correct the issue and re-apply in the next application window.",
      },
      {
        q: "How do I avoid scheme and job scams?",
        a: "Genuine government schemes never ask for a registration fee, an agent commission, or your OTP or bank password. Only use the official links shown on the scheme page, and read our blog guides on spotting fake job and data-entry offers.",
      },
    ],
  },
  {
    id: "payment",
    title: "Plans, payment and refunds",
    icon: CreditCard,
    items: [
      {
        q: "Is Techrola free to use?",
        a: "Browsing and searching schemes is free. Every AI tool also includes one free generation so you can try it. Pro unlocks full scheme details and higher AI usage limits.",
      },
      {
        q: "What does Pro cost?",
        a: "Pro is ₹83.25 per month, billed annually as ₹999 for one year. You can also buy a ₹499 top-up for extra AI generations at any time without upgrading.",
      },
      {
        q: "How do I pay, and is it secure?",
        a: "Payments are handled by Razorpay, which supports UPI, cards, net banking and wallets. Techrola never sees or stores your card or UPI credentials, and Pro access is unlocked automatically the moment the payment is verified.",
      },
      {
        q: "When does my subscription expire and how do I renew?",
        a: "Pro runs for one year from the date of payment. Your expiry date is shown on the Subscription and Dashboard pages, and you can renew early — the remaining days are added on top of the new year.",
      },
      {
        q: "Can I get a refund?",
        a: "Refunds are governed by our Refund Policy. If a payment was deducted but Pro was not activated, contact us with the payment reference and we will resolve or refund it.",
      },
    ],
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://techrola.in/" },
      { "@type": "ListItem", position: 2, name: "FAQ", item: "https://techrola.in/faq" },
    ],
  },
];

const Faq = () => (
  <Layout>
    <Seo
      title="Techrola FAQ: Schemes, Eligibility, Applying & Payment"
      description="Answers on how government schemes work on Techrola, who is eligible, the step-by-step application process, Pro pricing at ₹83.25/month and secure Razorpay payments."
      path="/faq"
      keywords="government scheme FAQ, scheme eligibility India, how to apply for government scheme, Techrola pricing, Techrola refund"
      jsonLd={jsonLd}
    />

    <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-xs font-semibold rounded-md bg-primary/10 text-primary px-3 py-1">
          <HelpCircle className="h-3.5 w-3.5" /> Help centre
        </span>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
          Frequently asked questions
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Everything about how government schemes work on Techrola, how to check your eligibility,
          the steps to apply, and how plans and payments are handled.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-xs font-medium rounded-md border px-3 py-1.5 hover:bg-muted transition-colors"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </div>
    </section>

    <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl space-y-10">
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-24">
          <h2 className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tight mb-4">
            <s.icon className="h-5 w-5 text-primary" /> {s.title}
          </h2>
          <Accordion type="single" collapsible className="rounded-md border divide-y">
            {s.items.map((f, i) => (
              <AccordionItem key={i} value={`${s.id}-${i}`} className="border-0 px-4">
                <AccordionTrigger className="text-left text-sm md:text-base font-semibold py-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm md:text-base leading-relaxed text-muted-foreground pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}

      <Card className="bg-muted/40">
        <CardContent className="p-6 text-center space-y-3">
          <h2 className="text-lg md:text-xl font-bold">Still have a question?</h2>
          <p className="text-sm text-muted-foreground">
            Write to us and we will get back to you, usually within one working day.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Button asChild>
              <Link to="/contact-us">
                Contact us <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/subscription">See Pro pricing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </Layout>
);

export default Faq;
