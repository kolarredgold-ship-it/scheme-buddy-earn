import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Sparkles, Search, Loader2, X, Check, ChevronRight, MapPin, Filter, GraduationCap, School, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";
import { tools as aiStudentTools } from "@/pages/AITools";
import { trackToolClick } from "@/lib/analytics";

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
  { key: "all", label: "All", icon: "🌐", color: "from-slate-500 to-slate-600", bg: "bg-slate-50 border-slate-200 hover:border-slate-400" },
  { key: "scholarships", label: "Scholarships", icon: "🎓", color: "from-blue-500 to-blue-600", bg: "bg-blue-50 border-blue-200 hover:border-blue-400" },
  { key: "women_empowerment", label: "Women", icon: "👩", color: "from-pink-500 to-pink-600", bg: "bg-pink-50 border-pink-200 hover:border-pink-400" },
  { key: "farmers", label: "Farmers", icon: "🌾", color: "from-amber-500 to-amber-600", bg: "bg-amber-50 border-amber-200 hover:border-amber-400" },
  { key: "employment", label: "Employment", icon: "💼", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-400" },
  { key: "housing", label: "Housing", icon: "🏠", color: "from-orange-500 to-orange-600", bg: "bg-orange-50 border-orange-200 hover:border-orange-400" },
  { key: "health", label: "Healthcare", icon: "🏥", color: "from-rose-500 to-rose-600", bg: "bg-rose-50 border-rose-200 hover:border-rose-400" },
  { key: "business", label: "Entrepreneurs", icon: "🚀", color: "from-violet-500 to-violet-600", bg: "bg-violet-50 border-violet-200 hover:border-violet-400" },
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

  // College finder
  const [cfLocation, setCfLocation] = useState("");
  const [cfType, setCfType] = useState<"both" | "college" | "school">("both");
  const [cfLoading, setCfLoading] = useState(false);
  const [cfItems, setCfItems] = useState<Array<{ name: string; type: string; city?: string; state?: string; category?: string; website?: string }> | null>(null);
  const [cfError, setCfError] = useState("");

  const handleCollegeFinder = async () => {
    const loc = cfLocation.trim();
    if (loc.length < 2) return;
    setCfLoading(true);
    setCfError("");
    setCfItems(null);
    try {
      const { data, error } = await supabase.functions.invoke("college-finder", {
        body: { location: loc, type: cfType },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setCfItems(data.items || []);
    } catch (e: any) {
      setCfError(e?.message || "Could not load results. Please try again.");
    } finally {
      setCfLoading(false);
    }
  };

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
        {/* GOV PORTAL TOP UTILITY STRIP */}
        <div className="bg-[#1a1a4e] text-white text-[11px] md:text-xs">
          <div className="container mx-auto px-4 h-8 flex items-center justify-between">
            <span className="opacity-90 truncate">भारत सरकार | Government of India initiatives aggregator</span>
            <div className="hidden md:flex items-center gap-3 opacity-90">
              <a href="#schemes" className="hover:underline">Skip to main</a>
              <span className="opacity-60">|</span>
              <span>A- A A+</span>
              <span className="opacity-60">|</span>
              <span>EN</span>
            </div>
          </div>
        </div>

        {/* GOV PORTAL HEADER BAND */}
        <div className="bg-white border-b-4 border-[#FF9933]">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF9933] via-white to-[#138808] border border-[#1a1a4e]/20 shadow-sm flex items-center justify-center">
              <span className="text-[#1a1a4e] font-extrabold text-lg" style={{ fontFamily: "Plus Jakarta Sans" }}>T</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[#1a1a4e]/70 font-semibold">Techrola — Career & Schemes Portal</div>
              <div className="text-sm md:text-base font-extrabold text-[#1a1a4e] leading-tight truncate" style={{ fontFamily: "Plus Jakarta Sans" }}>
                AI tools • Govt schemes • Internships • Interviews
              </div>
            </div>
          </div>
        </div>

        {/* HERO — govt portal style */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#eef1fb] via-[#f5f7fc] to-background">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
          <div className="container mx-auto px-4 py-10 md:py-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#1a1a4e]/15 px-3.5 py-1.5 text-[11px] md:text-xs font-semibold text-[#1a1a4e] mb-5 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#FF9933]" />
              AI powered career platform for India
            </div>

            <h1
              className="text-3xl md:text-6xl font-extrabold tracking-tight text-[#0f1b4d] leading-[1.1] max-w-4xl mx-auto"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              Your AI co-pilot for{" "}
              <span className="text-[#FF9933]">college, career</span>{" "}
              <br className="hidden md:block" />& beyond.
            </h1>

            <p className="mt-5 text-sm md:text-lg text-[#1a1a4e]/70 max-w-2xl mx-auto leading-relaxed">
              Techrola brings together AI tools, college discovery, internships, interview prep,
              and jobs — so every student can build a future they're proud of.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/ai-tools">
                <Button
                  size="lg"
                  className="rounded-md bg-[#1a1a4e] hover:bg-[#0f1b4d] text-white font-semibold gap-2 px-6"
                >
                  <Sparkles className="h-4 w-4" /> Try AI tools free
                </Button>
              </Link>
              <a href="#schemes">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-md border-[#1a1a4e]/30 text-[#1a1a4e] hover:bg-[#1a1a4e]/5 font-semibold gap-2 px-6 w-full sm:w-auto"
                >
                  <Search className="h-4 w-4" /> Browse schemes
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { v: "2,500+", l: "Government schemes" },
                { v: "19+", l: "AI career tools" },
                { v: "₹999", l: "Annual Pro plan" },
                { v: "28", l: "States covered" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-white border border-[#1a1a4e]/10 py-3 px-2 shadow-sm">
                  <div className="text-lg md:text-2xl font-extrabold text-[#1a1a4e]">{s.v}</div>
                  <div className="text-[10px] md:text-xs text-[#1a1a4e]/60 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sliding tools strip — auto-marquee banner */}
          <div className="relative overflow-hidden border-y border-[#1a1a4e]/15 bg-white">
            <div className="container mx-auto px-4 flex items-center">
              <span className="hidden md:inline-flex shrink-0 mr-3 text-[10px] font-bold uppercase tracking-wider text-white bg-[#1a1a4e] px-2.5 py-1 rounded">
                AI Tools
              </span>
              <div className="flex-1 overflow-hidden relative">
                <div
                  className="flex gap-3 py-3 w-max"
                  style={{ animation: "ticker 40s linear infinite" }}
                >
                  {[...aiStudentTools, ...aiStudentTools].map((t, i) => (
                    <Link
                      key={`${t.to}-${i}`}
                      to={t.to}
                      className="flex items-center gap-2 shrink-0 rounded-md bg-[#f5f7fc] border border-[#1a1a4e]/15 px-3.5 py-1.5 hover:border-[#FF9933] hover:bg-white hover:shadow-sm transition-all"
                    >
                      <span className="text-base leading-none">{t.icon}</span>
                      <span className="text-xs font-semibold text-[#1a1a4e] whitespace-nowrap">
                        {t.title.replace(/^AI\s+/, "")}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
              </div>
            </div>
          </div>

          {/* Notice / announcements scrolling ticker */}
          <div className="bg-[#fff8e8] border-b border-[#FF9933]/30 overflow-hidden">
            <div className="container mx-auto px-4 flex items-center gap-3">
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] md:text-xs font-extrabold uppercase tracking-wider text-white bg-[#FF9933] px-2.5 py-1 my-2 rounded">
                <Sparkles className="h-3 w-3" /> Notice
              </span>
              <div className="flex-1 overflow-hidden">
                <div
                  className="flex gap-10 py-2 w-max text-[12px] md:text-sm font-medium text-[#1a1a4e] whitespace-nowrap"
                  style={{ animation: "ticker 50s linear infinite" }}
                >
                  {[
                    "New: AI Internship Report Generator now supports 50+ company templates.",
                    "PM Vishwakarma Yojana applications open — check eligibility in Schemes.",
                    "Pro plan ₹999/year — unlock all 19+ AI tools and DOCX downloads.",
                    "Earn up to ₹400 per referral through the Techrola wallet.",
                    "Daily scheme updates from Central & State government portals.",
                  ].concat([
                    "New: AI Internship Report Generator now supports 50+ company templates.",
                    "PM Vishwakarma Yojana applications open — check eligibility in Schemes.",
                    "Pro plan ₹999/year — unlock all 19+ AI tools and DOCX downloads.",
                    "Earn up to ₹400 per referral through the Techrola wallet.",
                    "Daily scheme updates from Central & State government portals.",
                  ]).map((n, i) => (
                    <span key={i} className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#138808]" /> {n}
                    </span>
                  ))}
                </div>
              </div>
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

          {/* Featured hero tool — Internship Report Generator */}
          {aiStudentTools[0] && (
            <Link
              to={aiStudentTools[0].to}
              onClick={() => trackToolClick("internship-report-generator", "home-hero")}
              className="block group mb-8 active:scale-[0.99] transition-transform"
            >
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

          {/* Tool cards grid — improved spacing, hover/press states, descriptions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {aiStudentTools.slice(1).map((t, i) => (
              <Link
                key={t.to}
                to={t.to}
                onClick={() => trackToolClick(t.to, "home-grid")}
                className={`group relative flex flex-col items-start gap-2 p-4 rounded-2xl border bg-card ${TOOL_TINTS[i % TOOL_TINTS.length]} hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200`}
              >
                <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-white/70 dark:bg-white/10 border border-white/50 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                  {t.icon}
                </div>
                <h3 className="text-[13px] md:text-sm font-bold text-foreground leading-tight line-clamp-2">
                  {t.title.replace(/^AI\s+/, "")}
                </h3>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-snug line-clamp-2">
                  {t.desc}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link to="/ai-tools" onClick={() => trackToolClick("view-all", "home")}>
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

            {/* Featured schemes sliding strip */}
            {schemes.length > 0 && (
              <div className="relative -mx-4 mb-6 overflow-hidden group">
                <div
                  className="flex gap-3 py-2 px-4 w-max group-hover:[animation-play-state:paused]"
                  style={{ animation: "ticker 60s linear infinite" }}
                >
                  {[...schemes.slice(0, 12), ...schemes.slice(0, 12)].map((s, i) => (
                    <Link
                      key={`${s.id}-${i}`}
                      to={`/scheme/${s.slug}`}
                      className="shrink-0 w-[260px] rounded-2xl border border-emerald-200/70 bg-white p-4 hover:shadow-md hover:border-emerald-400 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${TAG_COLORS[s.category] || "bg-slate-100 text-slate-700"}`}>
                          {prettyCategory(s.category)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${s.state === "central" ? CENTRAL_TAG : STATE_TAG}`}>
                          {prettyState(s.state) || "Central"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                        {s.title}
                      </h3>
                      <span className="mt-auto text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                        View details <ChevronRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-stone-50/90 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-stone-50/90 to-transparent" />
              </div>
            )}

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

            {/* Category cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2.5 md:gap-3 mb-6">
              {CATEGORY_CHIPS.map((c) => {
                const active = activeCategory === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveCategory(c.key)}
                    className={`relative flex flex-col items-center justify-center gap-1.5 p-3 md:p-4 rounded-2xl border-2 transition-all ${
                      active
                        ? `bg-gradient-to-br ${c.color} text-white border-transparent shadow-lg scale-[1.03]`
                        : `${c.bg} text-foreground/80`
                    }`}
                  >
                    <span className="text-2xl md:text-3xl leading-none">{c.icon}</span>
                    <span className={`text-[11px] md:text-xs font-semibold text-center leading-tight ${active ? "text-white" : ""}`}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
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
                {/* Desktop: colorful grid cards */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {visible.slice(0, 12).map((s, i) => {
                    const palettes = [
                      { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", hover: "hover:border-rose-400" },
                      { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", hover: "hover:border-amber-400" },
                      { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", hover: "hover:border-emerald-400" },
                      { bg: "bg-sky-50", border: "border-sky-200", dot: "bg-sky-500", hover: "hover:border-sky-400" },
                      { bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500", hover: "hover:border-violet-400" },
                      { bg: "bg-fuchsia-50", border: "border-fuchsia-200", dot: "bg-fuchsia-500", hover: "hover:border-fuchsia-400" },
                      { bg: "bg-teal-50", border: "border-teal-200", dot: "bg-teal-500", hover: "hover:border-teal-400" },
                      { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", hover: "hover:border-orange-400" },
                    ];
                    const p = palettes[i % palettes.length];
                    return (
                      <Link
                        key={s.id}
                        to={`/scheme/${s.slug}`}
                        className={`group relative rounded-2xl border ${p.bg} ${p.border} ${p.hover} p-4 transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-3 min-h-[130px]`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${p.dot} shrink-0 mt-1.5`} />
                          <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-emerald-700">
                            {s.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-auto">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${TAG_COLORS[s.category] || "bg-slate-100 text-slate-700"}`}>
                            {prettyCategory(s.category)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${s.state === "central" ? CENTRAL_TAG : STATE_TAG}`}>
                            {prettyState(s.state) || "Central"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all ml-auto" />
                        </div>
                      </Link>
                    );
                  })}
                  {visible.length === 0 && (
                    <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                      No schemes match your filters.
                    </div>
                  )}
                </div>

                {/* Mobile: compact list */}
                <div className="md:hidden bg-background rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                  {visible.slice(0, 15).map((s) => (
                    <Link
                      key={s.id}
                      to={`/scheme/${s.slug}`}
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                      <span className="font-semibold text-sm text-foreground group-hover:text-emerald-700 truncate">
                        {s.title}
                      </span>
                      <span className="flex items-center gap-1.5 flex-wrap ml-auto shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${TAG_COLORS[s.category] || "bg-slate-100 text-slate-700"}`}>
                          {prettyCategory(s.category)}
                        </span>
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
                  "3 free AI generations (shared)",
                  "+5 generations per ₹499 top-up",
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

        {/* COLLEGE & SCHOOL FINDER */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 p-5 md:p-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full">
                <GraduationCap className="h-3.5 w-3.5" /> College & School Finder
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-extrabold text-foreground" style={{ fontFamily: "Plus Jakarta Sans" }}>
              Find colleges and schools near you
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Search by city, district or state — powered by AI. Results are listed as a directory, not ranked.
            </p>

            <div className="mt-5 flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={cfLocation}
                  onChange={(e) => setCfLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCollegeFinder()}
                  placeholder="Enter city, district, or state (e.g. Hyderabad, Pune)"
                  className="pl-9 h-11 bg-white"
                />
              </div>
              <Select value={cfType} onValueChange={(v: any) => setCfType(v)}>
                <SelectTrigger className="md:w-44 h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Colleges & Schools</SelectItem>
                  <SelectItem value="college">Colleges only</SelectItem>
                  <SelectItem value="school">Schools only</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleCollegeFinder}
                disabled={cfLoading || cfLocation.trim().length < 2}
                className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {cfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Search</>}
              </Button>
            </div>

            {cfError && (
              <p className="mt-4 text-sm text-rose-600">{cfError}</p>
            )}

            {cfItems && cfItems.length === 0 && !cfLoading && (
              <p className="mt-4 text-sm text-muted-foreground">No results found for this location.</p>
            )}

            {cfItems && cfItems.length > 0 && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {cfItems.map((it, i) => {
                  const isSchool = it.type === "school";
                  return (
                    <div key={i} className="rounded-xl bg-white border border-border/60 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isSchool ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                          {isSchool ? <School className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isSchool ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"}`}>
                              {isSchool ? "School" : "College"}
                            </span>
                            {it.category && (
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {it.category}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm text-foreground leading-snug">{it.name}</h3>
                          {(it.city || it.state) && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[it.city, it.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {it.website && (
                            <a
                              href={it.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-2 font-medium"
                            >
                              Visit website <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
