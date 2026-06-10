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
    title: "Live HR Interview",
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
    title: "Statement of Purpose (SOP)",
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
    title: "6-Month Career Roadmap",
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
    title: "Leave Application Letter",
    desc: "Formal leave letter for college, school or office in seconds.",
    badge: "⚡ Quick",
    icon: "📨",
    gradient: "from-slate-500/10 to-gray-500/10",
    border: "border-slate-400/30 hover:border-slate-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(100,116,139,0.25)]",
    badgeBg: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    iconBg: "bg-slate-500/20",
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
