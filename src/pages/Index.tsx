import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  Sparkles,
  Search,
  Loader2,
  X,
  Check,
  ChevronRight,
  MapPin,
  GraduationCap,
  School,
  ExternalLink,
  Landmark,
  IdCard,
  BookOpen,
  Briefcase,
  Mic,
  FileText,
  Trophy,
  Rocket,
  Building2,
  Star,
} from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";
import { tools as aiStudentTools } from "@/pages/AITools";
import { trackToolClick } from "@/lib/analytics";
import heroStudents from "@/assets/hero-students.png";
import HomeBlogSection from "@/components/HomeBlogSection";
import SectionHeader from "@/components/home/SectionHeader";
import CategoryTile from "@/components/home/CategoryTile";
import SchemeCardFiverr from "@/components/home/SchemeCardFiverr";

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
  if (s === "central") return "Central Govt";
  return s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
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

const ROTATING_WORDS = ["scheme", "internship", "mock interview", "career tool", "scholarship"];

const CATEGORY_TILES = [
  { label: "Central Schemes", icon: Landmark, href: "/?cat=central", tint: "bg-primary/10 text-primary" },
  { label: "State Schemes", icon: MapPin, href: "/?cat=state", tint: "bg-secondary/10 text-secondary" },
  { label: "Scholarships", icon: GraduationCap, href: "/?cat=scholarships", tint: "bg-accent/15 text-accent" },
  { label: "Internships", icon: Briefcase, href: "/ai-tools", tint: "bg-primary/10 text-primary" },
  { label: "AI Tools", icon: Sparkles, href: "/ai-tools", tint: "bg-secondary/10 text-secondary" },
  { label: "Mock Interview", icon: Mic, href: "/mock-interview", tint: "bg-accent/15 text-accent" },
  { label: "Career Program", icon: Trophy, href: "/career-program", tint: "bg-primary/10 text-primary" },
  { label: "Reports", icon: FileText, href: "/ai-tools", tint: "bg-secondary/10 text-secondary" },
];

const POPULAR_CHIPS = [
  { label: "PM Schemes", href: "/?q=PM" },
  { label: "Scholarships", href: "/?cat=scholarships" },
  { label: "Mock Interview", href: "/mock-interview" },
  { label: "Resume Builder", href: "/ai-tools" },
  { label: "Internships", href: "/ai-tools" },
];

const Index = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [aiResults, setAiResults] = useState<Scheme[] | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [searching, setSearching] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [wordIdx, setWordIdx] = useState(0);

  // College finder state
  const [cfLocation, setCfLocation] = useState("");
  const [cfType, setCfType] = useState<"both" | "college" | "school">("both");
  const [cfLoading, setCfLoading] = useState(false);
  const [cfItems, setCfItems] = useState<Array<{ name: string; type: string; city?: string; state?: string; category?: string; website?: string }> | null>(null);
  const [cfError, setCfError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setWordIdx((i) => (i + 1) % ROTATING_WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

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
      const { data, error } = await supabase.functions.invoke("ai-scheme-search", { body: { query: q } });
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

  const handleCollegeFinder = async () => {
    const loc = cfLocation.trim();
    if (loc.length < 2) return;
    setCfLoading(true);
    setCfError("");
    setCfItems(null);
    try {
      const { data, error } = await supabase.functions.invoke("college-finder", { body: { location: loc, type: cfType } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Search failed");
      setCfItems(data.items || []);
    } catch (e: any) {
      setCfError(e?.message || "Could not load results. Please try again.");
    } finally {
      setCfLoading(false);
    }
  };

  const stateFiltered =
    selectedState === "all"
      ? schemes
      : schemes.filter((s) => s.state === selectedState || s.state === "central");

  const visible = aiResults ? aiResults : stateFiltered;

  return (
    <Layout>
      <div className="pb-24 md:pb-12 bg-background">
        {/* HERO — Fiverr-style editorial */}
        <section className="relative bg-background border-b border-border">
          <div className="container mx-auto px-4 pt-8 md:pt-16 pb-10 md:pb-20">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center">
              <div>
                <h1
                  className="text-[34px] leading-[1.05] md:text-6xl lg:text-7xl font-extrabold text-foreground tracking-tight"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Find the right
                  <br className="hidden md:block" />{" "}
                  <span className="relative inline-block align-baseline">
                    <span
                      key={wordIdx}
                      className="inline-block text-primary italic underline decoration-accent decoration-[6px] underline-offset-[6px] animate-in fade-in slide-in-from-bottom-2 duration-500"
                      style={{ fontFamily: "Plus Jakarta Sans" }}
                    >
                      {ROTATING_WORDS[wordIdx]}
                    </span>
                  </span>
                  ,<br />
                  right away.
                </h1>

                <p className="mt-4 md:mt-6 text-sm md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Browse 2,500+ government schemes, AI career tools and mock interviews — all in one trusted platform built for Bharat.
                </p>

                {/* Big search bar */}
                <div className="mt-6 md:mt-8 flex items-center h-14 md:h-16 rounded-2xl border border-border bg-card shadow-sm focus-within:shadow-md focus-within:border-foreground/40 transition-all overflow-hidden pl-4 md:pl-5 pr-1.5 md:pr-2">
                  <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length < 3) {
                        setAiResults(null);
                        setAiSummary("");
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder='Try "free laptop for students in Tamil Nadu"'
                    className="flex-1 min-w-0 mx-2 md:mx-3 bg-transparent outline-none text-sm md:text-base text-foreground placeholder:text-muted-foreground"
                    aria-label="Search schemes and tools"
                  />
                  {searchQuery && (
                    <button onClick={clearSearch} aria-label="Clear" className="p-1 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={searching || searchQuery.trim().length < 3}
                    className="h-11 md:h-12 px-4 md:px-6 rounded-xl bg-foreground text-background text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Search</>}
                  </button>
                </div>

                {/* Popular chips */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">Popular:</span>
                  {POPULAR_CHIPS.map((c) => (
                    <Link
                      key={c.label}
                      to={c.href}
                      className="text-xs md:text-sm border border-border rounded-full px-3 py-1 hover:border-foreground/40 hover:bg-muted/50 transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right visual */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -top-4 -left-4 h-24 w-24 rounded-2xl bg-accent/20" aria-hidden />
                  <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-secondary/20" aria-hidden />
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-border shadow-xl bg-card">
                    <img src={heroStudents} alt="Techrola students" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-4 left-6 right-6 bg-card border border-border rounded-2xl shadow-lg p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Star className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground">Trusted by 50,000+ students</div>
                      <div className="text-[11px] text-muted-foreground">4.8/5 across India</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED STRIP */}
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-4 md:py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Trusted by students across India
              </span>
              <div className="flex items-center gap-5 md:gap-8 text-xs md:text-sm text-muted-foreground font-semibold">
                <span><span className="text-foreground font-extrabold">50,000+</span> students</span>
                <span><span className="text-foreground font-extrabold">2,500+</span> schemes</span>
                <span><span className="text-foreground font-extrabold">28</span> states covered</span>
                <span className="hidden md:inline"><span className="text-foreground font-extrabold">20+</span> AI tools</span>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY TILES RAIL */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <SectionHeader title="Browse by category" subtitle="Everything a learner needs in one place" />
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 md:gap-4 min-w-max pb-2">
              {CATEGORY_TILES.map((t) => (
                <CategoryTile key={t.label} icon={t.icon} label={t.label} href={t.href} tint={t.tint} />
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR SCHEMES RAIL */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <SectionHeader
            title="Popular schemes"
            subtitle="Direct apply links, verified sources"
            href="#all-schemes"
            linkLabel="See all schemes"
          />
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 min-w-max pb-2">
                {schemes.slice(0, 10).map((s) => (
                  <SchemeCardFiverr
                    key={s.id}
                    slug={s.slug}
                    title={s.title}
                    category={s.category}
                    state={s.state}
                    image_url={s.image_url}
                    categoryLabel={prettyCategory(s.category)}
                    stateLabel={prettyState(s.state) || "Central Govt"}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* AI TOOLS RAIL */}
        <section className="bg-muted/30 border-y border-border">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <SectionHeader
              title="AI tools built for your career"
              subtitle="Write, prepare and grow — 20+ tools"
              href="/ai-tools"
              linkLabel="View all tools"
            />
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 min-w-max pb-2">
                {aiStudentTools.slice(0, 10).map((t) => (
                  <Link
                    key={t.to}
                    to={t.to}
                    onClick={() => trackToolClick(t.to, "home-rail")}
                    className="shrink-0 w-[220px] rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-3">
                      {t.icon}
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                      {t.title.replace(/^AI\s+/, "")}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ALL SCHEMES — filterable */}
        <section id="all-schemes" className="container mx-auto px-4 py-10 md:py-14">
          <SectionHeader title="Explore all schemes" subtitle="2,500+ free to browse — no sign-up needed" />

          <div className="flex flex-col md:flex-row gap-2 mb-5">
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="md:w-[280px] h-11 rounded-xl bg-card">
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

          {aiSummary && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/30 mb-4">
              <Sparkles className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80">{aiSummary}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 text-primary animate-spin" /></div>
          ) : visible.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No schemes match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.slice(0, 15).map((s) => (
                <Link
                  key={s.id}
                  to={`/scheme/${s.slug}`}
                  className="group flex gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-foreground/30 hover:shadow-sm transition-all"
                >
                  <div className="h-16 w-16 shrink-0 rounded-xl bg-muted overflow-hidden">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <Landmark className="h-6 w-6 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground/70">{prettyCategory(s.category)}</span>
                      <span>·</span>
                      <span className="truncate">{prettyState(s.state) || "Central"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CAREER PROGRAM BAND */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-accent/20 text-accent-foreground px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Career Program
              </span>
              <h2
                className="mt-3 text-2xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Work · Learn · Get Hired
              </h2>
              <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">
                A simple 6-step path from signup to your first job offer. Earn rewards, get certified, land real opportunities.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Register", "Subscribe", "EMP Code", "Promote", "Build Streak", "Get Hired"].map((s, i) => (
                  <span key={s} className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border rounded-full px-2.5 py-1">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <Link to={user ? "/career-program" : "/signup"} className="shrink-0">
              <Button size="lg" className="rounded-xl font-bold bg-foreground text-background hover:opacity-90">
                Start your journey <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* BLOGS */}
        <HomeBlogSection />

        {/* COLLEGE & SCHOOL FINDER */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
            <SectionHeader title="Find colleges & schools near you" subtitle="Search by city, district or state — AI-powered directory" />
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={cfLocation}
                  onChange={(e) => setCfLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCollegeFinder()}
                  placeholder="Enter city, district or state (e.g. Hyderabad, Pune)"
                  className="pl-9 h-11 bg-background"
                />
              </div>
              <Select value={cfType} onValueChange={(v: any) => setCfType(v)}>
                <SelectTrigger className="md:w-44 h-11 bg-background">
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
                className="h-11 px-5 bg-foreground hover:opacity-90 text-background font-semibold rounded-xl"
              >
                {cfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Search</>}
              </Button>
            </div>

            {cfError && <p className="mt-4 text-sm text-destructive">{cfError}</p>}
            {cfItems && cfItems.length === 0 && !cfLoading && (
              <p className="mt-4 text-sm text-muted-foreground">No results found for this location.</p>
            )}
            {cfItems && cfItems.length > 0 && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                {cfItems.map((it, i) => {
                  const isSchool = it.type === "school";
                  return (
                    <div key={i} className="rounded-xl bg-background border border-border p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isSchool ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
                          {isSchool ? <School className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${isSchool ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}>
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
                              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
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

        {/* PRICING */}
        <section className="container mx-auto px-4 py-10 md:py-14">
          <SectionHeader title="Simple, honest pricing" subtitle="Start free, unlock everything for less than ₹83/month" />
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-4xl">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Free</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">₹0</span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {["Browse 2,500+ schemes", "Try 1 AI tool", "Basic search"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground/80">
                    <Check className="h-4 w-4 text-muted-foreground" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block mt-6">
                <Button variant="outline" className="w-full rounded-xl font-semibold">Get started free</Button>
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-secondary bg-card p-6 shadow-sm">
              <span className="absolute -top-3 left-6 text-[11px] font-bold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                Most popular
              </span>
              <div className="text-xs font-semibold text-secondary uppercase tracking-wide">Pro</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">₹999</span>
                <span className="text-sm text-muted-foreground">/ year</span>
              </div>
              <div className="text-xs text-secondary font-semibold mt-1">Just ₹83/month</div>
              <ul className="mt-5 space-y-2.5 text-sm">
                {["All 20+ AI tools", "Direct apply links", "3 free AI generations", "Download DOCX reports", "Priority support"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-foreground">
                    <Check className="h-4 w-4 text-secondary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/subscription" className="block mt-6">
                <Button className="w-full rounded-xl bg-foreground text-background hover:opacity-90 font-semibold">
                  Get Pro — ₹999/year
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <UserPreferences open={prefsOpen} onOpenChange={setPrefsOpen} />
      </div>
    </Layout>
  );
};

export default Index;
