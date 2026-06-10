import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Sparkles, ArrowRight } from "lucide-react";

const tools = [
  {
    to: "/create-report",
    title: "AI Internship Report Generator",
    desc: "Generate professional internship reports instantly with AI — downloadable DOCX.",
    badge: "🔥 Top",
    icon: "📄",
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-400/30 hover:border-blue-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-500/20",
  },
  {
    to: "/mock-interview",
    title: "AI Mock Interview Training",
    desc: "Practice with AI-powered interviews & get instant feedback.",
    badge: "🔥 Hot",
    icon: "🤖",
    gradient: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-400/30 hover:border-purple-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-500/20",
  },
  {
    to: "/live-hr-interview",
    title: "AI Live HR Interview",
    desc: "Real-time HR interview simulation with verdict and feedback.",
    badge: "🎯 New",
    icon: "🎯",
    gradient: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-400/30 hover:border-emerald-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/20",
  },
  {
    to: "/student-tool/resume",
    title: "AI Resume Builder",
    desc: "Build a professional one-page resume — downloadable DOCX.",
    badge: "⬇ Download",
    icon: "📝",
    gradient: "from-orange-500/10 to-amber-500/10",
    border: "border-orange-400/30 hover:border-orange-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]",
    badgeBg: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    iconBg: "bg-orange-500/20",
  },
  {
    to: "/student-tool/cover-letter",
    title: "AI Cover Letter Generator",
    desc: "Job-winning cover letter tailored to the role & company.",
    badge: "⬇ Download",
    icon: "✉️",
    gradient: "from-rose-500/10 to-pink-500/10",
    border: "border-rose-400/30 hover:border-rose-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]",
    badgeBg: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    iconBg: "bg-rose-500/20",
  },
  {
    to: "/student-tool/sop",
    title: "AI Statement of Purpose (SOP)",
    desc: "700-900 word SOP for higher studies applications.",
    badge: "🎓 Study Abroad",
    icon: "🎓",
    gradient: "from-indigo-500/10 to-blue-500/10",
    border: "border-indigo-400/30 hover:border-indigo-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]",
    badgeBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    iconBg: "bg-indigo-500/20",
  },
  {
    to: "/student-tool/study-notes",
    title: "AI Study Notes Maker",
    desc: "Turn any topic into clean revision notes + likely exam questions.",
    badge: "📚 Exam",
    icon: "📚",
    gradient: "from-yellow-500/10 to-orange-500/10",
    border: "border-yellow-400/30 hover:border-yellow-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    badgeBg: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
    iconBg: "bg-yellow-500/20",
  },
  {
    to: "/student-tool/roadmap",
    title: "AI 6-Month Career Roadmap",
    desc: "Personalized month-by-month plan to become job-ready.",
    badge: "🗺 Plan",
    icon: "🗺️",
    gradient: "from-cyan-500/10 to-blue-500/10",
    border: "border-cyan-400/30 hover:border-cyan-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    badgeBg: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    iconBg: "bg-cyan-500/20",
  },
  {
    to: "/student-tool/leave-letter",
    title: "AI Leave Application Letter",
    desc: "Formal leave letter for college, school or office in seconds.",
    badge: "⚡ Quick",
    icon: "📨",
    gradient: "from-slate-500/10 to-gray-500/10",
    border: "border-slate-400/30 hover:border-slate-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(100,116,139,0.25)]",
    badgeBg: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    iconBg: "bg-slate-500/20",
  },
  {
    to: "/student-tool/lor",
    title: "AI Letter of Recommendation",
    desc: "Professor/manager-style LOR draft for higher studies or jobs.",
    badge: "🎓 Study Abroad",
    icon: "📜",
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-400/30 hover:border-violet-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]",
    badgeBg: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-500/20",
  },
  {
    to: "/student-tool/project-report",
    title: "AI Mini Project Report",
    desc: "Academic-format project report with abstract, modules & conclusion.",
    badge: "⬇ Download",
    icon: "📘",
    gradient: "from-blue-500/10 to-indigo-500/10",
    border: "border-blue-400/30 hover:border-blue-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-500/20",
  },
  {
    to: "/student-tool/email-writer",
    title: "AI Professional Email Writer",
    desc: "Write polished emails to professors, HRs and recruiters.",
    badge: "⚡ Quick",
    icon: "📧",
    gradient: "from-teal-500/10 to-cyan-500/10",
    border: "border-teal-400/30 hover:border-teal-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]",
    badgeBg: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
    iconBg: "bg-teal-500/20",
  },
  {
    to: "/student-tool/viva-questions",
    title: "AI Viva / Interview Questions",
    desc: "Predict 20+ viva questions with model answers for any topic.",
    badge: "📚 Exam",
    icon: "🎙️",
    gradient: "from-fuchsia-500/10 to-pink-500/10",
    border: "border-fuchsia-400/30 hover:border-fuchsia-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(217,70,239,0.3)]",
    badgeBg: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
    iconBg: "bg-fuchsia-500/20",
  },
  {
    to: "/student-tool/ppt-outline",
    title: "AI Presentation (PPT) Outline",
    desc: "Slide-by-slide outline with titles, points and speaker notes.",
    badge: "🗂 Slides",
    icon: "📊",
    gradient: "from-amber-500/10 to-yellow-500/10",
    border: "border-amber-400/30 hover:border-amber-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]",
    badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-500/20",
  },
  {
    to: "/student-tool/scholarship-essay",
    title: "AI Scholarship Essay",
    desc: "Compelling scholarship essay tailored to your story.",
    badge: "💰 Funding",
    icon: "🏆",
    gradient: "from-yellow-500/10 to-amber-500/10",
    border: "border-yellow-400/30 hover:border-yellow-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]",
    badgeBg: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
    iconBg: "bg-yellow-500/20",
  },
  {
    to: "/student-tool/linkedin-bio",
    title: "AI LinkedIn Bio & Headline",
    desc: "Magnetic LinkedIn About section + 3 headline options.",
    badge: "🔗 LinkedIn",
    icon: "💼",
    gradient: "from-sky-500/10 to-blue-500/10",
    border: "border-sky-400/30 hover:border-sky-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(14,165,233,0.3)]",
    badgeBg: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/20",
  },
  {
    to: "/student-tool/business-plan",
    title: "AI Startup / Business Plan",
    desc: "Lean business plan with problem, solution, market & revenue.",
    badge: "🚀 Startup",
    icon: "📈",
    gradient: "from-green-500/10 to-emerald-500/10",
    border: "border-green-400/30 hover:border-green-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]",
    badgeBg: "bg-green-500/15 text-green-700 dark:text-green-300",
    iconBg: "bg-green-500/20",
  },
  {
    to: "/student-tool/assignment",
    title: "AI Assignment Helper",
    desc: "Well-structured college assignment with citations placeholder.",
    badge: "📝 Homework",
    icon: "📑",
    gradient: "from-red-500/10 to-rose-500/10",
    border: "border-red-400/30 hover:border-red-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]",
    badgeBg: "bg-red-500/15 text-red-700 dark:text-red-300",
    iconBg: "bg-red-500/20",
  },
  {
    to: "/student-tool/essay",
    title: "AI Essay Writer",
    desc: "Structured essay on any topic with intro, body & conclusion.",
    badge: "✍️ Writing",
    icon: "✍️",
    gradient: "from-pink-500/10 to-rose-500/10",
    border: "border-pink-400/30 hover:border-pink-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]",
    badgeBg: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
    iconBg: "bg-pink-500/20",
  },
  {
    to: "/student-tool/speech",
    title: "AI Speech Writer",
    desc: "Powerful speech for events, debates and college functions.",
    badge: "🎤 Speak",
    icon: "🎤",
    gradient: "from-orange-500/10 to-red-500/10",
    border: "border-orange-400/30 hover:border-orange-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]",
    badgeBg: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    iconBg: "bg-orange-500/20",
  },
];

const AITools = () => {
  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 pb-24">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Powered by AI
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Students AI Tools
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            All-in-one AI toolkit for Indian students — resumes, cover letters, SOPs, study notes, career roadmaps, interview practice and more. Generate and download instantly.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {tools.map((t, i) => (
            <Link key={i} to={t.to} className="group">
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradient} border ${t.border} p-4 md:p-5 transition-all duration-300 ${t.glow} h-full`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-11 w-11 md:h-12 md:w-12 rounded-2xl ${t.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <span className="text-xl md:text-2xl">{t.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-[14px] md:text-base text-foreground leading-tight flex-1 min-w-0">
                        {t.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 ${t.badgeBg} rounded-full px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0`}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3">
                      {t.desc}
                    </p>
                    <div className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-muted-foreground/80 mt-6 text-center">
          Note: All AI-generated content is for guidance. Please review and personalize before submission.
        </p>
      </div>
    </Layout>
  );
};

export default AITools;
