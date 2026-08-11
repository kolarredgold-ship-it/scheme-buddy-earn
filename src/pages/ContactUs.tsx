import Layout from "@/components/Layout";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, MessageCircle, LifeBuoy } from "lucide-react";

const EMAIL = "omlaytechnologies@gmail.com";
const PHONE = "7899666679";
const PHONE_INTL = "+917899666679";

const ContactUs = () => (
  <Layout>
    <Seo
      title="Contact Techrola | Support for Schemes, AI Tools & Payments"
      description="Reach the Techrola support team in Bengaluru by email, phone or WhatsApp for help with government schemes, AI tools, subscriptions and refunds."
      path="/contact-us"
      keywords="Techrola contact, Techrola support, customer care, Omlay Technologies Bengaluru"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact Techrola",
        url: "https://techrola.in/contact-us",
        mainEntity: {
          "@type": "Organization",
          name: "Techrola",
          url: "https://techrola.in",
          email: EMAIL,
          telephone: PHONE_INTL,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Omlay Technologies",
            addressLocality: "Bengaluru",
            addressRegion: "Karnataka",
            addressCountry: "IN",
          },
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: EMAIL,
              telephone: PHONE_INTL,
              areaServed: "IN",
              availableLanguage: ["English", "Hindi", "Kannada"],
            },
          ],
        },
      }}
    />

    <div className="container mx-auto px-4 py-8 pb-20 md:pb-12 max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Contact</p>
      <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight">Contact Techrola support</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Questions about a scheme, an AI tool, your subscription or a refund? Our Bengaluru team is here
        to help and usually replies within one working day.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold">Email</h2>
                <a href={`mailto:${EMAIL}`} className="text-sm text-primary break-all hover:underline">
                  {EMAIL}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">Best for refunds, billing and account issues.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Phone</h2>
                <a href={`tel:${PHONE_INTL}`} className="text-sm text-primary hover:underline">
                  {PHONE}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">Mon–Sat, 10:00 AM – 6:00 PM IST.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">WhatsApp</h2>
                <a
                  href={`https://wa.me/${PHONE_INTL.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Chat with us
                </a>
                <p className="mt-1 text-xs text-muted-foreground">Fastest for quick scheme questions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Registered address</h2>
                <p className="text-sm text-muted-foreground">
                  Omlay Technologies
                  <br />
                  Bengaluru, Karnataka, India
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Support hours: Monday to Saturday, 10:00 AM – 6:00 PM IST. Emails received outside these
          hours are answered the next working day.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-xl md:text-2xl font-semibold">Before you write to us</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button asChild variant="outline" className="justify-start">
            <Link to="/refund-policy">Refund policy</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/subscription">Subscription & pricing</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link to="/about-us">About Techrola</Link>
          </Button>
        </div>
      </section>

      <div className="mt-8 flex items-start gap-3 rounded-lg border p-4">
        <LifeBuoy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Techrola is not a government body. We never ask for OTPs, bank passwords or fees for a
          government application. Always verify scheme details on the official government website
          before applying.
        </p>
      </div>
    </div>
  </Layout>
);

export default ContactUs;
