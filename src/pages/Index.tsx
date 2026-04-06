import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, ArrowRight, GraduationCap, Tractor, Tags, Moon, Home as HomeIcon, Heart, Briefcase, BookOpen, ChevronRight, Search, Sparkles, MapPin } from "lucide-react";
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
    subtitle: "Access 550+ scholarships, subsidies & welfare programs",
    cta: "Explore Now",
    ctaLink: "#schemes",
    gradient: "from-primary/90 via-primary/70 to-transparent",
  },
  {
    image: hero2,
    title: "Scholarships for Students",
    subtitle: "Find scholarships worth lakhs for your education",
    cta: "View Scholarships",
    ctaLink: "#schemes",
    gradient: "from-secondary/90 via-secondary/70 to-transparent",
  },
  {
    image: hero3,
    title: "Support for Farmers",
    subtitle: "PM-KISAN, crop insurance, equipment subsidies & more",
    cta: "Farmer Schemes",
    ctaLink: "#schemes",
    gradient: "from-accent/90 via-accent/70 to-transparent",
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
  { key: "employment", label: "Jobs", icon: Briefcase, color: "bg-emerald-100 text-emerald-700" },
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
    <section className="relative w-full overflow-hidden rounded-2xl mx-auto" style={{ aspectRatio: '16/7' }}>
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            i === current ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
            width={1280}
            height={512}
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
        </div>
      ))}

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10 md:justify-center">
        <div className="max-w-md">
          <h1
            key={current}
            className="text-xl md:text-4xl font-extrabold text-primary-foreground mb-2 md:mb-3 animate-slide-up"
            style={{ fontFamily: 'Plus Jakarta Sans' }}
          >
            {slide.title}
          </h1>
          <p key={`sub-${current}`} className="text-sm md:text-lg text-primary-foreground/80 mb-4 md:mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {slide.subtitle}
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="rounded-xl bg-card/20 backdrop-blur-md text-primary-foreground border border-primary-foreground/20 hover:bg-card/30 font-semibold gap-2 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              {slide.cta} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? "w-6 h-2 bg-primary-foreground" : "w-2 h-2 bg-primary-foreground/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

// Scheme Card
const SchemeCard = ({ scheme, isPaid }: { scheme: Scheme; isPaid: boolean }) => (
  <Link to={`/scheme/${scheme.id}`} className="block">
    <Card className="group min-w-[200px] md:min-w-[260px] max-w-[260px] md:max-w-[300px] overflow-hidden hover-lift border-border/40 hover:border-primary/20 bg-card">
      <div className="h-32 md:h-36 relative overflow-hidden bg-muted">
        {scheme.image_url ? (
          <img src={scheme.image_url} alt={scheme.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
            <Sparkles className="h-8 w-8 text-primary/20" />
          </div>
        )}
        {!isPaid && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-foreground/70 backdrop-blur-sm text-primary-foreground text-[10px] gap-1 border-0 font-medium">
              <Lock className="h-2.5 w-2.5" /> Premium
            </Badge>
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
const CategoryChip = ({ cat, isActive, onClick }: { cat: typeof CATEGORIES[0]; isActive: boolean; onClick: () => void }) => (
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

const Index = () => {
  const { user, profile } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isPaid = profile?.subscription_status === "active";

  useEffect(() => {
    const fetchSchemes = async () => {
      const { data } = await supabase.from("schemes").select("*").order("created_at", { ascending: false });
      if (data) setSchemes(data);
      setLoading(false);
    };
    fetchSchemes();
  }, []);

  const getSchemesByCategory = (cat: string) => {
    return schemes.filter((s) => s.category.toLowerCase() === cat).slice(0, 15);
  };

  const filteredSchemes = activeCategory
    ? schemes.filter((s) => s.category === activeCategory)
    : schemes;

  const searchedSchemes = searchQuery
    ? filteredSchemes.filter((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const recentSchemes = schemes.slice(0, 12);

  return (
    <Layout>
      <div className="pb-24 md:pb-8">
        {/* Hero Banner */}
        <div className="container mx-auto px-3 md:px-4 pt-3 md:pt-6">
          <HeroBanner />
        </div>

        {/* Search Bar */}
        <div className="container mx-auto px-3 md:px-4 mt-4 md:mt-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search schemes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 md:h-12 pl-10 pr-4 rounded-xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
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
                  <SchemeCard key={scheme.id} scheme={scheme} isPaid={isPaid} />
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
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {filteredSchemes.slice(0, 30).map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} isPaid={isPaid} />
                ))}
              </div>
            </section>
          ) : (
            /* Default: Category-wise horizontal scroll */
            <>
              {/* Recent / Trending */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                    Trending Schemes
                  </h2>
                  <button className="text-xs md:text-sm text-primary font-medium flex items-center gap-0.5 hover:underline">
                    View All <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x-mandatory">
                  {recentSchemes.map((scheme) => (
                    <div key={scheme.id} className="snap-start">
                      <SchemeCard scheme={scheme} isPaid={isPaid} />
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
                          <SchemeCard scheme={scheme} isPaid={isPaid} />
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
              <Link to="/signup">
                <Button size="lg" className="rounded-xl bg-card text-foreground hover:bg-card/90 font-semibold gap-2 shadow-lg">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
