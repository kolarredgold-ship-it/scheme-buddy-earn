import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Sparkles, Search, Loader2, X, Check, ChevronRight, MapPin, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";
import { tools as aiStudentTools } from "@/pages/AITools";

const INDIAN_STATES = [
  { value: "all", label: "All states & central" },
  { value: "central", label: "Central Govt" },
  { value: "andhra_pradesh", label: "Andhra Pradesh" },
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
  { value: "madhya_pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "tamil_nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "uttar_pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" },
  { value: "west_bengal", label: "West Bengal" },
];

const CATEGORY_CHIPS = [
  { key: "all", label: "All" },
  { key: "scholarships", label: "Scholarships" },
  { key: "women_empowerment", label: "Women" },
  { key: "farmers", label: "Farmers" },
  { key: "employment", label: "Employment" },
  { key: "housing", label: "Housing" },
  { key: "health", label: "Healthcare" },
];

const TAG_COLORS: Record<string, string> = {
  scholarships: "bg-blue-100 text-blue-700",
  women_empowerment: "bg-pink-100 text-pink-700",
  farmers: "bg-amber-100 text-amber-800",
  employment: "bg-emerald-100 text-emerald-700",
  housing: "bg-orange-100 text-orange-700",
  health: "bg-rose-100 text-rose-700",
  business: "bg-violet-100 text-violet-700",
  education: "bg-cyan-100 text-cyan-700",
  sc_st: "bg-purple-100 text-purple-700",
  minority: "bg-fuchsia-100 text-fuchsia-700",
  govt_jobs: "bg-indigo-100 text-indigo-700",
};

const STATE_TAG = "bg-amber-100 text-amber-800";
const CENTRAL_TAG = "bg-slate-100 text-slate-700";

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
  if (!s) return "";
  if (s === "central") return "Central";
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
};

const prettyCategory = (c: string) => {
  const map: Record<string, string> = {
    scholarships: "Students",
    women_empowerment: "Women",
    farmers: "Farmers",
    employment: "Employment",
    housing: "Housing",
    health: "Healthcare",
    business: "Entrepreneurs",
    education: "Education",
    sc_st: "SC/ST",
    minority: "Minority",
    govt_jobs: "Govt Jobs",
    finance: "Finance",
  };
  return map[c] || c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const TOOL_TINTS = [
  "bg-violet-50 border-violet-200",
  "bg-rose-50 border-rose-200",
  "bg-amber-50 border-amber-200",
  "bg-emerald-50 border-emerald-200",
  "bg-sky-50 border-sky-200",
  "bg-orange-50 border-orange-200",
  "bg-pink-50 border-pink-200",
  "bg-lime-50 border-lime-200",
  "bg-cyan-50 border-cyan-200",
  "bg-fuchsia-50 border-fuchsia-200",
  "bg-teal-50 border-teal-200",
  "bg-indigo-50 border-indigo-200",
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("preferred_state")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.preferred_state && data.preferred_state !== "all") {
          setSelectedState(data.preferred_state);
        } else if (!data) {
          setPrefsOpen(true);
        }
      });
  }, [user]);

  useEffect(() => {
    supabase
      .from("schemes")
      .select("id, title, category, description, image_url, created_at, state, slug")
      .order("created_at", { ascending: false })
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
      const { data, error } = await supabase.functions.invoke("ai-scheme-search", {
        body: { query: q },
      });
      if (error) throw error;
      setAiResults(data.schemes || []);
      setAiSummary(data.ai_summary || "");
    } catch {
      const local = schemes.filter(
        (s) =>
          s.title.toLowerCase().includes(q.toLowerCase()) ||
          s.description?.toLowerCase().includes(q.toLowerCase())
      );
      setAiResults(local);
      setAiSummary("");
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setAiResults(null);
    setAiSummary("");
  };

  const stateFiltered =
    selectedState === "all"
      ? schemes
      : schemes.filter((s) => s.state === selectedState || s.state === "central");

  const visible = aiResults
    ? aiResults
    : activeCategory === "all"
      ? stateFiltered
      : stateFiltered.filter((s) => s.category === activeCategory);

  return (
    <Layout>
      <div className="pb-24 md:pb-12 bg-background">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-teal-50/60 to-background">
          <div className="container mx-auto px-4 py-12 md:py-20 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 border border-emerald-200 px-4 py-1.5 text-xs md:text-sm font-semibold text-emerald-800 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              AI powered career platform for India
            </div>

            <h1
              className="text-3xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] max-w-4xl mx-auto"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Your AI co-pilot for{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                college, career
              </span>{" "}
              <br className="hidden md:block" />& beyond.
            </h1>

            <p className="mt-5 text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Techrola brings together AI tools, college discovery, internships, interview prep,
              and jobs — so every student can build a future they're proud of.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/ai-tools">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-foreground/15 bg-background hover:bg-muted font-semibold gap-2 px-6"
                >
                  <Sparkles className="h-4 w-4" /> Try AI tools free
                </Button>
              </Link>
              <a href="#schemes">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-foreground/15 bg-background hover:bg-muted font-semibold gap-2 px-6 w-full sm:w-auto"
                >
                  <Search className="h-4 w-4" /> Browse schemes
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { v: "2,500+", l: "Government schemes" },
                { v: "19+", l: "AI career tools" },
                { v: "₹999", l: "Annual Pro plan" },
                { v: "28", l: "States covered" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-xl md:text-3xl font-extrabold text-emerald-700">{s.v}</div>
                  <div className="text-[11px] md:text-xs text-muted-foreground mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI TOOLS */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="mb-5">
            <h2
              className="text-xl md:text-3xl font-extrabold text-foreground"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              AI tools built for your career
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              19+ tools to write, prepare, and grow — unlock all with Pro
            </p>
          </div>

          {/* Featured hero tool */}
          {aiStudentTools[0] && (
            <Link to={aiStudentTools[0].to} className="block group mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-5 md:p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative flex items-start md:items-center gap-4 md:gap-6">
                  <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center shrink-0 text-3xl md:text-4xl">
                    📄
                  </div>
                  <div className="flex-1 min-w-0 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] md:text-xs font-bold bg-orange-400 text-orange-950 px-2 py-0.5 rounded-full">
                        Most popular
                      </span>
                      <span className="text-[10px] md:text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                        DOCX
                      </span>
                    </div>
                    <h3
                      className="font-extrabold text-lg md:text-2xl leading-tight mb-1"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      AI Internship Report Generator
                    </h3>
                    <p className="text-[12px] md:text-sm text-white/85 mb-3 max-w-xl">
                      Generate professional reports instantly. Download-ready DOCX in 60 seconds.
                    </p>
                    <span className="inline-flex items-center gap-1.5 bg-white text-indigo-700 px-3.5 py-1.5 rounded-lg font-bold text-xs md:text-sm group-hover:gap-2.5 transition-all">
                      Generate now <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Tool icons grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 md:gap-5">
            {aiStudentTools.slice(1).map((t, i) => (
              <Link key={t.to} to={t.to} className="group flex flex-col items-center text-center">
                <div
                  className={`h-16 w-16 md:h-20 md:w-20 rounded-full border ${TOOL_TINTS[i % TOOL_TINTS.length]} flex items-center justify-center mb-2 transition-all group-hover:scale-105 group-hover:shadow-md`}
                >
                  <span className="text-2xl md:text-3xl">{t.icon}</span>
                </div>
                <span className="text-[11px] md:text-xs font-semibold text-foreground/80 leading-tight line-clamp-2 px-1">
                  {t.title.replace(/^AI\s+/, "")}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link to="/ai-tools">
              <Button
                variant="outline"
                className="rounded-xl border-foreground/15 font-semibold gap-2 px-5"
              >
                <Sparkles className="h-4 w-4" /> View all AI tools on Techrola
              </Button>
            </Link>
          </div>
        </section>

        {/* SCHEMES */}
        <section id="schemes" className="bg-stone-50/70 border-y border-border/40">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <div className="mb-5">
              <h2
                className="text-xl md:text-3xl font-extrabold text-foreground"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Explore government schemes
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                2,500+ free to browse — no sign-up needed
              </p>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="AI Search: 'free laptop Tamil Nadu'"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length < 3) {
                      setAiResults(null);
                      setAiSummary("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full h-11 pl-9 pr-20 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  disabled={searching || searchQuery.trim().length < 3}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                </button>
              </div>
            </div>

            {/* Filter by state */}
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <Filter className="h-3.5 w-3.5" /> Filter by state
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full sm:w-[320px] h-11 rounded-xl bg-background">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[320px]">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {CATEGORY_CHIPS.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(c.key)}
                  className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium border transition-all ${
                    activeCategory === c.key
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-background text-foreground/70 border-border hover:border-emerald-400"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Scheme list */}
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
              </div>
            ) : (
              <>
                {aiSummary && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-4">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/80">{aiSummary}</p>
                  </div>
                )}
                <div className="bg-background rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                  {visible.slice(0, 15).map((s) => (
                    <Link
                      key={s.id}
                      to={`/scheme/${s.slug}`}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                      <span className="font-semibold text-sm md:text-base text-foreground group-hover:text-emerald-700 truncate">
                        {s.title}
                      </span>
                      <span className="flex items-center gap-1.5 flex-wrap ml-auto shrink-0">
                        <span
                          className={`text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium ${TAG_COLORS[s.category] || "bg-slate-100 text-slate-700"}`}
                        >
                          {prettyCategory(s.category)}
                        </span>
                        <span
                          className={`text-[10px] md:text-xs px-2 py-0.5 rounded-md font-medium ${s.state === "central" ? CENTRAL_TAG : STATE_TAG}`}
                        >
                          {prettyState(s.state) || "Central"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all hidden md:block" />
                      </span>
                    </Link>
                  ))}
                  {visible.length === 0 && (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No schemes match your filters.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* PRICING */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="mb-6">
            <h2
              className="text-xl md:text-3xl font-extrabold text-foreground"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Simple, honest pricing
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Start free, unlock everything for less than ₹83/month
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-4xl">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Free
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "Browse 2,500+ schemes",
                  "No apply links",
                  "Try 1 AI tool",
                  "Downloaded reports",
                  "Full AI tools access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground/80">
                    <Check className="h-4 w-4 text-muted-foreground" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block mt-6">
                <Button variant="outline" className="w-full rounded-xl font-semibold">
                  Get started free
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-emerald-500 bg-card p-6 shadow-lg shadow-emerald-500/10">
              <span className="absolute -top-3 left-6 text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full">
                Most popular
              </span>
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Pro
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">₹999</span>
                <span className="text-sm text-muted-foreground">/ year</span>
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">Just ₹83/month</div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "Browse 2,500+ schemes",
                  "All 19+ AI tools",
                  "3 generations per tool",
                  "Download DOCX reports",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="h-4 w-4 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/subscription" className="block mt-6">
                <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Get Pro — ₹999/year
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {prefsOpen && (
          <UserPreferences open={prefsOpen} onOpenChange={setPrefsOpen} />
        )}
      </div>
    </Layout>
  );
};

export default Index;
