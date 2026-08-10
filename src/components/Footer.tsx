import { Link } from "react-router-dom";
import techrolaLogo from "@/assets/techrola_logo.webp";
import { aiToolLandings } from "@/data/aiToolLandings";
import { Mail, Phone, MapPin, Download, ExternalLink, BookOpen, Briefcase, Wand2, GraduationCap, FileText, HelpCircle, Shield, CreditCard, Sparkles } from "lucide-react";

const footerLinks = {
  explore: [
    { label: "Government Schemes", to: "/" },
    { label: "AI Tools", to: "/ai-tools" },
    { label: "Career Program", to: "/career-program" },
    { label: "AI Report Generator", to: "/create-report" },
    { label: "Mock Interview", to: "/mock-interview" },
  ],
  company: [
    { label: "About Us", to: "/about-us" },
    { label: "Contact Us", to: "/contact-us" },
    { label: "Blog", to: "/blog" },
    { label: "Leaderboard", to: "/leaderboard" },
    { label: "Install App", to: "/install" },
  ],
  legal: [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms-conditions" },
    { label: "Refund Policy", to: "/refund-policy" },
  ],
};

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-200 mt-12">
      {/* Tricolour accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-blue-600 to-green-600" aria-hidden="true" />

      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand + About */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={techrolaLogo} alt="Techrola Logo" className="h-9 w-auto bg-white rounded-md px-1.5 py-1" />
              <span className="text-xl font-bold text-white tracking-tight">Techrola</span>
            </Link>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              India's trusted edu-tech platform for AI-powered career tools, government schemes, and skill-building programs. Free to explore, powerful with Pro.
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-300">
              <a href="mailto:omlaytechnologies@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-orange-500" /> omlaytechnologies@gmail.com
              </a>
              <a href="tel:7899666679" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-orange-500" /> 7899666679
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" /> India
              </span>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4 text-white flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-orange-500" /> Explore
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.explore.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-300 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4 text-white flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" /> Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-300 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-4 text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" /> Legal
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-slate-300 hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Card */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-orange-500" /> Get Techrola App
              </h4>
              <p className="text-xs text-slate-300 mb-3">Access schemes, AI tools & career programs on the go.</p>
              <Link to="/install">
                <button className="w-full text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-2 transition-colors flex items-center justify-center gap-1.5">
                  Install Now <ExternalLink className="h-3 w-3" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400 text-center md:text-left">
              © {year} Techrola. All rights reserved.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5" />
                <span>Secured payments by</span>
                <span className="font-bold text-slate-900 bg-white border border-slate-600 px-2 py-0.5 rounded">Razorpay</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CreditCard className="h-3.5 w-3.5" />
                <span>UPI · Cards · Net Banking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
