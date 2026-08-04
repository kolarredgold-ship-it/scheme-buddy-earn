import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Sparkles, Search, Loader2, X, Check, ChevronLeft, ChevronRight, MapPin, Filter, GraduationCap, School, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import UserPreferences from "@/components/UserPreferences";
import { tools as aiStudentTools } from "@/pages/AITools";
import { trackToolClick } from "@/lib/analytics";
import heroStudents from "@/assets/hero-students.png";
import heroReport from "@/assets/hero-report.jpg";
import heroAiInterview from "@/assets/hero-ai-interview.jpg";
import toolResume from "@/assets/tool-resume.jpg";
import toolNotes from "@/assets/tool-notes.jpg";
import toolRoadmap from "@/assets/tool-roadmap.jpg";
import toolEmail from "@/assets/tool-email.jpg";

// Mobile hero slides — AI tools with related background imagery
const STATE_PREF_KEY = "techrola_preferred_state";
const MOBILE_HERO_SLIDES = [
  { img: heroReport, tag: "Most used", title: "AI Internship Report Generator", desc: "Complete internship report in minutes — download as DOCX.", to: "/create-report" },
  { img: heroAiInterview, tag: "Practice", title: "AI Mock Interview", desc: "Real interview questions with instant AI feedback.", to: "/mock-interview" },
  { img: toolResume, tag: "Get hired", title: "AI Resume Builder", desc: "A clean one-page resume recruiters actually read.", to: "/student-tool/resume" },
  { img: toolNotes, tag: "Exam ready", title: "AI Study Notes Maker", desc: "Turn any topic into crisp revision notes and questions.", to: "/student-tool/study-notes" },
  { img: toolRoadmap, tag: "Plan", title: "AI 6-Month Career Roadmap", desc: "Month-by-month plan to become job-ready.", to: "/student-tool/roadmap" },
  { img: toolEmail, tag: "Quick", title: "AI Email & Cover Letter", desc: "Professional emails and cover letters in one tap.", to: "/student-tool/email-writer" },
];
import { Landmark, IdCard, BookOpen, Briefcase } from "lucide-react";
import HomeBlogSection from "@/components/HomeBlogSection";

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

const INTRO_SLIDES = [
  {
    accent: "Empowering",
    title: "All Learners:",
    line2: "Academic and Beyond",
    desc: "Techrola brings together AI tools, college discovery, internships, interview prep, and jobs — so every student can build a future they're proud of.",
    cta: "Get Started",
    to: "/signup",
  },
  {
    accent: "Discover",
    title: "2,500+ Schemes",
    line2: "Built for Bharat",
    desc: "Find central & state government scholarships, jobs and welfare programs — with direct apply links and AI-powered search.",
    cta: "Explore Schemes",
    to: "#schemes",
  },
  {
    accent: "Get Hired",
    title: "with AI Mock",
    line2: "Interviews & Reports",
    desc: "Practice with live HR mock interviews, generate professional internship reports in minutes and stand out to recruiters.",
    cta: "Try AI Tools",
    to: "/ai-tools",
  },
];


const TECHROLA_TABS = [
  {
    key: "job",
    label: "Job Seekers",
    title: "Land your first job, faster",
    desc: "AI resume builder, mock HR interviews, verified internships and direct apply links to top employers.",
    bullets: ["AI Resume & Cover Letter", "Live HR Mock Interviews", "Verified internship board"],
  },
  {
    key: "higher",
    label: "Higher / Skill Education Learners",
    title: "Plan your higher education",
    desc: "Compare 10,000+ colleges, discover scholarships and build a skill roadmap that fits your goal.",
    bullets: ["College & course finder", "Scholarship matcher", "AI study planner"],
  },
  {
    key: "other",
    label: "Other Learners",
    title: "Learn at your own pace",
    desc: "Free government scheme discovery, career guidance and AI tools open to every learner across India.",
    bullets: ["2,500+ govt schemes", "AI career counsellor", "Skill-based content library"],
  },
];

const Index = () => {
  const { user } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const catRailRef = useRef<HTMLDivElement>(null);
  const scrollCatRail = (dir: -1 | 1) =>
    catRailRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState(() => {
    try {
      return localStorage.getItem(STATE_PREF_KEY) || "all";
    } catch {
      return "all";
    }
  });
  const [aiResults, setAiResults] = useState<Scheme[] | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [searching, setSearching] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [heroSlide, setHeroSlide] = useState(3);
  const [techTab, setTechTab] = useState(0);
  const [showAllTools, setShowAllTools] = useState(false);
  const [showAllSchemes, setShowAllSchemes] = useState(false);
  const [mSlide, setMSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);

  const buzz = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
  };
  const goSlide = useCallback((next: number, haptic = false) => {
    const len = MOBILE_HERO_SLIDES.length;
    setMSlide(((next % len) + len) % len);
    if (haptic) buzz();
  }, []);

  // Mobile hero auto-advance (respects reduced motion)
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setMSlide((s) => (s + 1) % MOBILE_HERO_SLIDES.length), 4500);
    return () => clearInterval(id);
  }, [paused]);

  // Prefetch neighbouring slide images so navigation stays instant on slow networks
  useEffect(() => {
    const len = MOBILE_HERO_SLIDES.length;
    [(mSlide + 1) % len, (mSlide - 1 + len) % len].forEach((i) => {
      const img = new Image();
      img.src = MOBILE_HERO_SLIDES[i].img;
    });
  }, [mSlide]);

  // AI tools image slider — shared by mobile and desktop hero
  const renderToolSlider = (variant: "mobile" | "desktop") => {
    const desktop = variant === "desktop";
    return (
      <div className={desktop ? "flex h-full flex-col" : ""}>
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured AI tools"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); goSlide(mSlide + 1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); goSlide(mSlide - 1); }
            if (e.key === "Home") { e.preventDefault(); goSlide(0); }
            if (e.key === "End") { e.preventDefault(); goSlide(MOBILE_HERO_SLIDES.length - 1); }
          }}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
            touchY.current = e.touches[0].clientY;
            setPaused(true);
          }}
          onTouchEnd={(e) => {
            const sx = touchX.current, sy = touchY.current;
            touchX.current = null; touchY.current = null;
            setPaused(false);
            if (sx === null || sy === null) return;
            const dx = e.changedTouches[0].clientX - sx;
            const dy = e.changedTouches[0].clientY - sy;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goSlide(mSlide + (dx < 0 ? 1 : -1), true);
          }}
          className={`relative overflow-hidden rounded-xl border border-border shadow-sm touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            desktop ? "flex-1 min-h-[340px] lg:min-h-[380px]" : "h-[210px]"
          }`}
        >
          <span className="sr-only" aria-live="polite">
            Slide {mSlide + 1} of {MOBILE_HERO_SLIDES.length}: {MOBILE_HERO_SLIDES[mSlide].title}
          </span>
          {MOBILE_HERO_SLIDES.map((s, i) => (
            <Link
              key={s.to}
              to={s.to}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${MOBILE_HERO_SLIDES.length}: ${s.title}`}
              aria-hidden={mSlide !== i}
              tabIndex={mSlide === i ? 0 : -1}
              className={`absolute inset-0 block transition-opacity duration-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
                mSlide === i ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={s.img}
                alt=""
                aria-hidden="true"
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i === 0 ? "high" : "low"}
                width={960}
                height={640}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-slate-950/10" />
              <div className={`absolute inset-0 flex flex-col items-start justify-end ${desktop ? "p-6 lg:p-8" : "p-4"}`}>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> {s.tag}
                </span>
                <h2
                  className={`mt-2 font-extrabold leading-tight text-white ${desktop ? "text-2xl lg:text-3xl" : "text-[17px]"}`}
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  {s.title}
                </h2>
                <p className={`mt-1 leading-snug text-white/80 line-clamp-2 ${desktop ? "text-sm lg:text-base max-w-md" : "text-[12px]"}`}>
                  {s.desc}
                </p>
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-white font-bold text-slate-900 ${
                    desktop ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-[12px]"
                  }`}
                >
                  Try free <ArrowRight className={desktop ? "h-4 w-4" : "h-3.5 w-3.5"} />
                </span>
              </div>
            </Link>
          ))}

          {desktop && (
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                onClick={() => goSlide(mSlide - 1, true)}
                aria-label="Previous AI tool slide"                className="h-8 w-8 rounded-full bg-white/85 flex items-center justify-center hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <ChevronLeft className="h-4 w-4 text-slate-900" />
              </button>
              <button
                type="button"
                onClick={() => goSlide(mSlide + 1, true)}
                aria-label="Next AI tool slide"                className="h-8 w-8 rounded-full bg-white/85 flex items-center justify-center hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <ChevronRight className="h-4 w-4 text-slate-900" />
              </button>
            </div>
          )}
        </div>
        <div
          role="tablist"
          aria-label="AI tool slides"
          className={`mt-2 flex items-center justify-center gap-1.5 ${desktop ? "md:mt-3" : ""}`}
        >
          {MOBILE_HERO_SLIDES.map((s, i) => (
            <button
              key={s.to}
              type="button"
              role="tab"
              aria-selected={mSlide === i}
              onClick={() => goSlide(i, true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); goSlide(mSlide + 1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); goSlide(mSlide - 1); }
              }}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              className="group grid h-6 w-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${mSlide === i ? "w-5 bg-primary" : "w-1.5 bg-primary/25 group-hover:bg-primary/50"}`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };




  // Build hero slides: brand intros + one slide per AI tool
  const HERO_SLIDES = [
    ...INTRO_SLIDES,
    ...aiStudentTools.map((t) => ({
      accent: "AI Tool",
      title: t.title.replace(/^AI\s+/, ""),
      line2: t.badge,
      desc: t.desc,
      cta: "Open Tool",
      to: t.to,
    })),
  ];

  // Auto-advance hero AI tools slider (indices 3..N match HERO_SLIDES after intro slides)
  // Disabled when user prefers reduced motion.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const first = 3;
    const last = HERO_SLIDES.length - 1;
    const id = setInterval(() => {
      setHeroSlide((s) => {
        const current = s < first ? first : s;
        return current >= last ? first : current + 1;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [HERO_SLIDES.length]);

  const prevSlide = () => setHeroSlide((s) => {
    const first = 3;
    const last = HERO_SLIDES.length - 1;
    const current = s < first ? first : s;
    return current <= first ? last : current - 1;
  });
  const nextSlide = () => setHeroSlide((s) => {
    const first = 3;
    const last = HERO_SLIDES.length - 1;
    const current = s < first ? first : s;
    return current >= last ? first : current + 1;
  });


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

  // Persist the chosen state locally + to the user's account (when signed in)
  const persistState = useCallback(
    (value: string) => {
      setSelectedState(value);
      try {
        localStorage.setItem(STATE_PREF_KEY, value);
      } catch {
        /* storage unavailable */
      }
      if (user) {
        supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, preferred_state: value }, { onConflict: "user_id" })
          .then(() => {});
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_preferences")
      .select("preferred_state")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.preferred_state) {
          // Saved account preference always wins on login
          setSelectedState(data.preferred_state);
          try {
            localStorage.setItem(STATE_PREF_KEY, data.preferred_state);
          } catch {
            /* storage unavailable */
          }
        } else {
          // First login: carry over whatever the guest picked before signing in
          const local = (() => {
            try {
              return localStorage.getItem(STATE_PREF_KEY);
            } catch {
              return null;
            }
          })();
          if (local && local !== "all") {
            supabase
              .from("user_preferences")
              .upsert({ user_id: user.id, preferred_state: local }, { onConflict: "user_id" })
              .then(() => {});
            setSelectedState(local);
          } else if (!data) {
            setPrefsOpen(true);
          }
        }
      });
  }, [user]);


  // Server-side filtered + capped fetch — the table has thousands of rows and
  // the homepage only ever renders the first 15, so never pull the whole table.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    let q = supabase
      .from("schemes")
      .select("id, title, category, description, image_url, created_at, state, slug")
      .order("created_at", { ascending: false })
      .limit(60);

    if (selectedState !== "all") q = q.in("state", [selectedState, "central"]);
    if (activeCategory === "employment") q = q.in("category", ["govt_jobs", "private_jobs"]);
    else if (activeCategory !== "all") q = q.eq("category", activeCategory);

    q.then(({ data }) => {
      if (cancelled) return;
      setSchemes((data as unknown as Scheme[]) ?? []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activeCategory, selectedState]);


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

  // Filtering now happens server-side in the fetch above.
  const visible = aiResults ?? schemes;


  return (
    <Layout>
      <div className="pb-24 md:pb-12 bg-background">
        {/* HERO — Coursera inspired: search bar + dual promo cards */}
        <section className="bg-background border-b border-border/50">
          <div className="container mx-auto px-5 md:px-8 lg:px-12 pt-6 md:pt-10 pb-8 md:pb-14">
            {/* Top search bar (Coursera-style) */}
            <div className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                <a href="#tools" className="font-semibold text-foreground hover:text-primary transition-colors">Explore</a>
                <a href="#schemes" className="hover:text-foreground transition-colors">Schemes</a>
                <Link to="/career-program" className="hover:text-foreground transition-colors">Career</Link>
              </div>
              <div className="relative flex-1 max-w-2xl md:mx-auto w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search schemes, jobs, AI tools..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim().length < 3) {
                      setAiResults(null);
                      setAiSummary("");
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full h-12 pl-11 pr-28 rounded-full bg-background border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || searchQuery.trim().length < 3}
                  aria-label="Search"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-3 sm:px-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-40 hover:opacity-90 transition-opacity text-sm font-semibold"
                >
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /><span className="hidden sm:inline">Search</span></>}
                </button>
              </div>
            </div>

            {/* Dual promo cards */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Left card — For students / individuals */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[hsl(210_95%_48%)] via-[hsl(215_90%_42%)] to-[hsl(220_85%_36%)] p-5 sm:p-7 md:p-10 min-h-[260px] sm:min-h-[300px] md:min-h-[380px] shadow-lg">
                <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-pink-400/40 blur-2xl" />
                <div className="absolute bottom-0 right-8 h-44 w-44 rounded-full bg-white/15" />
                <div className="relative z-10 max-w-sm text-white">
                  <h1 className="text-[1.6rem] sm:text-3xl md:text-5xl font-extrabold leading-[1.05] tracking-tight" style={{ fontFamily: "Plus Jakarta Sans" }}>
                    Start, switch, or advance your career
                  </h1>
                  <p className="mt-3 sm:mt-4 text-sm md:text-base text-white/85">
                    Grow with 2,500+ government schemes, AI tools and career programs — built for Bharat.
                  </p>
                  <Link to={user ? "/dashboard" : "/signup"}>
                    <Button size="lg" className="mt-5 sm:mt-6 rounded-full bg-white text-[hsl(215_90%_42%)] hover:bg-white/95 font-bold px-5 sm:px-6 shadow-md gap-2">
                      {user ? "Go to dashboard" : "Join for Free"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <img
                  src={heroStudents}
                  alt="Techrola student"
                  className="hidden sm:block absolute right-0 bottom-0 h-[85%] w-auto object-contain object-bottom drop-shadow-2xl pointer-events-none"
                />
              </div>

              {/* Right card — AI tools image slider (desktop) */}
              <div className="hidden md:block">{renderToolSlider("desktop")}</div>
            </div>

            {/* Mobile AI tools hero slider with background images */}
            <div className="md:hidden mt-3">{renderToolSlider("mobile")}</div>

            {/* Mobile-only compact stats strip */}
            <div className="md:hidden mt-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-card px-3 py-3">
              {[
                { v: "2,500+", l: "Schemes" },
                { v: "20+", l: "AI Tools" },
                { v: "₹999", l: "Pro / year" },
              ].map((s) => (
                <div key={s.l} className="text-center">
                  <div className="text-base font-extrabold text-foreground leading-none">{s.v}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Quick action pills */}
            <div className="mt-4 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
              {[
                { icon: "📝", title: "Student Registration", to: "/signup", tint: "bg-orange-50 border-orange-200" },
                { icon: "🏫", title: "Search Colleges", to: "#colleges", tint: "bg-blue-50 border-blue-200" },
                { icon: "💼", title: "Find Internships", to: "/ai-tools", tint: "bg-emerald-50 border-emerald-200" },
                { icon: "🤖", title: "AI Career Tools", to: "/ai-tools", tint: "bg-violet-50 border-violet-200" },
              ].map((f) => (
                <a key={f.title} href={f.to} className={`flex items-center gap-2.5 md:gap-3 rounded-xl border ${f.tint} px-2.5 md:px-3 py-2.5 min-h-[56px] active:scale-[0.98] hover:shadow-sm transition-all`}>
                  <div className="h-9 w-9 md:h-10 md:w-10 rounded-lg bg-white flex items-center justify-center text-base md:text-lg shadow-sm shrink-0">{f.icon}</div>
                  <div className="text-[11.5px] md:text-sm font-bold text-foreground leading-tight">{f.title}</div>
                </a>
              ))}
            </div>

          </div>
        </section>

        {/* Sliding tools strip — auto-marquee banner */}
        <div className="relative mt-0 md:mt-20 overflow-hidden border-y border-emerald-100/80 bg-emerald-50/50 backdrop-blur-sm">
          <div
            className="flex gap-3 py-3 w-max"
            style={{ animation: "ticker 40s linear infinite" }}
          >
            {[...aiStudentTools, ...aiStudentTools].map((t, i) => (
              <Link
                key={`${t.to}-${i}`}
                to={t.to}
                className="flex items-center gap-2 shrink-0 rounded-full bg-white border border-emerald-200/70 px-3.5 py-1.5 hover:border-emerald-400 hover:shadow-sm transition-all"
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                  {t.title.replace(/^AI\s+/, "")}
                </span>
              </Link>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-emerald-50 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-50 to-transparent" />
        </div>


        {/* AI TOOLS */}
        <section className="container mx-auto px-5 md:px-8 lg:px-12 py-10 md:py-14">
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
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-5 md:p-8 shadow-lg hover:shadow-xl transition-all">
                <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-12 h-52 w-52 rounded-full bg-cyan-400/15 blur-3xl" />
                <div className="relative flex items-start md:items-center gap-4 md:gap-6">
                  <div className="h-14 w-14 md:h-20 md:w-20 rounded-xl bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center shrink-0 text-3xl md:text-4xl">
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

          {/* Tool cards grid — compact on mobile, expandable */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
            {aiStudentTools.slice(1).map((t, i) => (
              <Link
                key={t.to}
                to={t.to}
                onClick={() => trackToolClick(t.to, "home-grid")}
                className={`group relative ${i >= 6 && !showAllTools ? "hidden md:flex" : "flex"} flex-col items-start gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl border border-border/70 bg-card hover:border-emerald-300 hover:shadow-[0_10px_28px_-14px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200`}
              >
                <div className={`h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-lg md:text-2xl ${TOOL_TINTS[i % TOOL_TINTS.length]} group-hover:scale-105 transition-transform`}>
                  {t.icon}
                </div>
                <h3 className="text-[12.5px] md:text-sm font-bold text-foreground leading-tight line-clamp-2">
                  {t.title.replace(/^AI\s+/, "")}
                </h3>
                <p className="hidden md:block text-[11px] md:text-xs text-muted-foreground leading-snug line-clamp-2">
                  {t.desc}
                </p>
                <span className="mt-auto pt-1 inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-emerald-700">
                  Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>

          {aiStudentTools.length > 7 && (
            <div className="md:hidden mt-4">
              <Button
                variant="outline"
                onClick={() => setShowAllTools((v) => !v)}
                className="w-full h-11 rounded-xl border-foreground/15 font-semibold gap-2"
              >
                {showAllTools ? "Show less" : `Show all ${aiStudentTools.length - 1} tools`}
                <ChevronRight className={`h-4 w-4 transition-transform ${showAllTools ? "-rotate-90" : "rotate-90"}`} />
              </Button>
            </div>
          )}

          <div className="hidden md:flex justify-center mt-8">
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
          <div className="container mx-auto px-5 md:px-8 lg:px-12 py-10 md:py-14">
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
                      className="shrink-0 w-[260px] rounded-xl border border-emerald-200/70 bg-white p-4 hover:shadow-md hover:border-emerald-400 transition-all flex flex-col gap-2"
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
              <Select value={selectedState} onValueChange={persistState}>
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

            {/* Category cards — horizontal slider */}
            <div className="relative mb-6 group/rail">
              <div
                ref={catRailRef}
                className="flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {CATEGORY_CHIPS.map((c) => {
                  const active = activeCategory === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setActiveCategory(c.key)}
                      aria-pressed={active}
                      className={`group snap-start shrink-0 w-[104px] sm:w-[124px] relative flex flex-col items-center justify-start gap-2 px-1.5 py-3 sm:py-4 rounded-xl border bg-card transition-all duration-200 active:scale-[0.97] ${
                        active
                          ? "border-emerald-500 ring-2 ring-emerald-500/25 shadow-md"
                          : "border-border/70 hover:border-emerald-300 hover:shadow-sm hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-colors ${
                          active ? "bg-emerald-500 text-white shadow-sm" : `${c.bg} group-hover:brightness-95`
                        }`}
                      >
                        {c.icon}
                      </span>
                      <span
                        className={`text-[10.5px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 ${
                          active ? "text-emerald-700" : "text-foreground/75"
                        }`}
                      >
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => scrollCatRail(-1)}
                aria-label="Scroll categories left"
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 h-8 w-8 items-center justify-center rounded-full border border-border bg-white shadow-md opacity-0 group-hover/rail:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollCatRail(1)}
                aria-label="Scroll categories right"
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 h-8 w-8 items-center justify-center rounded-full border border-border bg-white shadow-md opacity-0 group-hover/rail:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
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
                {/* Desktop: clean scheme cards */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {visible.slice(0, 12).map((s) => (
                    <Link
                      key={s.id}
                      to={`/scheme/${s.slug}`}
                      className="group relative rounded-xl border border-border/70 bg-card p-5 pl-6 transition-all hover:shadow-[0_10px_30px_-12px_rgba(16,185,129,0.35)] hover:border-emerald-400 hover:-translate-y-0.5 flex flex-col gap-3 min-h-[150px] overflow-hidden"
                    >
                      <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500/70 group-hover:bg-emerald-600 transition-colors" />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${TAG_COLORS[s.category] || "bg-slate-100 text-slate-700"}`}>
                          {prettyCategory(s.category)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${s.state === "central" ? CENTRAL_TAG : STATE_TAG}`}>
                          {prettyState(s.state) || "Central"}
                        </span>
                      </div>
                      <h3 className="font-bold text-[15px] text-foreground line-clamp-3 leading-snug group-hover:text-emerald-700 transition-colors">
                        {s.title}
                      </h3>
                      <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        View details
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                  {visible.length === 0 && (
                    <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                      No schemes match your filters.
                    </div>
                  )}
                </div>

                {/* Mobile: card list */}
                <div className="md:hidden space-y-2.5">
                  {visible.slice(0, showAllSchemes ? 20 : 8).map((s) => (
                    <Link
                      key={s.id}
                      to={`/scheme/${s.slug}`}
                      className="relative flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 pl-4 overflow-hidden active:scale-[0.99] transition-transform"
                    >
                      <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500/70" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[13.5px] text-foreground leading-snug line-clamp-2">
                          {s.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${TAG_COLORS[s.category] || "bg-slate-100 text-slate-700"}`}>
                            {prettyCategory(s.category)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${s.state === "central" ? CENTRAL_TAG : STATE_TAG}`}>
                            {prettyState(s.state) || "Central"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </Link>
                  ))}
                  {visible.length === 0 && (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      No schemes match your filters.
                    </div>
                  )}
                  {visible.length > 8 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAllSchemes((v) => !v)}
                      className="w-full h-11 rounded-xl border-foreground/15 font-semibold gap-2 mt-1"
                    >
                      {showAllSchemes ? "Show less" : "Show more schemes"}
                      <ChevronRight className={`h-4 w-4 transition-transform ${showAllSchemes ? "-rotate-90" : "rotate-90"}`} />
                    </Button>
                  )}
                </div>


              </>
            )}
          </div>
        </section>

        {/* STATS BAR — dark blue band */}
        <section className="bg-gradient-to-r from-[#0c1a4d] via-[#142166] to-[#1a2a7a] text-white">
          <div className="container mx-auto px-5 md:px-8 lg:px-12 py-10 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { v: "50,000+", l: "STUDENTS REGISTERED" },
                { v: "10,000+", l: "COLLEGES LISTED" },
                { v: "1,200+", l: "HIRING PARTNERS" },
                { v: "20+", l: "AI TOOLS AVAILABLE" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl md:text-4xl font-extrabold text-amber-400" style={{ fontFamily: "Plus Jakarta Sans" }}>
                    {s.v}
                  </div>
                  <div className="text-[10px] md:text-xs font-bold tracking-wider text-white/80 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTRODUCING TECHROLA — One Nation, One APP */}
        <section className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-background">
          <div className="container mx-auto px-5 md:px-8 lg:px-12 py-12 md:py-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2
                  className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Introducing <span className="text-violet-700">TECHROLA</span> —<br />
                  One Nation, One APP
                </h2>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
                  The TECHROLA app is a one-of-a-kind identifier that simplifies the way you
                  track and manage your academic and skill-based achievements. It consolidates
                  all your educational records in one place, making it easy to accumulate,
                  transfer, and access your job profile across different learning pathways.
                </p>
                <Link to="/about-us" className="inline-block mt-6">
                  <Button className="rounded-md bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-6 border border-amber-400 shadow-md">
                    Know More
                  </Button>
                </Link>
              </div>

              <div className="relative">
                <div className="rounded-xl bg-gradient-to-br from-violet-100 to-amber-100 p-6 md:p-8 shadow-xl border border-white">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl">
                      👩‍🎓
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-extrabold text-foreground">
                        Tanvi Sharma
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        I am a registered TECHROLA ID holder.
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    {["📚", "🏆", "💼"].map((e, i) => (
                      <div key={i} className="rounded-xl bg-white/70 py-3 text-2xl">
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 md:mt-16 text-center">
              <h3
                className="text-xl md:text-3xl font-extrabold text-foreground"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                Get Started with <span className="text-violet-700">TECHROLA</span> — Create Yours Today!
              </h3>
              <div className="mt-5 inline-flex flex-wrap justify-center gap-1.5 p-1.5 rounded-full bg-white border border-border shadow-sm max-w-full overflow-x-auto">
                {TECHROLA_TABS.map((t, i) => (
                  <button
                    key={t.key}
                    onClick={() => setTechTab(i)}
                    className={`px-3 sm:px-4 py-2 rounded-full text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                      techTab === i
                        ? "bg-amber-500 text-amber-950 shadow"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="mt-6 max-w-2xl mx-auto">
                <div
                  key={techTab}
                  className="rounded-xl border border-border bg-white/80 backdrop-blur p-5 md:p-7 shadow-sm text-left animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <h4 className="text-lg md:text-2xl font-extrabold text-foreground" style={{ fontFamily: "Plus Jakarta Sans" }}>
                    {TECHROLA_TABS[techTab].title}
                  </h4>
                  <p className="mt-2 text-sm md:text-base text-muted-foreground">
                    {TECHROLA_TABS[techTab].desc}
                  </p>
                  <ul className="mt-4 grid sm:grid-cols-3 gap-2">
                    {TECHROLA_TABS[techTab].bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs md:text-sm font-medium text-foreground/80 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                        <Check className="h-4 w-4 text-violet-600 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 6 EASY STEPS TO A BETTER CAREER — redesigned */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0a3d] via-[#2a1670] to-[#5b21b6]">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(251,191,36,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(99,102,241,0.4) 0%, transparent 40%)" }} />

          <div className="container mx-auto px-5 md:px-8 lg:px-12 py-14 md:py-20 relative">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
              <span className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/40 text-amber-300 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Your Career Roadmap
              </span>
              <h2
                className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                6 Easy Steps to a <span className="text-amber-400">Better Career</span>
              </h2>
              <p className="mt-3 text-sm md:text-base text-white/70">
                A simple, proven path from signup to your first job offer.
              </p>
            </div>

            {/* Desktop: horizontal timeline; Mobile: vertical timeline */}
            <div className="relative">
              {/* Desktop connecting line */}
              <div className="hidden lg:block absolute top-12 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-amber-400/0 via-amber-400/60 to-amber-400/0" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5 lg:gap-3 relative">
                {[
                  { n: 1, t: "Register", d: "Create your free account in seconds", color: "from-rose-400 to-pink-500" },
                  { n: 2, t: "Subscribe", d: "Unlock all premium features instantly", color: "from-amber-400 to-orange-500" },
                  { n: 3, t: "Get EMP Code", d: "Receive your unique referral code", color: "from-yellow-400 to-amber-500" },
                  { n: 4, t: "Promote", d: "Share Techrola with your network", color: "from-emerald-400 to-teal-500" },
                  { n: 5, t: "Build Streak", d: "Stay active and grow your activity", color: "from-sky-400 to-indigo-500" },
                  { n: 6, t: "Get Hired", d: "Unlock internships & top job offers", color: "from-violet-400 to-purple-600" },
                ].map((s) => (
                  <div key={s.n} className="group relative">
                    <div className="relative bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-amber-400/40 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/10 h-full flex flex-col items-center text-center">
                      {/* Step number badge */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 px-3 rounded-full bg-amber-400 text-amber-950 text-[11px] font-extrabold flex items-center justify-center shadow-lg ring-4 ring-[#1a1450]">
                        STEP {s.n}
                      </div>

                      <h3 className="mt-3 text-sm md:text-base font-extrabold text-white tracking-tight">
                        {s.t}
                      </h3>
                      <p className="mt-1.5 text-[11px] md:text-xs text-white/65 leading-snug">
                        {s.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 md:mt-12 flex justify-center">
              <Link to={user ? "/career-program" : "/signup"}>
                <Button
                  size="lg"
                  className="rounded-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-8 shadow-lg shadow-amber-900/40"
                >
                  Start your journey <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>



        {/* ABOUT TECHROLA */}
        <section className="bg-background">
          <div className="container mx-auto px-5 md:px-8 lg:px-12 py-12 md:py-16">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <div>
                <div className="text-xs md:text-sm font-bold text-violet-700 tracking-widest uppercase mb-3">
                  About Techrola
                </div>
                <h2
                  className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  A trusted career companion for every student
                </h2>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
                  Techrola AI is a student-first platform that brings opportunities, guidance and
                  AI-powered tools under one trusted portal — helping learners across India go
                  from classroom to career with confidence.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Verified colleges, internships and jobs",
                    "AI tools trained for Indian education context",
                    "Free for every registered student",
                    "Trusted by 50,000+ students nationwide",
                    "Government Schemes direct apply link",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm md:text-base text-foreground">
                      <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[
                  { icon: "👥", k: "ACTIVE COMMUNITY", v: "50K+ students", color: "from-emerald-50 to-emerald-100 border-emerald-200" },
                  { icon: "🏆", k: "RECOGNITION", v: "Top Ed-Tech 2025", color: "from-amber-50 to-amber-100 border-amber-200" },
                  { icon: "🤝", k: "HIRING PARTNERS", v: "1,200+ companies", color: "from-violet-50 to-violet-100 border-violet-200" },
                  { icon: "🎓", k: "COLLEGES LISTED", v: "10,000+ institutes", color: "from-sky-50 to-sky-100 border-sky-200" },
                ].map((c) => (
                  <div
                    key={c.k}
                    className={`rounded-xl border bg-gradient-to-br ${c.color} p-4 md:p-5 shadow-sm`}
                  >
                    <div className="h-10 w-10 rounded-full bg-white shadow flex items-center justify-center text-xl mb-3">
                      {c.icon}
                    </div>
                    <div className="text-[10px] md:text-xs font-bold tracking-wider text-muted-foreground">
                      {c.k}
                    </div>
                    <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5">
                      {c.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="container mx-auto px-5 md:px-8 lg:px-12 py-10 md:py-14">

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
            <div className="rounded-xl border border-border bg-card p-6">
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
            <div className="relative rounded-xl border-2 border-emerald-500 bg-card p-6 shadow-lg shadow-emerald-500/10">
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
              <p className="mt-3 text-[11px] text-muted-foreground text-center inline-flex items-center justify-center gap-1.5 w-full">
                🔒 Secured payments by
                <span className="font-bold text-[#072654] bg-white border border-border/60 px-1.5 py-0.5 rounded">Razorpay</span>
              </p>
            </div>
          </div>
        </section>


        {/* COLLEGE & SCHOOL FINDER */}
        <section className="container mx-auto px-5 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="rounded-xl border border-border/60 bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 p-5 md:p-8">
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

        <HomeBlogSection />

        {prefsOpen && (
          <UserPreferences open={prefsOpen} onOpenChange={setPrefsOpen} onPreferencesSaved={(st) => persistState(st)} />
        )}
      </div>
    </Layout>
  );
};

export default Index;
