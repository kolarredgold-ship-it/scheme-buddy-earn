import { useEffect, useState, useRef, useCallback } from "react";
import techrolaIcon from "@/assets/techrola_icon.png";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, GraduationCap, Tractor, Tags, Moon, Home as HomeIcon, Heart, BookOpen, ChevronRight, Search, Sparkles, MapPin, Building2, Landmark, FileText, ExternalLink, Brain, Download } from "lucide-react";
import Layout from "@/components/Layout";

const INDIAN_STATES = [
  { value: "all", label: "All India" },
  { value: "central", label: "Central Govt" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "arunachal_pradesh", label: "Arunachal Pradesh" },
  { value: "assam", label: "Assam" },
  { value: "bihar", label: "Bihar" },
  { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "delhi", label: "Delhi" },
  { value: "goa", label: "Goa" },
  { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" },
  { value: "himachal_pradesh", label: "Himachal Pradesh" },
  { value: "jammu_kashmir", label: "Jammu & Kashmir" },
  { value: "jharkhand", label: "Jharkhand" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "ladakh", label: "Ladakh" },
  { value: "madhya_pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "manipur", label: "Manipur" },
  { value: "meghalaya", label: "Meghalaya" },
  { value: "mizoram", label: "Mizoram" },
  { value: "nagaland", label: "Nagaland" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "sikkim", label: "Sikkim" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "tripura", label: "Tripura" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" },
  { value: "west_bengal", label: "West Bengal" },
  { value: "chandigarh", label: "Chandigarh" },
  { value: "puducherry", label: "Puducherry" },
  { value: "andaman_nicobar", label: "Andaman & Nicobar" },
  { value: "dadra_nagar_haveli", label: "Dadra & Nagar Haveli" },
  { value: "lakshadweep", label: "Lakshadweep" },
];
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const HERO_SLIDES = [
  {
    image: hero1,
    title: "Discover Government Schemes",
    subtitle: "Access 550+ scholarships, subsidies & welfare programs across India",
    cta: "Explore Now",
    ctaLink: "/plans",
    badge: "🏛 Government",
    stat: "550+ Schemes",
  },
  {
    image: hero2,
    title: "Explore Job Opportunities",
    subtitle: "Discover curated jobs matching your skills and career aspirations",
    cta: "Find Jobs",
    ctaLink: "/career-program",
    badge: "💼 Jobs",
    stat: "New Openings",
  },
  {
    image: hero3,
    title: "Skill Development Programs",
    subtitle: "Upskill with industry-relevant courses & get certified",
    cta: "Start Learning",
    ctaLink: "/career-program",
    badge: "🎓 Upskill",
    stat: "Free Courses",
  },
  {
    image: hero1,
    title: "AI Mock Interview Training",
    subtitle: "Practice with AI-powered HR interviews & get instant feedback to ace your next round",
    cta: "Start Practice",
    ctaLink: "/mock-interview",
    badge: "🔥 Hot",
    stat: "AI Powered",
    glow: true,
  },
  {
    image: hero2,
    title: "Internship Report Generator",
    subtitle: "Generate professional internship reports instantly — Get Real Experience!",
    cta: "Generate Report",
    ctaLink: "/create-report",
    badge: "🔥 Get Real Experience",
    stat: "AI Reports",
    glow: true,
  },
  {
    image: hero3,
    title: "AI HR Interview Training",
    subtitle: "Simulate real HR interview rounds and prepare like a pro with AI coaching",
    cta: "Train Now",
    ctaLink: "/mock-interview",
    badge: "🔥 New",
    stat: "Live Practice",
    glow: true,
  },
];

const CATEGORIES = [
  { key: "scholarships", label: "Scholarships", icon: GraduationCap, color: "bg-primary/10 text-primary" },
  { key: "farmers", label: "Farmers", icon: Tractor, color: "bg-secondary/10 text-secondary" },
  { key: "sc_st", label: "SC/ST", icon: Tags, color: "bg-accent/10 text-accent-foreground" },
  { key: "minority", label: "Minority", icon: Moon, color: "bg-purple-100 text-purple-700" },
  { key: "housing", label: "Housing", icon: HomeIcon, color: "bg-orange-100 text-orange-700" },
  { key: "health", label: "Health", icon: Heart, color: "bg-red-100 text-red-700" },
  { key: "education", label: "Education", icon: BookOpen, color: "bg-cyan-100 text-cyan-700" },
  
  { key: "business", label: "Business", icon: Building2, color: "bg-amber-100 text-amber-700" },
  { key: "govt_jobs", label: "Govt Jobs", icon: Landmark, color: "bg-indigo-100 text-indigo-700" },
  { key: "private_jobs", label: "Private Jobs", icon: ExternalLink, color: "bg-emerald-100 text-emerald-700", link: "https://interreport.in" },
];

interface Scheme {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  created_at: string;
  state: string | null;
}

// Hero Banner with auto-scroll
const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (i: number) => {
    setCurrent(i);
    if (timerRef.current) clearInterval(timerRef.current);
    startTimer();
  };

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative w-full overflow-hidden aspect-[4/3] md:aspect-[16/7]">
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-110"
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            className={`w-full h-full object-cover ${i === current ? "animate-[ken-burns_4.5s_ease-out_forwards]" : ""}`}
            width={1280}
            height={512}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Dark cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}


      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10 md:justify-center z-10">
        <div className="max-w-lg">
          {/* Badge */}
          <div
            key={`badge-${current}`}
            className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 mb-3 text-[10px] md:text-xs font-semibold text-white border border-white/20 animate-fade-in"
          >
            {slide.badge}
          </div>

          <h1
            key={current}
            className="text-2xl md:text-5xl font-extrabold text-white mb-2 md:mb-3 leading-tight animate-fade-in"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            {slide.title}
          </h1>
          <p
            key={`sub-${current}`}
            className="text-sm md:text-lg text-white/80 mb-4 md:mb-6 animate-fade-in max-w-md leading-relaxed"
            style={{ animationDelay: '0.1s' }}
          >
            {slide.subtitle}
          </p>

          <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link to="/plans">
              <Button
                size="lg"
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-2 shadow-lg shadow-primary/30 text-sm md:text-base px-5 md:px-7"
              >
                {slide.cta} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-white text-sm font-semibold">{slide.stat}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar instead of dots */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex gap-1 px-3 pb-3 md:px-10 md:pb-4">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-white w-full animate-[hero-progress_4.5s_linear]"
                  : i < current
                    ? "bg-white/60 w-full"
                    : "bg-transparent w-0"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};

// Scheme Card
const SchemeCard = ({ scheme }: { scheme: Scheme }) => (
  <Link to={`/scheme/${scheme.id}`} className="block">
    <Card className="group min-w-[180px] md:min-w-[260px] overflow-hidden hover-lift border-border/40 hover:border-primary/20 bg-card">
      <div className="h-32 md:h-36 relative overflow-hidden bg-muted">
        {scheme.image_url ? (
          <img src={scheme.image_url} alt={scheme.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
            <img src={techrolaIcon} alt="TechRola" className="h-16 w-16 opacity-20" />
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-card to-transparent" />
      </div>
      <CardContent className="p-3 md:p-4">
        <Badge variant="outline" className="mb-1.5 text-[10px] px-2 py-0 font-medium border-border/60">
          {scheme.category}
        </Badge>
        <h3 className="font-semibold text-xs md:text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight">
          {scheme.title}
        </h3>
        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {scheme.description?.slice(0, 80)}...
        </p>
        <div className="mt-2 flex items-center text-[10px] md:text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          View Details <ChevronRight className="h-3 w-3 ml-0.5" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

// Category Chip
const CategoryChip = ({ cat, isActive, onClick }: { cat: typeof CATEGORIES[0]; isActive: boolean; onClick: () => void }) => {
  if ('link' in cat && cat.link) {
    return (
      <a
        href={cat.link as string}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start ${cat.color} hover:scale-105`}
      >
        <cat.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
        {cat.label}
      </a>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start ${
        isActive
          ? "bg-primary text-primary-foreground shadow-glow"
          : `${cat.color} hover:scale-105`
      }`}
    >
      <cat.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
      {cat.label}
    </button>
  );
};

const Index = () => {
  const { user, profile } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  // isPaid check removed - all content is free to view

  useEffect(() => {
    const fetchSchemes = async () => {
      const { data } = await supabase.from("schemes").select("id, title, category, description, image_url, created_at, state").order("created_at", { ascending: false });
      if (data) setSchemes(data as unknown as Scheme[]);
      setLoading(false);
    };
    fetchSchemes();
  }, []);

  // State-filtered base
  const stateFiltered = selectedState === "all"
    ? schemes
    : schemes.filter((s) => s.state === selectedState);

  const getSchemesByCategory = (cat: string) => {
    return stateFiltered.filter((s) => s.category.toLowerCase() === cat).slice(0, 15);
  };

  const filteredSchemes = activeCategory
    ? stateFiltered.filter((s) => s.category === activeCategory)
    : stateFiltered;

  const searchedSchemes = searchQuery
    ? filteredSchemes.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const recentSchemes = stateFiltered.slice(0, 12);

  return (
    <Layout>
      <div className="pb-24 md:pb-8">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Search Bar + State Filter */}
        <div className="container mx-auto px-3 md:px-4 mt-4 md:mt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 md:h-12 pl-10 pr-4 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[140px] md:w-[180px] h-11 md:h-12 rounded-xl bg-card border-border/60 text-sm gap-1 shrink-0">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value} className="text-sm">
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Link to="/create-report">
              <Button variant="outline" className="w-full h-11 rounded-xl gap-1.5 text-[11px] md:text-sm font-semibold border-primary/30 hover:bg-primary/5">
                <FileText className="h-4 w-4 shrink-0" /> AI Internship Report
              </Button>
            </Link>
            <Link to="/mock-interview">
              <Button variant="outline" className="w-full h-11 rounded-xl gap-1.5 text-[11px] md:text-sm font-semibold border-purple-500/30 text-purple-700 hover:bg-purple-50">
                <Brain className="h-4 w-4 shrink-0" /> AI Mock Interview
              </Button>
            </Link>
          </div>
        </div>

        {/* Install App Banner */}
        <div className="container mx-auto px-3 md:px-4 mt-4">
          <Link to="/install" className="block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-4 md:p-5 flex items-center gap-4 hover:opacity-95 transition-opacity">
              <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-bold text-primary-foreground">Install TechRola App</h3>
                <p className="text-xs text-primary-foreground/80 truncate">Quick access from your home screen — no app store needed!</p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary-foreground/60 shrink-0" />
            </div>
          </Link>
        </div>

        {/* Category Chips */}
        <div id="schemes" className="container mx-auto px-3 md:px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 snap-x-mandatory">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 snap-start ${
                !activeCategory
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground hover:scale-105"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.key}
                cat={cat}
                isActive={activeCategory === cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-3 md:px-4 mt-4 md:mt-6 space-y-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchedSchemes ? (
            /* Search Results */
            <section className="animate-fade-in">
              <h2 className="text-base md:text-lg font-bold mb-3">
                {searchedSchemes.length} result{searchedSchemes.length !== 1 ? 's' : ''} found
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {searchedSchemes.slice(0, 20).map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))}
              </div>
              {searchedSchemes.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No schemes found. Try a different search.</p>
                </div>
              )}
            </section>
          ) : activeCategory ? (
            /* Category View */
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                  {CATEGORIES.find(c => c.key === activeCategory)?.label} Schemes
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {filteredSchemes.length}
                  </Badge>
                </h2>
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
                >
                  Clear Filter
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {filteredSchemes.slice(0, 30).map((scheme) => (
                  <div key={scheme.id} className="w-full">
                    <SchemeCard scheme={scheme} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* Default: Category-wise horizontal scroll */
            <>
              {/* Recent / Trending */}
              <section>
                <div className="mb-3">
                  <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                    Trending Schemes
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x-mandatory">
                  {recentSchemes.map((scheme) => (
                    <div key={scheme.id} className="snap-start">
                      <SchemeCard scheme={scheme} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Category Sections */}
              {CATEGORIES.map((cat) => {
                const catSchemes = getSchemesByCategory(cat.key);
                if (catSchemes.length === 0) return null;
                return (
                  <section key={cat.key} className="animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                        <cat.icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                        {cat.label}
                        <Badge variant="outline" className="text-[10px] font-medium ml-1">{catSchemes.length}</Badge>
                      </h2>
                      <button
                        onClick={() => setActiveCategory(cat.key)}
                        className="text-xs md:text-sm text-primary font-medium flex items-center gap-0.5 hover:underline"
                      >
                        See All <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x-mandatory">
                      {catSchemes.map((scheme) => (
                        <div key={scheme.id} className="snap-start">
                          <SchemeCard scheme={scheme} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>

        {/* CTA Banner */}
        {!user && (
          <div className="container mx-auto px-3 md:px-4 mt-10">
            <div className="rounded-2xl bg-gradient-primary p-6 md:p-10 text-center">
              <h2 className="text-xl md:text-3xl font-extrabold text-primary-foreground mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                Unlock All Schemes for Just ₹1000
              </h2>
              <p className="text-primary-foreground/80 text-sm md:text-base mb-5 max-w-md mx-auto">
                Get full access to eligibility details, required documents, and direct apply links for 550+ schemes.
              </p>
              <Link to="/plans">
                <Button size="lg" className="rounded-xl bg-card text-foreground hover:bg-card/90 font-semibold gap-2 shadow-lg">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Featured Highlights Section */}
        <div className="container mx-auto px-3 md:px-4 mt-10">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-2xl font-extrabold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Everything You Need to <span className="text-primary">Build Your Career</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Powered by AI & Real Opportunities</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Job Opportunities */}
            <Link to="/career-program" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-5 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-xl">💼</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">Explore Job Opportunities</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Discover curated jobs matching your skills and aspirations</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Skill Development */}
            <Link to="/career-program" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-5 hover:border-secondary/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-xl">🎓</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">Skill Development Programs</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Upskill with industry-relevant courses & certifications</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Government Schemes */}
            <Link to="/#schemes" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/60 p-5 hover:border-accent/30 transition-all duration-300 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-xl">🏛</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">Government Scheme Updates</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Stay updated with 550+ latest government welfare programs</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* AI Mock Interviews - GLOW */}
            <Link to="/mock-interview" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 p-5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(168,85,247,0.25)] hover:border-purple-400/50">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-700 dark:text-purple-300 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">🔥 Hot</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform animate-pulse" style={{ animationDuration: '3s' }}>
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">AI Mock Interview Training</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Practice with AI-powered HR interviews & get instant feedback</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Internship Report Generator - GLOW */}
            <Link to="/create-report" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/30 p-5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] hover:border-blue-400/50">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 bg-blue-500/15 text-blue-700 dark:text-blue-300 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">🔥 Get Real Experience</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform animate-pulse" style={{ animationDuration: '3s' }}>
                    <span className="text-xl">📄</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">Internship Report Generator</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Generate professional internship reports instantly with AI</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* AI HR Interview Training - GLOW */}
            <Link to="/mock-interview" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-400/30 p-5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:border-emerald-400/50">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">🔥 New</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform animate-pulse" style={{ animationDuration: '3s' }}>
                    <span className="text-xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm md:text-base text-foreground mb-1">AI HR Interview Training</h3>
                    <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">Simulate real HR rounds & ace your next interview</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
