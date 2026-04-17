import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, Briefcase, BookOpen, Wrench, Award, FileSearch, Layers,
  Search, ChevronRight, Sparkles, MapPin, Brain, FileText, Bot, Loader2, X,
  Tractor, Tags, Moon, Home as HomeIcon, Heart, Building2, Landmark, ExternalLink, Users
} from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";
import heroGraduation from "@/assets/hero-graduation.png";

const INDIAN_STATES = [
  { value: "all", label: "All India" },
  { value: "central", label: "Central Govt" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "bihar", label: "Bihar" },
  { value: "delhi", label: "Delhi" },
  { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "madhya_pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "west_bengal", label: "West Bengal" },
];

// Top Categories — grid tiles like the mockup (8 tiles)
const TOP_CATEGORIES = [
  { key: "scholarships",  label: "Scholarships", icon: GraduationCap, bg: "bg-blue-50",   fg: "text-blue-600" },
  { key: "internships",   label: "Internships",  icon: Briefcase,     bg: "bg-emerald-50",fg: "text-emerald-600", link: "/career-program" },
  { key: "education",     label: "Education",    icon: BookOpen,      bg: "bg-violet-50", fg: "text-violet-600" },
  { key: "private_jobs",  label: "Jobs",         icon: Briefcase,     bg: "bg-sky-50",    fg: "text-sky-600", featured: true },
  { key: "skills",        label: "Skills",       icon: Wrench,        bg: "bg-amber-50",  fg: "text-amber-600", link: "/career-program" },
  { key: "fellowships",   label: "Fellowships",  icon: Award,         bg: "bg-rose-50",   fg: "text-rose-600" },
  { key: "exams",         label: "Exams",        icon: FileSearch,    bg: "bg-orange-50", fg: "text-orange-600" },
  { key: "all",           label: "All Schemes",  icon: Layers,        bg: "bg-slate-100", fg: "text-slate-700" },
];

// Full category list (used for horizontal scheme rails)
const SCHEME_CATEGORIES = [
  { key: "scholarships", label: "Scholarships", icon: GraduationCap },
  { key: "private_jobs", label: "Private Jobs", icon: ExternalLink, featured: true },
  { key: "farmers", label: "Farmers", icon: Tractor },
  { key: "women_empowerment", label: "Women Empowerment", icon: Users },
  { key: "education", label: "Education", icon: BookOpen },
  { key: "health", label: "Health", icon: Heart },
  { key: "housing", label: "Housing", icon: HomeIcon },
  { key: "minority", label: "Minority", icon: Moon },
  { key: "sc_st", label: "SC/ST", icon: Tags },
  { key: "business", label: "Business", icon: Building2 },
  { key: "govt_jobs", label: "Govt Jobs", icon: Landmark },
];

const AI_TOOLS = [
  { to: "/mock-interview", title: "AI Interview Training", subtitle: "Practice. Improve. Get Hired.", emoji: "🤖", iconBg: "bg-blue-100" },
  { to: "/create-report",  title: "Report Generator",     subtitle: "Create Professional Reports in Seconds", emoji: "📝", iconBg: "bg-violet-100" },
  { to: "/mock-interview", title: "AI Mock Interview",    subtitle: "Real Questions. Smart Feedback.", emoji: "🤖", iconBg: "bg-emerald-100" },
];

interface Scheme {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  created_at: string;
  state: string | null;
  slug: string;
}

// Compact horizontal scheme card
const SchemeCard = ({ scheme }: { scheme: Scheme }) => (
  <Link to={`/scheme/${scheme.slug}`} className="block shrink-0 snap-start">
    <Card className="w-[180px] md:w-[220px] overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-md transition-all bg-card">
      <CardContent className="p-3">
        <Badge variant="outline" className="mb-1.5 text-[10px] px-1.5 py-0 font-medium border-border/60">
          {scheme.category}
        </Badge>
        <h3 className="font-semibold text-xs md:text-sm leading-snug line-clamp-2 mb-1">
          {scheme.title}
        </h3>
        <p className="text-[10px] text-muted-foreground line-clamp-2">{scheme.description}</p>
      </CardContent>
    </Card>
  </Link>
);

const Index = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [aiResults, setAiResults] = useState<Scheme[] | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [searching, setSearching] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadPrefs = async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("preferred_state")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.preferred_state && data.preferred_state !== "all") {
        setSelectedState(data.preferred_state);
      } else if (!data) {
        setPrefsOpen(true);
      }
    };
    loadPrefs();
  }, [user]);

  useEffect(() => {
    const fetchSchemes = async () => {
      const { data } = await supabase
        .from("schemes")
        .select("id, title, category, description, image_url, created_at, state, slug")
        .order("created_at", { ascending: false });
      if (data) setSchemes(data as unknown as Scheme[]);
      setLoading(false);
    };
    fetchSchemes();
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 3) { setAiResults(null); setAiSummary(""); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-scheme-search", { body: { query: q } });
      if (error) throw error;
      setAiResults(data.schemes || []);
      setAiSummary(data.ai_summary || "");
    } catch {
      const local = schemes.filter((s) =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.description?.toLowerCase().includes(q.toLowerCase())
      );
      setAiResults(local);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => { setSearchQuery(""); setAiResults(null); setAiSummary(""); };

  const stateFiltered = selectedState === "all"
    ? schemes
    : schemes.filter((s) => s.state === selectedState);

  const getSchemesByCategory = (cat: string) =>
    stateFiltered.filter((s) => s.category.toLowerCase() === cat).slice(0, 15);

  const filteredSchemes = activeCategory
    ? stateFiltered.filter((s) => s.category === activeCategory)
    : stateFiltered;

  return (
    <Layout>
      <div className="pb-24 md:pb-8 bg-background">
        <div className="container mx-auto max-w-2xl px-4 pt-3 space-y-4">

          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search schemes, scholarships, internships..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim().length < 3) { setAiResults(null); setAiSummary(""); }
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-12 pl-4 pr-10 rounded-2xl bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/70 shadow-sm"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={searching}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                aria-label="Search"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* State select */}
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="h-10 rounded-xl bg-card border-border/60 text-sm gap-1 shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value} className="text-sm">{state.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Hero Card */}
          <Link to="/plans" className="block">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(220,70%,20%)] via-[hsl(220,75%,25%)] to-[hsl(220,80%,30%)] p-5 md:p-6 shadow-lg shadow-blue-900/20">
              <div className="relative z-10 max-w-[60%]">
                <h1 className="text-xl md:text-3xl font-extrabold text-white leading-tight mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  Find Every Opportunity You Deserve
                </h1>
                <p className="text-xs md:text-sm text-white/80 font-medium">Easy. Fast. Reliable.</p>
              </div>
              <img
                src={heroGraduation}
                alt="Graduation"
                width={140}
                height={140}
                className="absolute right-2 bottom-0 h-[110px] md:h-[140px] w-auto object-contain"
              />
            </div>
          </Link>

          {/* Top Categories */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                Top Categories
              </h2>
              <button
                onClick={() => setActiveCategory(null)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {TOP_CATEGORIES.map((cat) => {
                const Inner = (
                  <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className={`relative h-12 w-12 rounded-xl flex items-center justify-center ${cat.bg} ${cat.featured ? 'ring-2 ring-sky-300 shadow-md shadow-sky-200/60 animate-pulse-slow' : ''}`}>
                      <cat.icon className={`h-6 w-6 ${cat.fg}`} strokeWidth={2.2} />
                      {cat.featured && (
                        <span className="absolute -top-1 -right-1 text-[8px]">🔥</span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-foreground/80 text-center leading-tight">{cat.label}</span>
                  </div>
                );
                if (cat.link) return <Link key={cat.key} to={cat.link}>{Inner}</Link>;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key === "all" ? null : cat.key)}
                    className="text-left"
                  >
                    {Inner}
                  </button>
                );
              })}
            </div>
          </section>

          {/* AI Tools for Your Success */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-bold text-foreground" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                AI Tools for Your Success
              </h2>
              <Link to="/mock-interview" className="text-xs font-semibold text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-2.5">
              {AI_TOOLS.map((tool) => (
                <Link key={tool.title} to={tool.to} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40 hover:border-primary/30 hover:shadow-md transition-all">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${tool.iconBg}`}>
                    {tool.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground leading-tight">{tool.title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{tool.subtitle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Schemes Section — wider container, side-scrolling rails */}
        <div id="schemes" className="container mx-auto px-3 md:px-4 mt-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : aiResults ? (
            <section className="animate-fade-in">
              {aiSummary && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{aiSummary}</p>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base md:text-lg font-bold">{aiResults.length} result{aiResults.length !== 1 ? 's' : ''}</h2>
                <button onClick={clearSearch} className="text-xs text-primary font-medium hover:underline">Clear</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {aiResults.slice(0, 20).map((s) => <SchemeCard key={s.id} scheme={s} />)}
              </div>
            </section>
          ) : activeCategory ? (
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base md:text-lg font-bold">
                  {SCHEME_CATEGORIES.find(c => c.key === activeCategory)?.label || activeCategory} Schemes
                </h2>
                <button onClick={() => setActiveCategory(null)} className="text-xs text-primary font-medium hover:underline">Clear</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredSchemes.slice(0, 30).map((s) => <SchemeCard key={s.id} scheme={s} />)}
              </div>
            </section>
          ) : (
            <>
              {SCHEME_CATEGORIES.map((cat) => {
                const catSchemes = getSchemesByCategory(cat.key);
                if (catSchemes.length === 0) return null;
                const isFeatured = cat.featured;
                return (
                  <section key={cat.key} className="animate-fade-in">
                    <div className={`flex items-center justify-between mb-3 px-1 ${isFeatured ? 'py-2 px-3 rounded-xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 text-white shadow-md shadow-blue-300/40' : ''}`}>
                      <h2 className={`text-sm md:text-base font-bold flex items-center gap-2 ${isFeatured ? 'text-white' : 'text-foreground'}`}>
                        <cat.icon className={`h-4 w-4 ${isFeatured ? 'text-white' : 'text-muted-foreground'}`} />
                        {cat.label}
                      </h2>
                      <button
                        onClick={() => setActiveCategory(cat.key)}
                        className={`text-xs font-medium flex items-center gap-0.5 hover:underline ${isFeatured ? 'text-white' : 'text-primary'}`}
                      >
                        See All <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory -mx-3 px-3 md:-mx-4 md:px-4">
                      {catSchemes.map((s) => <SchemeCard key={s.id} scheme={s} />)}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>

        {user && (
          <UserPreferences
            open={prefsOpen}
            onOpenChange={setPrefsOpen}
            onPreferencesSaved={(state) => { if (state !== "all") setSelectedState(state); }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;
