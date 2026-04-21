import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Sparkles, FileText, Brain, ArrowRight } from "lucide-react";

const tools = [
  {
    to: "/create-report",
    title: "AI Internship Report Generator",
    desc: "Generate professional internship reports instantly with AI — Get Real Experience!",
    badge: "🔥 Get Real Experience",
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
    desc: "Practice with AI-powered HR interviews & get instant feedback to ace your next round.",
    badge: "🔥 Hot",
    icon: "🤖",
    gradient: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-400/30 hover:border-purple-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
    badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-500/20",
  },
  {
    to: "/mock-interview",
    title: "AI HR Interview Training",
    desc: "Simulate real HR interview rounds & prepare like a pro with AI coaching.",
    badge: "🔥 New",
    icon: "🎯",
    gradient: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-400/30 hover:border-emerald-400/60",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/20",
  },
];

const AITools = () => {
  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 pb-24">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> AI Powered
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
            AI Tools
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Boost your career with our AI-powered tools — generate professional reports, practice interviews, and get hired faster.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {tools.map((t, i) => (
            <Link key={i} to={t.to} className="group">
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${t.gradient} border ${t.border} p-4 md:p-6 transition-all duration-300 ${t.glow} h-full`}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={`h-11 w-11 md:h-14 md:w-14 rounded-2xl ${t.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform animate-pulse`} style={{ animationDuration: '3s' }}>
                    <span className="text-xl md:text-3xl">{t.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-[15px] md:text-lg text-foreground leading-tight flex-1 min-w-0">{t.title}</h3>
                      <span className={`inline-flex items-center gap-1 ${t.badgeBg} rounded-full px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0`}>
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-3">{t.desc}</p>
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
          Note: All AI-generated content is for guidance. Please verify details from official sources before submission.
        </p>
      </div>
    </Layout>
  );
};

export default AITools;
