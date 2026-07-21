import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Search, Loader2, X, ChevronRight, MapPin, Star, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";
import { tools as aiStudentTools } from "@/pages/AITools";
import { trackToolClick } from "@/lib/analytics";
import HomeBlogSection from "@/components/HomeBlogSection";

const INDIAN_STATES = [
  { value: "all", label: "All states & central" },
  { value: "central", label: "Central Govt" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
  { value: "bihar", label: "Bihar" },
  { value: "delhi", label: "Delhi" },
  { value: "gujarat", label: "Gujarat" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "west_bengal", label: "West Bengal" },
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

const prettyState = (s: string | null) => {
  if (!s) return "Central";
  if (s === "central") return "Central";
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
};

const prettyCategory = (c: string) => {
  const map: Record<string, string> = {
    scholarships: "Scholarships", women_empowerment: "Women", farmers: "Farmers",
    employment: "Employment", housing: "Housing", health: "Healthcare",
    business: "Entrepreneurs", education: "Education", sc_st: "SC/ST",
    minority: "Minority", govt_jobs: "Govt Jobs", private_jobs: "Private Jobs",
    finance: "Finance",
  };
  return map[c] || c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

// Coursera-style career category tabs (blue → green gradient band)
const JOB_CATEGORIES = [
  { key: "scholarships", label: "Education" },
  { key: "govt_jobs", label: "Govt Jobs" },
  { key: "private_jobs", label: "Private Jobs" },
  { key: "business", label: "Business" },
  { key: "farmers", label: "Agriculture" },
  { key: "women_empowerment", label: "Women" },
];

const Index = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [aiResults, setAiResults] = useState<Scheme[] | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [searching, setSearching] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [jobTab, setJobTab] = useState(JOB_CATEGORIES[0].key);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_preferences").select("preferred_state").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.preferred_state && data.preferred_state !== "all") setSelectedState(data.preferred_state);
        else if (!data) setPrefsOpen(true);
      });
  }, [user]);

  useEffect(() => {
    supabase.from("schemes")
      .select("id, title, category, description, image_url, created_at, state, slug")
      .order("created_at", { ascending: false }).limit(60)
      .then(({ data }) => {
        if (data) setSchemes(data as unknown as Scheme[]);
        setLoading(false);
      });
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 3) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-scheme-search", { body: { query: q } });
      if (error) throw error;
      setAiResults(data.schemes || []);
      setAiSummary(data.ai_summary || "");
    } catch {
      const local = schemes.filter(
        (s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.description?.toLowerCase().includes(q.toLowerCase())
      );
      setAiResults(local);
      setAiSummary("");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => { setSearchQuery(""); setAiResults(null); setAiSummary(""); };

  const stateFiltered = selectedState === "all"
    ? schemes
    : schemes.filter((s) => s.state === selectedState || s.state === "central");

  const visible = aiResults
    ? aiResults
    : activeCategory === "all"
      ? stateFiltered
      : activeCategory === "employment"
        ? stateFiltered.filter((s) => s.category === "govt_jobs" || s.category === "private_jobs")
        : stateFiltered.filter((s) => s.category === activeCategory);

  // Three curated columns Coursera-style
  const columns = useMemo(() => {
    const popular = schemes.slice(0, 3);
    const recent = schemes.slice(3, 6);
    const trending = schemes.filter((s) => s.category === "scholarships" || s.category === "govt_jobs").slice(0, 3);
    return [
      { title: "Most popular", items: popular },
      { title: "Latest schemes", items: recent },
      { title: "Trending: Scholarships & Jobs", items: trending.length ? trending : schemes.slice(6, 9) },
    ];
  }, [schemes]);

  const jobItems = schemes
    .filter((s) => (jobTab === "private_jobs" ? s.category === "private_jobs" : s.category === jobTab))
    .slice(0, 4);

  const featuredTool = aiStudentTools[0];
  const otherTools = aiStudentTools.slice(1);

  return (
    <Layout>
      <div className="bg-background pb-16">
        {/* PROMO HERO — two Coursera-style promo cards */}
        <section className="border-b border-border/70">
          <div className="container mx-auto px-4 py-8 md:py-10 grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Left promo — light */}
            <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--coursera-blue-soft))] p-6 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[320px]">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Techrola · Career Program</div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight max-w-md">
                  Unlock 2,500+ government schemes, AI career tools & mock interviews
                </h1>
                <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md">
                  Discover schemes, build a job-ready profile and land your first offer — all in one platform for Indian students.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={user ? "/dashboard" : "/signup"}>
                  <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 px-6 shadow-sm">
                    Get started
                  </Button>
                </Link>
                <a href="#schemes">
                  <Button variant="outline" className="rounded-full h-11 px-6 border-primary text-primary hover:bg-primary/5 font-semibold">
                    Explore schemes
                  </Button>
                </a>
              </div>
              <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            </div>

            {/* Right promo — dark blue */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(214,100%,32%)] text-white p-6 md:p-10 flex flex-col justify-between min-h-[280px] md:min-h-[320px]">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/80 mb-3">Join Pro · ₹999/year</div>
                <h2 className="text-2xl md:text-4xl font-extrabold leading-tight max-w-md">
                  Start, switch, or advance your career with AI
                </h2>
                <p className="mt-3 text-sm md:text-base text-white/85 max-w-md">
                  Resume Builder, Live HR Interviews, Internship Report Generator and 19+ tools trained for the Indian job market.
                </p>
              </div>
              <div className="mt-6">
                <Link to="/subscription">
                  <Button className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11 px-6 gap-2">
                    Upgrade to Pro <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            </div>
          </div>
        </section>

        {/* NEW AND POPULAR — three columns, Coursera style */}
        <section id="schemes" className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">New and popular</h2>
              <p className="text-sm text-muted-foreground mt-1">Government schemes and job listings updated daily</p>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-full border-border">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-6 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="What do you want to explore? Try “free laptop Tamil Nadu”"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length < 3) { setAiResults(null); setAiSummary(""); }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-12 pl-11 pr-24 rounded-full bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-16 top-1/2 -translate-y-1/2 text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={searching || searchQuery.trim().length < 3}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center disabled:opacity-40"
              aria-label="Search"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 text-primary animate-spin" /></div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {columns.map((col) => (
                <div key={col.title} className="rounded-2xl bg-[hsl(var(--coursera-blue-soft))] p-5 md:p-6">
                  <Link to="/schemes" className="flex items-center justify-between mb-4 group">
                    <h3 className="text-base md:text-lg font-bold text-foreground">{col.title}</h3>
                    <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <div className="space-y-3">
                    {col.items.map((s) => (
                      <Link
                        key={s.id}
                        to={`/scheme/${s.slug}`}
                        className="flex gap-3 p-3 rounded-xl bg-white border border-border/60 hover:shadow-md hover:border-primary/40 transition-all"
                      >
                        <div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 overflow-hidden flex items-center justify-center">
                          {s.image_url ? (
                            <img src={s.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <span className="text-primary font-bold text-lg">{prettyCategory(s.category)[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-primary">{prettyState(s.state)}</div>
                          <div className="text-sm font-bold text-foreground leading-snug line-clamp-2">{s.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            {prettyCategory(s.category)} · <Star className="h-3 w-3 fill-current text-amber-500" /> 4.8
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {aiSummary && (
            <div className="mt-6 flex items-start gap-2 p-4 rounded-xl bg-[hsl(var(--coursera-blue-soft))] border border-primary/20 max-w-3xl">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">{aiSummary}</p>
            </div>
          )}

          {aiResults && aiResults.length > 0 && (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiResults.slice(0, 9).map((s) => (
                <Link key={s.id} to={`/scheme/${s.slug}`} className="rounded-xl bg-white border border-border p-4 hover:shadow-md hover:border-primary/40 transition-all">
                  <div className="text-[11px] font-semibold text-primary">{prettyState(s.state)}</div>
                  <div className="text-sm font-bold text-foreground line-clamp-2">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{prettyCategory(s.category)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* JOB-READY GRADIENT BAND — blue → teal → green tabs (Coursera signature) */}
        <section className="container mx-auto px-4">
          <div className="rounded-3xl p-6 md:p-10 relative overflow-hidden" style={{ background: "var(--gradient-job)" }}>
            <div className="grid md:grid-cols-[280px_1fr] gap-6 md:gap-10 items-start">
              <div className="text-white">
                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">Get job-ready for an in-demand career</h2>
                <p className="mt-3 text-sm md:text-base text-white/90">No prior experience needed. Pick a path and start.</p>
                <Link to={user ? "/career-program" : "/signup"} className="inline-block mt-5">
                  <Button className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11 px-6 gap-2">
                    Start learning <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div>
                {/* Category tabs */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {JOB_CATEGORIES.map((c) => {
                    const active = jobTab === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setJobTab(c.key)}
                        className={`px-4 h-9 rounded-full text-sm font-semibold transition-all ${
                          active ? "bg-[hsl(var(--coursera-navy))] text-white" : "bg-white/85 text-foreground hover:bg-white"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(jobItems.length ? jobItems : schemes.slice(0, 4)).map((s) => (
                    <Link
                      key={s.id}
                      to={`/scheme/${s.slug}`}
                      className="rounded-2xl bg-white p-4 flex flex-col gap-2 hover:shadow-lg transition-all border border-white/60"
                    >
                      <div className="h-24 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
                        {s.image_url ? (
                          <img src={s.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-primary font-extrabold text-2xl">{prettyCategory(s.category)[0]}</span>
                        )}
                      </div>
                      <div className="text-[11px] font-semibold text-primary">{prettyState(s.state)}</div>
                      <div className="text-sm font-bold text-foreground line-clamp-2">{s.title}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI TOOLS — Coursera course card grid */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">AI tools built for your career</h2>
              <p className="text-sm text-muted-foreground mt-1">19+ tools to write, prepare, and grow — unlock all with Pro</p>
            </div>
            <Link to="/ai-tools" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Featured hero tool */}
          {featuredTool && (
            <Link
              to={featuredTool.to}
              onClick={() => trackToolClick("internship-report-generator", "home-hero")}
              className="block group mb-8"
            >
              <div className="rounded-2xl bg-gradient-to-br from-primary to-[hsl(214,100%,32%)] text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-xl transition-shadow">
                <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-3xl shrink-0">📄</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">Most popular</span>
                    <span className="text-[11px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">DOCX</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold leading-tight">AI Internship Report Generator</h3>
                  <p className="mt-1 text-sm md:text-base text-white/85">Generate professional reports instantly. Download-ready DOCX in 60 seconds.</p>
                </div>
                <Button className="rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11 px-6 gap-2 shrink-0">
                  Generate now <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          )}

          {/* Tool cards grid — course-card style */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {otherTools.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                onClick={() => trackToolClick(t.to, "home-grid")}
                className="group rounded-2xl bg-card border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all"
              >
                <div className="h-28 bg-[hsl(var(--coursera-blue-soft))] flex items-center justify-center text-4xl">{t.icon}</div>
                <div className="p-4">
                  <div className="text-[11px] font-semibold text-primary mb-1">Techrola AI</div>
                  <h3 className="text-sm md:text-base font-bold text-foreground leading-snug line-clamp-2 mb-1">
                    {t.title.replace(/^AI\s+/, "")}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Star className="h-3 w-3 fill-current text-amber-500" /> 4.8 · Free with Pro
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 md:hidden flex justify-center">
            <Link to="/ai-tools">
              <Button variant="outline" className="rounded-full font-semibold px-6">View all AI tools</Button>
            </Link>
          </div>
        </section>

        {/* CATEGORY LIST — schemes filter as Coursera "browse by category" */}
        <section className="border-y border-border/70 bg-[hsl(var(--coursera-blue-soft))]/40">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Browse schemes by category</h2>
              <p className="text-sm text-muted-foreground mt-1">Filter the 2,500+ verified schemes we track</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { key: "all", label: "All" },
                { key: "scholarships", label: "Scholarships" },
                { key: "women_empowerment", label: "Women" },
                { key: "farmers", label: "Farmers" },
                { key: "employment", label: "Employment" },
                { key: "housing", label: "Housing" },
                { key: "health", label: "Healthcare" },
                { key: "business", label: "Entrepreneurs" },
              ].map((c) => {
                const active = activeCategory === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveCategory(c.key)}
                    className={`px-4 h-9 rounded-full text-sm font-semibold border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visible.slice(0, 8).map((s) => (
                <Link
                  key={s.id}
                  to={`/scheme/${s.slug}`}
                  className="group rounded-2xl bg-white border border-border overflow-hidden hover:shadow-md hover:border-primary/40 transition-all"
                >
                  <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                    {s.image_url ? (
                      <img src={s.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-extrabold text-3xl">
                        {prettyCategory(s.category)[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] font-semibold text-primary mb-1">{prettyState(s.state)}</div>
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-1">{s.title}</h3>
                    <div className="text-[11px] text-muted-foreground">{prettyCategory(s.category)}</div>
                  </div>
                </Link>
              ))}
              {visible.length === 0 && (
                <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                  No schemes match your filters.
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <Link to="/schemes">
                <Button variant="outline" className="rounded-full font-semibold px-6 border-primary text-primary hover:bg-primary/5">
                  View all schemes <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* LATEST BLOGS */}
        <HomeBlogSection />

        {/* PRICING — clean two-card */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Simple, honest pricing</h2>
            <p className="text-sm text-muted-foreground mt-2">Start free. Unlock everything for less than ₹83/month.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Free</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm text-foreground/80">
                <li>· Browse 2,500+ schemes</li>
                <li>· Try 1 AI tool</li>
                <li>· Daily blog updates</li>
              </ul>
              <Link to="/signup" className="block mt-6">
                <Button variant="outline" className="w-full rounded-full font-semibold border-primary text-primary hover:bg-primary/5">Get started free</Button>
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-lg shadow-primary/10">
              <span className="absolute -top-3 left-6 text-[11px] font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-full">Most popular</span>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">Pro</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">₹999</span>
                <span className="text-sm text-muted-foreground">/ year</span>
              </div>
              <div className="text-xs text-primary font-semibold mt-1">Just ₹83/month</div>
              <ul className="mt-5 space-y-2.5 text-sm text-foreground">
                <li>· All 19+ AI tools</li>
                <li>· 3 free AI generations included</li>
                <li>· +5 generations per ₹499 top-up</li>
                <li>· Priority support</li>
              </ul>
              <Link to="/subscription" className="block mt-6">
                <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  Get Pro — ₹999/year
                </Button>
              </Link>
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                🔒 Secured payments by <span className="font-bold text-foreground">Razorpay</span>
              </p>
            </div>
          </div>
        </section>

        {prefsOpen && <UserPreferences open={prefsOpen} onOpenChange={setPrefsOpen} />}
      </div>
    </Layout>
  );
};

export default Index;
