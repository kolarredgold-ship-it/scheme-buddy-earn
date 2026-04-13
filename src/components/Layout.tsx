import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, LayoutDashboard, Wallet, LogOut, Menu, X, User, Shield, CreditCard, Briefcase, Trophy } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import techrolaLogo from "@/assets/techrola_logo.png";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    ...(user
      ? [
          { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { path: "/earnings", label: "Earnings", icon: Wallet },
        ]
      : []),
    ...(isAdmin ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const bottomNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/earnings", icon: Wallet, label: "Earnings" },
    { path: "/subscription", icon: CreditCard, label: "Plans" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-strong shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center group">
            <img src={techrolaLogo} alt="Techrola - Empowering Public & Students" className="h-9 md:h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1.5">
                  <div className="h-7 w-7 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{profile?.name || 'User'}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl h-9 w-9 hover:bg-destructive/10 hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl font-medium">Login</Button>
                </Link>
                <Link to="/plans">
                  <Button size="sm" className="rounded-xl font-semibold bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden h-10 w-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-40 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-card border-b shadow-lg p-4 space-y-1 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
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
                {user ? (
                  <button
                    onClick={signOut}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-destructive w-full hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-2 px-2">
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" className="w-full rounded-xl">Login</Button>
                    </Link>
                    <Link to="/plans" className="flex-1">
                      <Button className="w-full rounded-xl bg-gradient-primary">Sign Up</Button>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(220,90%,45%)] via-[hsl(260,80%,50%)] to-[hsl(320,70%,50%)] p-6 md:p-8 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:scale-[1.01]">
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
                <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
                  <Briefcase className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
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
              <div className="inline-flex items-center gap-2 bg-white text-[hsl(260,80%,50%)] font-bold text-sm md:text-base px-6 py-3 rounded-xl shadow-lg group-hover:shadow-xl group-hover:gap-3 transition-all duration-300">
                Start Your Career Journey
                <Trophy className="h-4 w-4 md:h-5 md:w-5 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Nav */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom">
          <div className="flex justify-around py-1.5 px-2">
            {bottomNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[64px] transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive(item.path) ? "bg-primary/10" : ""
                }`}>
                  <item.icon className={`h-5 w-5 transition-transform duration-200 ${isActive(item.path) ? "scale-110" : ""}`} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
