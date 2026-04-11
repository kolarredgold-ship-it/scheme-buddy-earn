import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, LayoutDashboard, Wallet, LogOut, Menu, X, User, Shield, CreditCard, Briefcase, Trophy } from "lucide-react";
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
            <img src={techrolaLogo} alt="TechRola - Empowering Public & Students" className="h-9 md:h-10 w-auto" />
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
        <Link to="/career-program">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent p-5 md:p-6 hover:opacity-95 transition-opacity">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-extrabold text-primary-foreground">Techrola Career Program</h3>
              </div>
              <p className="text-primary-foreground/90 text-xs md:text-sm mb-3">
                Work, Learn, and Get Hired Based on Your Performance. Start as a promoter, grow into a professional!
              </p>
              <div className="flex items-center gap-2 text-primary-foreground text-sm font-semibold">
                Join Now <Trophy className="h-4 w-4" />
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
