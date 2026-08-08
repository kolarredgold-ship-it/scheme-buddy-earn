import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, LayoutDashboard, Wallet, LogOut, Menu, X, User, Shield, CreditCard, Briefcase, Trophy, Settings2, Sparkles, Download } from "lucide-react";
import UserPreferences from "@/components/UserPreferences";
import NotificationBell from "@/components/NotificationBell";
import techrolaLogo from "@/assets/techrola_logo.webp";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Schemes", icon: Home },
    { path: "/career-program", label: "Career", icon: Briefcase },
    { path: "/ai-tools", label: "Students AI", icon: Sparkles },
    ...(user
      ? [
          { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const bottomNavItems = [
    { type: "link" as const, path: "/", icon: Home, label: "Home" },
    { type: "link" as const, path: "/ai-tools", icon: Sparkles, label: "AI Tools" },
    { type: "link" as const, path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { type: "link" as const, path: "/install", icon: Download, label: "Install" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 bg-card border-b border-border transition-shadow duration-300 ${
          scrolled ? "shadow-[0_2px_10px_-4px_rgba(15,27,61,0.18)]" : ""
        }`}
      >
        {/* Navy brand strip */}
        <div className="h-1 w-full bg-primary" aria-hidden="true" />
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center group">
            <img src={techrolaLogo} alt="Techrola - Empowering Public & Students" className="h-9 md:h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200 border-b-2 ${
                  isActive(item.path)
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-primary hover:border-primary/40"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Button aria-label="Personalize feed" variant="ghost" size="icon" onClick={() => setPrefsOpen(true)} className="rounded-md h-9 w-9 hover:bg-primary/10 hover:text-primary" title="Personalize">
                  <Settings2 className="h-4 w-4" />
                </Button>
                <NotificationBell />
                <Link to="/dashboard" className="flex items-center gap-1.5 bg-accent/15 rounded-md px-3 py-1.5 hover:bg-accent/25 transition-colors">
                  <Wallet className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm font-bold">₹{profile?.wallet_balance?.toFixed(0) || '0'}</span>
                </Link>
                <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5">
                  <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{profile?.name || 'User'}</span>
                </div>
                <Button aria-label="Log out" variant="ghost" size="icon" onClick={signOut} className="rounded-md h-9 w-9 hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="rounded-md font-semibold border-primary/40 text-primary hover:bg-primary/10">Login</Button>
                </Link>
                <Link to="/subscription">
                  <Button size="sm" className="rounded-md font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>


          {/* Mobile: wallet + menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && profile && (
              <Link to="/dashboard" className="flex items-center gap-1 bg-accent/10 rounded-lg px-2.5 py-1.5">
                <Wallet className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-bold">₹{profile.wallet_balance?.toFixed(0) || '0'}</span>
              </Link>
            )}
            <button
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="h-10 w-10 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-card border-b shadow-lg p-4 space-y-1 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-md text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 border-t mt-2">
                {user && (
                  <button
                    onClick={() => { setPrefsOpen(true); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-md text-sm font-medium text-muted-foreground w-full hover:bg-muted transition-colors"
                  >
                    <Settings2 className="h-5 w-5" />
                    Personalize Feed
                  </button>
                )}
                {user ? (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-md text-sm font-medium text-destructive w-full hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-2 px-2">
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" className="w-full rounded-md">Login</Button>
                    </Link>
                    <Link to="/subscription" className="flex-1">
                      <Button className="w-full rounded-md bg-gradient-primary">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Career Program CTA - Above Footer */}
      <div className="container mx-auto px-3 md:px-4 mt-10 mb-2">
        <Link to="/career-program" className="block group">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(212,69%,39%)] via-[hsl(212,75%,31%)] to-[hsl(214,80%,20%)] p-5 sm:p-6 md:p-8 transition-all duration-500 hover:shadow-[0_0_40px_rgba(31,95,169,0.3)] hover:scale-[1.01]">
            {/* Animated background shapes */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            {/* Sparkle dots */}
            <div className="absolute top-4 right-8 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute bottom-6 right-16 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            <div className="absolute top-8 right-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 mb-4 text-[10px] md:text-xs font-semibold text-white uppercase tracking-wider">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Now Open — Limited Seats
              </div>

              {/* Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
                  <Briefcase className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight" >
                    Techrola Career Program
                  </h3>
                  <p className="text-white/70 text-[11px] md:text-xs font-medium">Work · Learn · Get Hired</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/90 text-xs md:text-sm mb-5 max-w-lg leading-relaxed">
                Start as a promoter, grow into a professional, and build your career with Techrola. 
                Earn rewards, get certified, and land real opportunities!
              </p>

              {/* Step indicators */}
              <div className="flex items-center gap-1 mb-5 flex-wrap">
                {["Register", "Subscribe", "Get EMP Code", "Promote", "Build Streak", "Get Hired"].map((step, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/25 flex items-center justify-center text-[9px] md:text-[10px] font-bold text-white">{i + 1}</span>
                      <span className="text-[9px] md:text-[10px] text-white/90 font-medium whitespace-nowrap">{step}</span>
                    </div>
                    {i < 5 && <div className="w-1.5 md:w-3 h-px bg-white/30 mx-0.5" />}
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold text-sm md:text-base px-6 py-3 rounded-md shadow-lg group-hover:shadow-xl group-hover:gap-3 transition-all duration-300">
                Start Your Career Journey
                <Trophy className="h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Nav - always visible */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom border-t border-border/40">
        <div className="flex justify-around items-center py-1.5 px-1">
          {bottomNavItems.map((item, idx) => {
            const active = isActive(item.path);
            const isAITools = item.path === "/ai-tools";
            return (
              <Link
                key={idx}
                to={item.path}
                className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-md min-w-[52px] flex-1"
              >
                <div className={`p-1.5 rounded-md transition-all duration-200 ${
                  active ? "bg-primary/10" : ""
                } ${isAITools ? "bg-gradient-to-br from-accent/25 to-accent/10" : ""}`}>
                  <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 ${
                    active ? "scale-110 text-primary" : "text-muted-foreground"
                  } ${isAITools ? "text-accent" : ""}`} />
                </div>
                <span className={`text-[9px] sm:text-[10px] font-medium text-center leading-none ${
                  active ? "text-primary" : "text-muted-foreground"
                } ${isAITools ? "text-accent font-semibold" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom nav spacer for mobile */}
      <div className="md:hidden h-16" aria-hidden="true" />

      {/* Personalize Preferences Popup */}
      {user && (
        <UserPreferences open={prefsOpen} onOpenChange={setPrefsOpen} />
      )}
    </div>
  );
};

export default Layout;
