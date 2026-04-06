import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, Mic, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  Star, Trophy, Target, Lightbulb, ArrowRight, RotateCcw, Sparkles,
  Clock, BarChart3, Award, MessageSquare
} from "lucide-react";

type InterviewQuestion = {
  id: number;
  question: string;
  category: string;
  tip: string;
};

type AnswerEval = {
  score: number;
  rating: string;
  strengths: string[];
  improvements: string[];
  sampleAnswer: string;
};

type OverallResult = {
  overallScore: number;
  overallRating: string;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  hireRecommendation: string;
  tips: string[];
};

const ROLES = [
  "Software Developer", "Data Analyst", "Marketing Manager", "HR Executive",
  "Business Analyst", "Product Manager", "UI/UX Designer", "Financial Analyst",
  "Operations Manager", "Sales Executive", "Content Writer", "Project Manager",
  "DevOps Engineer", "Full Stack Developer", "Machine Learning Engineer",
  "Graphic Designer", "Digital Marketing Specialist", "Accountant",
  "Civil Engineer", "Mechanical Engineer", "Teacher / Lecturer",
];

const TOPICS = [
  "General Interview", "Technical Skills", "Behavioral Questions", "Problem Solving",
  "Leadership", "Teamwork", "Communication", "Project Management",
  "Data Structures & Algorithms", "System Design", "Database Management",
  "Cloud Computing", "Agile Methodology", "Customer Service",
  "Sales & Negotiation", "Financial Analysis", "Digital Marketing",
];

const DIFFICULTIES = [
  { value: "beginner", label: "Fresher / Beginner", icon: "🌱" },
  { value: "intermediate", label: "Intermediate (1-3 yrs)", icon: "🚀" },
  { value: "advanced", label: "Advanced (3-7 yrs)", icon: "💎" },
  { value: "expert", label: "Expert (7+ yrs)", icon: "👑" },
];

type Phase = "setup" | "interview" | "reviewing" | "results";

const MockInterview = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isPro = profile?.subscription_status === "active";

  // Setup
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [questionCount, setQuestionCount] = useState("5");

  // Interview
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showTip, setShowTip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);

  // Per-question evaluation
  const [currentEval, setCurrentEval] = useState<AnswerEval | null>(null);

  // Results
  const [overallResult, setOverallResult] = useState<OverallResult | null>(null);

  const selectedRole = customRole || role;

  const startInterview = async () => {
    if (!selectedRole || !topic) {
      toast({ title: "Please select role and topic", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Please login to start", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "generate_questions",
          role: selectedRole,
          topic,
          difficulty,
          questionCount: parseInt(questionCount),
        },
      });
      if (error) throw error;

      const qs = Array.isArray(data.result) ? data.result : [];
      if (qs.length === 0) throw new Error("No questions generated");

      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(""));
      setCurrentQ(0);
      setCurrentEval(null);
      setPhase("interview");
    } catch (err: any) {
      toast({ title: "Error generating questions", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const evaluateCurrentAnswer = async () => {
    const ans = answers[currentQ];
    if (!ans?.trim()) {
      toast({ title: "Please write your answer first", variant: "destructive" });
      return;
    }

    setEvalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate_answer",
          question: questions[currentQ].question,
          answer: ans,
        },
      });
      if (error) throw error;
      setCurrentEval(data.result);
    } catch (err: any) {
      toast({ title: "Error evaluating", description: err.message, variant: "destructive" });
    } finally {
      setEvalLoading(false);
    }
  };

  const goNext = () => {
    setCurrentEval(null);
    setShowTip(false);
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    }
  };

  const goPrev = () => {
    setCurrentEval(null);
    setShowTip(false);
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    }
  };

  const finishInterview = async () => {
    setPhase("reviewing");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mock-interview", {
        body: {
          action: "evaluate_all",
          role: selectedRole,
          topic,
          questions: questions.map((q) => q.question),
          answers,
        },
      });
      if (error) throw error;
      setOverallResult(data.result);
      setPhase("results");
    } catch (err: any) {
      toast({ title: "Error evaluating interview", description: err.message, variant: "destructive" });
      setPhase("interview");
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setPhase("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrentQ(0);
    setCurrentEval(null);
    setOverallResult(null);
    setShowTip(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    if (score >= 4) return "bg-orange-500";
    return "bg-red-500";
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">AI Mock Interview Training</h1>
          <p className="text-muted-foreground mb-6">Login to start practicing interviews with AI</p>
          <Button asChild><a href="/login">Login to Continue</a></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">AI Mock Interview</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Practice with AI-powered interview simulation</p>
          </div>
          {phase !== "setup" && (
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={resetInterview}>
              <RotateCcw className="h-4 w-4" /> New
            </Button>
          )}
        </div>

        {/* PHASE: SETUP */}
        {phase === "setup" && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Configure Your Interview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Role */}
                <div className="space-y-2">
                  <Label className="font-semibold">Job Role / Position</Label>
                  <Select value={role} onValueChange={(v) => { setRole(v); setCustomRole(""); }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or type a custom role..."
                    value={customRole}
                    onChange={(e) => { setCustomRole(e.target.value); setRole(""); }}
                    className="rounded-xl"
                  />
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <Label className="font-semibold">Interview Focus Area</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select focus area" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label className="font-semibold">Experience Level</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDifficulty(d.value)}
                        className={`p-3 rounded-xl border text-left text-sm font-medium transition-all ${
                          difficulty === d.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <span className="mr-1.5">{d.icon}</span> {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count */}
                <div className="space-y-2">
                  <Label className="font-semibold">Number of Questions</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger className="rounded-xl w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Questions</SelectItem>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="8">8 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={startInterview}
                  disabled={loading || (!selectedRole || !topic)}
                  className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" /> Start Mock Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Brain, label: "AI-Powered", desc: "Smart questions" },
                { icon: BarChart3, label: "Detailed Scoring", desc: "Per-answer feedback" },
                { icon: MessageSquare, label: "Model Answers", desc: "Learn from best" },
                { icon: Award, label: "Final Report", desc: "Overall analysis" },
              ].map((f, i) => (
                <Card key={i} className="text-center p-3">
                  <f.icon className="h-6 w-6 text-primary mx-auto mb-1.5" />
                  <p className="text-xs font-semibold">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: INTERVIEW */}
        {phase === "interview" && questions.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">
                Question {currentQ + 1} / {questions.length}
              </span>
              <Progress value={((currentQ + 1) / questions.length) * 100} className="flex-1 h-2" />
              <Badge variant="outline" className="text-xs">{questions[currentQ].category}</Badge>
            </div>

            {/* Question Card */}
            <Card className="border-primary/20">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-base md:text-lg font-semibold leading-relaxed">
                      {questions[currentQ].question}
                    </p>
                  </div>
                </div>

                {/* Tip */}
                {!showTip ? (
                  <button
                    onClick={() => setShowTip(true)}
                    className="text-xs text-primary flex items-center gap-1 hover:underline mb-4"
                  >
                    <Lightbulb className="h-3.5 w-3.5" /> Show Hint
                  </button>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                    {questions[currentQ].tip}
                  </div>
                )}

                {/* Answer */}
                <Textarea
                  placeholder="Type your answer here... Be detailed and structured."
                  value={answers[currentQ] || ""}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[currentQ] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  className="min-h-[150px] rounded-xl resize-none"
                />

                {/* Evaluate Button */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    onClick={evaluateCurrentAnswer}
                    disabled={evalLoading || !answers[currentQ]?.trim()}
                    className="gap-1.5 rounded-xl"
                  >
                    {evalLoading ? (
                      <div className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                    Evaluate Answer
                  </Button>
                </div>

                {/* Per-question Evaluation */}
                {currentEval && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl font-bold ${currentEval.score >= 7 ? 'text-green-600' : currentEval.score >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {currentEval.score}/10
                      </div>
                      <Badge className={`${getScoreBg(currentEval.score)} text-white`}>{currentEval.rating}</Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Strengths
                        </p>
                        {currentEval.strengths?.map((s, i) => (
                          <p key={i} className="text-xs text-green-800 dark:text-green-300">• {s}</p>
                        ))}
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5" /> Improve
                        </p>
                        {currentEval.improvements?.map((s, i) => (
                          <p key={i} className="text-xs text-orange-800 dark:text-orange-300">• {s}</p>
                        ))}
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" /> Model Answer
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{currentEval.sampleAnswer}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={goPrev} disabled={currentQ === 0} className="gap-1.5 rounded-xl">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>

              {currentQ < questions.length - 1 ? (
                <Button onClick={goNext} className="gap-1.5 rounded-xl">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={finishInterview} className="gap-1.5 rounded-xl bg-green-600 hover:bg-green-700">
                  <Trophy className="h-4 w-4" /> Finish & Get Results
                </Button>
              )}
            </div>
          </div>
        )}

        {/* PHASE: REVIEWING */}
        {phase === "reviewing" && (
          <div className="text-center py-20 animate-fade-in">
            <div className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold">Evaluating your interview...</p>
            <p className="text-sm text-muted-foreground mt-1">AI is analyzing all your answers</p>
          </div>
        )}

        {/* PHASE: RESULTS */}
        {phase === "results" && overallResult && (
          <div className="space-y-4 animate-fade-in">
            {/* Score Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <Trophy className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className={`text-5xl font-bold mb-1 ${getScoreColor(overallResult.overallScore)}`}>
                  {overallResult.overallScore}%
                </div>
                <Badge className="mb-3 text-sm px-4 py-1">{overallResult.overallRating}</Badge>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{overallResult.summary}</p>
                <div className="mt-4">
                  <Badge variant="outline" className={`text-sm px-4 py-1 ${
                    overallResult.hireRecommendation === "Strong Hire" ? "border-green-500 text-green-600" :
                    overallResult.hireRecommendation === "Hire" ? "border-blue-500 text-blue-600" :
                    overallResult.hireRecommendation === "Maybe" ? "border-yellow-500 text-yellow-600" :
                    "border-red-500 text-red-600"
                  }`}>
                    Hire Recommendation: {overallResult.hireRecommendation}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" /> Top Strengths
                  </h3>
                  {overallResult.topStrengths?.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Star className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <Target className="h-5 w-5" /> Areas to Improve
                  </h3>
                  {overallResult.topImprovements?.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" /> Tips for Next Interview
                </h3>
                {overallResult.tips?.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className="shrink-0 text-[10px] mt-0.5">{i + 1}</Badge>
                    <span>{t}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Retry */}
            <div className="flex gap-3">
              <Button onClick={resetInterview} className="flex-1 h-12 rounded-xl gap-2">
                <RotateCcw className="h-4 w-4" /> Practice Again
              </Button>
              <Button variant="outline" onClick={() => setPhase("interview")} className="flex-1 h-12 rounded-xl gap-2">
                <MessageSquare className="h-4 w-4" /> Review Answers
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MockInterview;
