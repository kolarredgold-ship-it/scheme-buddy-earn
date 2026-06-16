import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight, GraduationCap, Tractor, Tags, Moon, Home as HomeIcon, Heart, BookOpen,
  ChevronRight, ChevronLeft, Search, Sparkles, MapPin, Building2, Landmark, ExternalLink,
  X, Loader2, Users, FileText, Brain, Mic, Award, Zap
} from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";

const INDIAN_STATES = [
  { value: "all", label: "All India" }, { value: "central", label: "Central Govt" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" }, { value: "arunachal_pradesh", label: "Arunachal Pradesh" },
  { value: "assam", label: "Assam" }, { value: "bihar", label: "Bihar" }, { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "delhi", label: "Delhi" }, { value: "goa", label: "Goa" }, { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" }, { value: "himachal_pradesh", label: "Himachal Pradesh" },
  { value: "jammu_kashmir", label: "Jammu & Kashmir" }, { value: "jharkhand", label: "Jharkhand" },
  { value: "karnataka", label: "Karnataka" }, { value: "kerala", label: "Kerala" }, { value: "ladakh", label: "Ladakh" },
  { value: "madhya_pradesh", label: "Madhya Pradesh" }, { value: "maharashtra", label: "Maharashtra" },
  { value: "manipur", label: "Manipur" }, { value: "meghalaya", label: "Meghalaya" }, { value: "mizoram", label: "Mizoram" },
  { value: "nagaland", label: "Nagaland" }, { value: "odisha", label: "Odisha" }, { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" }, { value: "sikkim", label: "Sikkim" }, { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" }, { value: "tripura", label: "Tripura" }, { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" }, { value: "west_bengal", label: "West Bengal" },
  { value: "chandigarh", label: "Chandigarh" }, { value: "puducherry", label: "Puducherry" },
  { value: "andaman_nicobar", label: "Andaman & Nicobar" }, { value: "dadra_nagar_haveli", label: "Dadra & Nagar Haveli" },
  { value: "lakshadweep", label: "Lakshadweep" },
];

const CATEGORIES = [
  { key: "scholarships", label: "Scholarships", icon: GraduationCap, color: "from-blue-500 to-indigo-500" },
  { key: "farmers", label: "Farmers", icon: Tractor, color: "from-emerald-500 to-teal-500" },
  { key: "private_jobs", label: "Private Jobs", icon: ExternalLink, color: "from-sky-500 to-blue-600", featured: true },
  { key: "govt_jobs", label: "Govt Jobs", icon: Landmark, color: "from-indigo-500 to-violet-600" },
  { key: "women_empowerment", label: "Women", icon: Users, color: "from-pink-500 to-rose-500" },
  { key: "education", label: "Education", icon: BookOpen, color: "from-cyan-500 to-sky-500" },
  { key: "health", label: "Health", icon: Heart, color: "from-red-500 to-rose-500" },
  { key: "housing", label: "Housing", icon: HomeIcon, color: "from-orange-500 to-amber-500" },
  { key: "business", label: "Business", icon: Building2, color: "from-amber-500 to-yellow-500" },
  { key: "sc_st", label: "SC / ST", icon: Tags, color: "from-fuchsia-500 to-purple-500" },
  { key: "minority", label: "Minority", icon: Moon, color: "from-purple-500 to-indigo-500" },
];

const AI_TOOLS = [
  { to: "/create-report", title: "Internship Report", desc: "AI DOCX in 60 seconds", icon: FileText, gradient: "from-blue-500 to-cyan-500", badge: "TOP" },
  { to: "/mock-interview", title: "Mock Interview", desc: "Practice with AI feedback", icon: Brain, gradient: "from-purple-500 to-pink-500", badge: "HOT" },
  { to: "/live-hr-interview", title: "Live HR Interview", desc: "Real-time HR simulation", icon: Mic, gradient: "from-emerald-500 to-teal-500", badge: "NEW" },
  { to: "/student-tool/resume", title: "Resume Builder", desc: "One-page pro resume", icon: FileText, gradient: "from-orange-500 to-amber-500", badge: "DOC" },
  { to: "/student-tool/cover-letter", title: "Cover Letter", desc: "Tailored to the role", icon: FileText, gradient: "from-rose-500 to-pink-500", badge: "DOC" },
  { to: "/student-tool/sop", title: "SOP Generator", desc: "For study abroad", icon: Award, gradient: "from-indigo-500 to-blue-500", badge: "STUDY" },
  { to: "/student-tool/roadmap", title: "Career Roadmap", desc: "6-month plan", icon: Zap, gradient: "from-cyan-500 to-blue-500", badge: "PLAN" },
  { to: "/student-tool/study-notes", title: "Study Notes", desc: "Topic to revision notes", icon: BookOpen, gradient: "from-yellow-500 to-orange-500", badge: "EXAM" },
];

interface Scheme {
  id: string; title: string; category: string; description: string;
  image_url: string | null; created_at: string; state: string | null; slug: string;
}

/* ====================== HERO ====================== */
const Hero = (props: {
  searchQuery: string; onSearchChange: (v: string) => void; onSearchKeyDown: (e: React.KeyboardEvent) => void;
  onClearSearch: () => void; selectedState: string; onStateChange: (v: string) => void;
  onSearch: () => void; searching: boolean;
}) => {
  return (
    <section className="relative w-full overflow-hidden animated-hero-bg">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-yellow-400/20 blur-3xl float-y" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-sky-400/20 blur-3xl float-y" style={{ animationDelay: "1.5s" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "22px 22px" }} />

      <div className="relative container mx-auto px-4 md:px-6 pt-8 pb-10 md:pt-16 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-[11px] font-semibold tracking-wider uppercase mb-4 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            India's #1 Career & Schemes Platform
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] mb-4">
            Discover <span className="text-yellow-400">2500+ Schemes</span>,<br className="hidden md:block" />
            Jobs & AI Career Tools
          </h1>
          <p className="text-sm md:text-lg text-white/75 mb-7 max-w-xl mx-auto">
            From scholarships to private jobs, AI mock interviews to internship reports — everything you need in one app.
          </p>

          {/* Search */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 p-2 flex gap-2 max-w-2xl mx-auto border border-white/40">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <input
                type="text"
                aria-label="Search government schemes"
                placeholder="AI Search: 'free laptop Tamil Nadu'"
                value={props.searchQuery}
                onChange={(e) => props.onSearchChange(e.target.value)}
                onKeyDown={props.onSearchKeyDown}
                className="w-full h-11 pl-9 pr-9 rounded-xl bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/60"
              />
              {props.searchQuery && (
                <button aria-label="Clear" onClick={props.onClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={props.selectedState} onValueChange={props.onStateChange}>
              <SelectTrigger className="hidden sm:flex w-[140px] h-11 rounded-xl border-0 bg-muted/60 gap-1 shrink-0">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {INDIAN_STATES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button onClick={props.onSearch} disabled={props.searching || props.searchQuery.trim().length < 3}
              className="h-11 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#0c2340] font-bold px-4 md:px-6 shadow-md shadow-yellow-400/40">
              {props.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 md:mr-1.5" /><span className="hidden md:inline">Search</span></>}
            </Button>
          </div>
          <Select value={props.selectedState} onValueChange={props.onStateChange}>
            <SelectTrigger className="sm:hidden mt-2 mx-auto max-w-[200px] h-9 rounded-xl bg-white/90 border-white/30 gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {INDIAN_STATES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
            </SelectContent>
          </Select>

          {/* Stats strip */}
          <div className="mt-7 flex items-center justify-center gap-5 md:gap-10 text-white/90">
            {[
              { v: "2500+", l: "Schemes" }, { v: "20+", l: "AI Tools" }, { v: "100K+", l: "Students" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="text-xl md:text-3xl font-extrabold text-yellow-400">{s.v}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-wider text-white/60 font-semibold">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <svg className="block w-full h-8 md:h-12 text-background" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path fill="currentColor" d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" />
      </svg>
    </section>
  );
};

/* ====================== HORIZONTAL SLIDER ====================== */
const HSlider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const scroll = (dir: -1 | 1) => {
    const el = ref.current; if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className="relative group">
      <button onClick={() => scroll(-1)} aria-label="Previous"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 h-9 w-9 rounded-full bg-white shadow-lg items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div ref={ref}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x-mandatory scroll-px-4 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => {
          const el = e.currentTarget; const startX = e.pageX - el.offsetLeft; const startScroll = el.scrollLeft;
          let dragged = false;
          const onMove = (ev: MouseEvent) => {
            const dx = (ev.pageX - el.offsetLeft) - startX;
            if (Math.abs(dx) > 3) dragged = true; el.scrollLeft = startScroll - dx;
          };
          const onUp = () => {
            window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp);
            if (dragged) { const stop = (e2: Event) => { e2.stopPropagation(); e2.preventDefault(); window.removeEventListener("click", stop, true); }; window.addEventListener("click", stop, true); }
          };
          window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
        }}>
        {children}
      </div>
      <button onClick={() => scroll(1)} aria-label="Next"
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 h-9 w-9 rounded-full bg-white shadow-lg items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

const SectionHeading = ({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) => (
  <div className="flex items-end justify-between mb-4 md:mb-5">
    <div>
      {eyebrow && <div className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-primary mb-1">{eyebrow}</div>}
      <h2 className="text-xl md:text-2xl font-extrabold text-foreground">{title}</h2>
    </div>
    {action}
  </div>
);

/* ====================== SCHEME CARD ====================== */
const SchemeCard = ({ scheme }: { scheme: Scheme }) => (
  <Link to={`/scheme/${scheme.slug}`} className="block">
    <Card className="group min-w-[200px] md:min-w-[260px] overflow-hidden hover-lift border-border/40 hover:border-primary/30 bg-card">
      <CardContent className="p-3 md:p-4">
        <Badge variant="outline" className="mb-1.5 text-[10px] px-2 py-0 font-medium">{scheme.category}</Badge>
        <h3 className="font-semibold text-xs md:text-sm mb-1 group-hover:text-primary transition-colors leading-tight line-clamp-2">{scheme.title}</h3>
        <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 mt-1">{scheme.description}</p>
        <div className="mt-2 flex items-center text-[10px] md:text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          View Details <ChevronRight className="h-3 w-3 ml-0.5" />
        </div>
      </CardContent>
    </Card>
  </Link>
);

/* ====================== INDEX ====================== */
const Index = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [aiResults, setAiResults] = useState<Scheme[] | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSource, setAiSource] = useState("");
  const [searching, setSearching] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("user_preferences").select("preferred_state").eq("user_id", user.id).maybeSingle();
      if (data?.preferred_state && data.preferred_state !== "all") setSelectedState(data.preferred_state);
      else if (!data) setPrefsOpen(true);
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("schemes")
        .select("id, title, category, description, image_url, created_at, state, slug")
        .order("created_at", { ascending: false });
      if (data) setSchemes(data as unknown as Scheme[]);
      setLoading(false);
    })();
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 3) { setAiResults(null); setAiSummary(""); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-scheme-search", { body: { query: q } });
      if (error) throw error;
      setAiResults(data.schemes || []); setAiSummary(data.ai_summary || ""); setAiSource(data.source || "database");
    } catch (err) {
      const local = schemes.filter((s) =>
        s.title.toLowerCase().includes(q.toLowerCase()) || s.description?.toLowerCase().includes(q.toLowerCase())
      );
      setAiResults(local); setAiSummary(""); setAiSource("local");
    } finally { setSearching(false); }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };
  const clearSearch = () => { setSearchQuery(""); setAiResults(null); setAiSummary(""); };

  const stateFiltered = selectedState === "all" ? schemes : schemes.filter((s) => s.state === selectedState || s.state === "central");
  const getSchemesByCategory = (cat: string) => stateFiltered.filter((s) => s.category.toLowerCase() === cat).slice(0, 12);

  return (
    <Layout>
      <div className="pb-24 md:pb-8">
        {/* ======== 1. HERO BANNER ======== */}
        <Hero
          searchQuery={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); if (val.trim().length < 3) { setAiResults(null); setAiSummary(""); } }}
          onSearchKeyDown={handleSearchKeyDown}
          onClearSearch={clearSearch}
          selectedState={selectedState}
          onStateChange={setSelectedState}
          onSearch={handleSearch}
          searching={searching}
        />

        {/* AI search results (overlay when active) */}
        {aiResults && (
          <section className="container mx-auto px-4 md:px-6 mt-6 animate-fade-in">
            {aiSummary && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-foreground/80">{aiSummary}</p>
                  {aiSource === "ai_enriched" && <p className="text-[10px] text-primary mt-1 font-medium">✨ AI discovered new schemes for you</p>}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-bold">{aiResults.length} result{aiResults.length !== 1 ? "s" : ""} found</h2>
              <button onClick={clearSearch} className="text-xs text-primary font-medium hover:underline">Clear Search</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {aiResults.slice(0, 20).map((s) => (<SchemeCard key={s.id} scheme={s} />))}
            </div>
            {aiResults.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No schemes found. Try different keywords.</p>
              </div>
            )}
          </section>
        )}

        {!aiResults && (
          <>
            {/* ======== 2. CATEGORIES (GRID + SLIDER) ======== */}
            <section className="container mx-auto px-4 md:px-6 mt-8 md:mt-12">
              <SectionHeading
                eyebrow="Browse by category"
                title="Government Scheme Categories"
                action={<Link to="/#schemes-list" className="text-xs md:text-sm font-semibold text-primary flex items-center gap-0.5 hover:underline">View All <ChevronRight className="h-4 w-4" /></Link>}
              />

              {/* Desktop & tablet: grid */}
              <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {CATEGORIES.map((cat) => (
                  <a href={`#cat-${cat.key}`} key={cat.key}
                    className="group relative overflow-hidden rounded-2xl bg-card border border-border/60 hover:border-primary/30 p-4 flex flex-col items-center text-center hover-lift">
                    <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg mb-2 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-xs md:text-sm font-semibold text-foreground">{cat.label}</div>
                    {cat.featured && <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400 text-[#0c2340]">HOT</span>}
                  </a>
                ))}
              </div>

              {/* Mobile: horizontal slider */}
              <div className="sm:hidden">
                <HSlider>
                  {CATEGORIES.map((cat) => (
                    <a href={`#cat-${cat.key}`} key={cat.key}
                      className="snap-start relative shrink-0 w-[110px] rounded-2xl bg-card border border-border/60 p-3 flex flex-col items-center text-center">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-md mb-2`}>
                        <cat.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-xs font-semibold">{cat.label}</div>
                      {cat.featured && <span className="absolute top-1.5 right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400 text-[#0c2340]">HOT</span>}
                    </a>
                  ))}
                </HSlider>
              </div>
            </section>

            {/* ======== 3. AI TOOLS (SLIDER) ======== */}
            <section className="container mx-auto px-4 md:px-6 mt-10 md:mt-14">
              <SectionHeading
                eyebrow="AI students tools"
                title="Built with AI, for Your Career"
                action={<Link to="/ai-tools" className="text-xs md:text-sm font-semibold text-primary flex items-center gap-0.5 hover:underline">All Tools <ChevronRight className="h-4 w-4" /></Link>}
              />
              <HSlider>
                {AI_TOOLS.map((t) => (
                  <Link key={t.to} to={t.to}
                    className="snap-start shrink-0 w-[200px] md:w-[240px] group relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover-lift">
                    <div className={`h-24 md:h-28 bg-gradient-to-br ${t.gradient} relative flex items-center justify-center`}>
                      <t.icon className="h-10 w-10 text-white drop-shadow-md" />
                      <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#0c2340]">{t.badge}</span>
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{t.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</div>
                    </div>
                  </Link>
                ))}
              </HSlider>
            </section>

            {/* ======== 4. SCHEMES BY CATEGORY (CONTENT) ======== */}
            <div id="schemes-list" className="container mx-auto px-4 md:px-6 mt-10 md:mt-14 space-y-10">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                CATEGORIES.map((cat) => {
                  const catSchemes = getSchemesByCategory(cat.key);
                  if (catSchemes.length === 0) return null;
                  return (
                    <section id={`cat-${cat.key}`} key={cat.key} className="animate-fade-in scroll-mt-20">
                      <SectionHeading
                        title={cat.label}
                        action={<span className="text-xs md:text-sm font-semibold text-primary">{catSchemes.length}+ schemes</span>}
                      />
                      <HSlider>
                        {catSchemes.map((s) => (<div key={s.id} className="snap-start"><SchemeCard scheme={s} /></div>))}
                      </HSlider>
                    </section>
                  );
                })
              )}
            </div>

            {/* ======== 5. CTA ======== */}
            {!user && (
              <div className="container mx-auto px-4 md:px-6 mt-12">
                <div className="relative overflow-hidden rounded-3xl animated-hero-bg p-7 md:p-12 text-center">
                  <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-yellow-400/30 blur-3xl" />
                  <h2 className="relative text-2xl md:text-4xl font-extrabold text-white mb-3">
                    Unlock All <span className="text-yellow-400">2500+ Schemes</span>
                  </h2>
                  <p className="relative text-white/80 text-sm md:text-base mb-6 max-w-md mx-auto">
                    Get full access to eligibility, documents, and direct apply links.
                  </p>
                  <Link to="/subscription" className="relative inline-block">
                    <Button size="lg" className="rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#0c2340] font-bold gap-2 shadow-xl shadow-yellow-400/40">
                      Get Started Free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Layout already renders Techrola Career banner + Footer below */}

        {user && (
          <UserPreferences open={prefsOpen} onOpenChange={setPrefsOpen}
            onPreferencesSaved={(state) => { if (state !== "all") setSelectedState(state); }} />
        )}
      </div>
    </Layout>
  );
};

export default Index;
