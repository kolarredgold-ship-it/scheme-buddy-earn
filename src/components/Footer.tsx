import { Link } from "react-router-dom";
import techrolaLogo from "@/assets/techrola_logo.png";

const Footer = () => (
  <footer className="bg-card border-t border-border/40 mt-12">
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/">
            <img src={techrolaLogo} alt="TechRola" className="h-8 w-auto mb-3" />
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Empowering citizens with easy access to 550+ government schemes, scholarships & welfare programs.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/career-program" className="text-xs text-muted-foreground hover:text-primary transition-colors">Career Program</Link></li>
            <li><Link to="/leaderboard" className="text-xs text-muted-foreground hover:text-primary transition-colors">Leaderboard</Link></li>
            <li><Link to="/subscription" className="text-xs text-muted-foreground hover:text-primary transition-colors">Plans & Pricing</Link></li>
            <li><Link to="/create-report" className="text-xs text-muted-foreground hover:text-primary transition-colors">AI Report Generator</Link></li>
            <li><Link to="/mock-interview" className="text-xs text-muted-foreground hover:text-primary transition-colors">AI Mock Interview</Link></li>
            <li><Link to="/install" className="text-xs text-muted-foreground hover:text-primary transition-colors">Install App</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Legal</h4>
          <ul className="space-y-2">
            <li><Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms-conditions" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/refund-policy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/about-us" className="text-xs text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
            <li><Link to="/contact-us" className="text-xs text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
            <li><a href="mailto:omlaytechnologies@gmail.com" className="text-xs text-muted-foreground hover:text-primary transition-colors">omlaytechnologies@gmail.com</a></li>
            <li><a href="tel:7899666679" className="text-xs text-muted-foreground hover:text-primary transition-colors">7899666679</a></li>
          </ul>
        </div>
      </div>

      {/* Payment & Copyright */}
      <div className="mt-8 pt-6 border-t border-border/40">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} TechRola. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Secured payments by</span>
            <span className="font-semibold text-foreground">Airpay</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
