import { Link } from "react-router-dom";
import techrolaLogo from "@/assets/techrola_logo.webp";

const Footer = () => (
  <footer className="bg-[hsl(214_80%_20%)] text-white/80 mt-12">
    <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-[hsl(140_60%_35%)]" aria-hidden="true" />
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/">
            <img src={techrolaLogo} alt="Techrola Logo" className="h-8 w-auto mb-3 bg-white rounded-md p-1" />
          </Link>
          <p className="text-xs text-white/70 leading-relaxed">
            India's platform for AI-powered career education Tools and discover government scheme for your family. Free to explore, powerful with Pro.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-white">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="text-xs text-white/75 hover:text-accent transition-colors">Home</Link></li>
            <li><Link to="/career-program" className="text-xs text-white/75 hover:text-accent transition-colors">Career Program</Link></li>
            <li><Link to="/leaderboard" className="text-xs text-white/75 hover:text-accent transition-colors">Leaderboard</Link></li>
            <li><Link to="/subscription" className="text-xs text-white/75 hover:text-accent transition-colors">Plans & Pricing</Link></li>
            <li><Link to="/create-report" className="text-xs text-white/75 hover:text-accent transition-colors">AI Report Generator</Link></li>
            <li><Link to="/mock-interview" className="text-xs text-white/75 hover:text-accent transition-colors">AI Mock Interview</Link></li>
            <li><Link to="/install" className="text-xs text-white/75 hover:text-accent transition-colors">Install App</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-white">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy-policy" className="text-xs text-white/75 hover:text-accent transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms-conditions" className="text-xs text-white/75 hover:text-accent transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/refund-policy" className="text-xs text-white/75 hover:text-accent transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold text-sm mb-3 text-white">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/about-us" className="text-xs text-white/75 hover:text-accent transition-colors">About Us</Link></li>
            <li><Link to="/contact-us" className="text-xs text-white/75 hover:text-accent transition-colors">Contact Us</Link></li>
            <li><a href="mailto:omlaytechnologies@gmail.com" className="text-xs text-white/75 hover:text-accent transition-colors">omlaytechnologies@gmail.com</a></li>
            <li><a href="tel:7899666679" className="text-xs text-white/75 hover:text-accent transition-colors">7899666679</a></li>
          </ul>
        </div>
      </div>

      {/* Payment & Copyright */}
      <div className="mt-8 pt-6 border-t border-white/15">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-white/60">
            © {new Date().getFullYear()} Techrola. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-white/60">
            <span>🔒 Secured payments by</span>
            <span className="font-bold text-[#072654] bg-white border border-white/20 px-2 py-0.5 rounded-md">Razorpay</span>
          </div>

        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
