import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Mic, MicOff, Volume2, Loader2, Trophy, XCircle,
  CheckCircle2, Sparkles, RotateCcw, Briefcase
} from "lucide-react";
import hrAvatar from "@/assets/hr-avatar.jpg";

const ROLES = [
  "Software Developer", "Full Stack Developer", "Data Analyst",
  "AI Engineer", "HR Executive", "Digital Marketing", "Sales Executive",
  "Accountant", "Customer Support", "Business Analyst"
];

type Phase = "setup" | "intro" | "interviewing" | "evaluating" | "verdict";

interface Verdict {
  decision: "SELECTED" | "REJECTED";
  score: number;
  spokenVerdict: string;
  strengths: string[];
  improvements: string[];
  finalRemarks: string;
}

const TOTAL_QUESTIONS = 25;

import { useToolCredits } from "@/hooks/useToolCredits";
import TopupDialog from "@/components/TopupDialog";
import ToolGateDialog from "@/components/ToolGateDialog";
import { CreditCard } from "lucide-react";

const LiveHRInterview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const credits = useToolCredits("live-hr-interview");
  const [showTopup, setShowTopup] = useState(false);

  const [phase, setPhase] = useState<Phase>("setup");
  const [role, setRole] = useState("");
  const [greeting, setGreeting] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [voiceReady, setVoiceReady] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);

  const ANSWER_SECONDS = 60;
  const recognitionRef = useRef<any>(null);
  const indianVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const timerRef = useRef<number | null>(null);
  const submitRef = useRef<() => void>(() => {});
  const answerRef = useRef("");

  // Pick best Indian female voice
  useEffect(() => {
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const indian =
        voices.find((v) => /en-IN/i.test(v.lang) && /female|priya|veena|raveena/i.test(v.name)) ||
        voices.find((v) => /en-IN/i.test(v.lang)) ||
        voices.find((v) => /female|samantha|google uk english female/i.test(v.name)) ||
        voices.find((v) => /en-/i.test(v.lang));
      indianVoiceRef.current = indian || null;
      setVoiceReady(true);
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      if (indianVoiceRef.current) utt.voice = indianVoiceRef.current;
      utt.lang = "en-IN";
      utt.rate = 0.95;
      utt.pitch = 1.05;
      utt.onstart = () => setIsSpeaking(true);
      utt.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utt.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utt);
    });
  }, []);

  // Setup speech recognition
  const finalTranscriptRef = useRef("");
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    // en-US tends to have better acoustic models than en-IN in Chrome
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let interim = "";
      // Only iterate from resultIndex to avoid re-processing finalized chunks
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        // Pick the alternative with the highest confidence
        let best = result[0];
        for (let j = 1; j < result.length; j++) {
          if ((result[j].confidence ?? 0) > (best.confidence ?? 0)) best = result[j];
        }
        const text = best.transcript;
        if (result.isFinal) {
          finalTranscriptRef.current += text + " ";
        } else {
          interim += text;
        }
      }
      setCurrentAnswer((finalTranscriptRef.current + interim).trim());
    };
    rec.onerror = (e: any) => {
      console.warn("Speech recognition error:", e.error);
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setIsListening(false);
      }
    };
    rec.onend = () => {
      // Auto-restart if user is still in listening mode (Chrome stops after silence)
      if (isListeningRef.current) {
        try {
          rec.start();
          return;
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    };
    recognitionRef.current = rec;
  }, []);

  // Track listening state in a ref so onend can read latest value
  const isListeningRef = useRef(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice not supported",
        description: "Please use Chrome on Android/Desktop for voice input.",
        variant: "destructive",
      });
      return;
    }
    setCurrentAnswer("");
    finalTranscriptRef.current = "";
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startInterview = async () => {
    if (!role) {
      toast({ title: "Please select a role", variant: "destructive" });
      return;
    }
    if (!credits.checkAccess()) return;
    setLoading(true);
    try {
      const consumed = await credits.consume({ role });
      if (!consumed) { setLoading(false); return; }
      const { data, error } = await supabase.functions.invoke("live-hr-interview", {

        body: { action: "generate_questions", role, questionCount: TOTAL_QUESTIONS },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGreeting(data.greeting || `Hello! I'm Priya, HR Manager. Let's begin your interview for the ${role} position.`);
      setQuestions(data.questions || []);
      setAnswers(new Array((data.questions || []).length).fill(""));
      setPhase("intro");
      setLoading(false);
      // Speak greeting then first question
      await speak(data.greeting || `Hello! I'm Priya, HR Manager. Let's begin your interview for the ${role} position.`);
      setPhase("interviewing");
      setCurrentIdx(0);
      await speak(data.questions[0]);
      startTimer();
    } catch (e: any) {
      setLoading(false);
      toast({ title: "Could not start interview", description: e.message, variant: "destructive" });
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(ANSWER_SECONDS);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          // Auto-submit on next tick so latest answer is captured
          setTimeout(() => submitRef.current(), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Keep latest answer in ref for timer auto-submit
  useEffect(() => {
    answerRef.current = currentAnswer;
  }, [currentAnswer]);

  const submitAndNext = async () => {
    stopTimer();
    stopListening();
    const finalAnswer = answerRef.current.trim();
    const newAnswers = [...answers];
    newAnswers[currentIdx] = finalAnswer || "(no answer)";
    setAnswers(newAnswers);
    setCurrentAnswer("");
    answerRef.current = "";

    const next = currentIdx + 1;
    if (next >= questions.length) {
      // Get final verdict
      setPhase("evaluating");
      await speak("Thank you. Please give me a moment to review your responses.");
      try {
        const { data, error } = await supabase.functions.invoke("live-hr-interview", {
          body: { action: "final_verdict", role, questions, answers: newAnswers },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setVerdict(data);
        setPhase("verdict");
        await speak(data.spokenVerdict);
      } catch (e: any) {
        toast({ title: "Evaluation failed", description: e.message, variant: "destructive" });
        setPhase("interviewing");
      }
      return;
    }
    setCurrentIdx(next);
    await speak(questions[next]);
    startTimer();
  };

  // Keep submitRef pointing at latest submitAndNext
  useEffect(() => {
    submitRef.current = submitAndNext;
  });

  const skipQuestion = async () => {
    setCurrentAnswer("(skipped)");
    setTimeout(submitAndNext, 200);
  };

  const repeatQuestion = () => {
    if (questions[currentIdx]) speak(questions[currentIdx]);
  };

  const restart = () => {
    stopTimer();
    window.speechSynthesis.cancel();
    stopListening();
    setPhase("setup");
    setRole("");
    setQuestions([]);
    setAnswers([]);
    setCurrentIdx(0);
    setCurrentAnswer("");
    setVerdict(null);
    setTimeLeft(0);
  };

  useEffect(() => () => {
    stopTimer();
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
  }, []);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Briefcase className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">Live HR Interview</h1>
          <p className="text-muted-foreground text-sm mb-5">Login to face the AI HR for spot selection</p>
          <Button onClick={() => navigate("/login")} size="sm">Login to Continue</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/mock-interview")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* SETUP */}
        {phase === "setup" && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <img
                    src={hrAvatar}
                    alt="HR Priya"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    Live HR Interview <Sparkles className="h-4 w-4 text-yellow-500" />
                  </h1>
                  <p className="text-sm text-muted-foreground">Meet Priya — your AI HR Manager</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-5 text-sm space-y-1">
                <p>👩‍💼 25 real HR questions, voice-based</p>
                <p>🎙️ Speak your answers — Priya listens</p>
                <p>🏆 Spot Selection / Rejection at the end</p>
              </div>

              <label className="text-sm font-medium block mb-2">Choose role to interview for:</label>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {ROLES.map((r) => (
                  <Button
                    key={r}
                    variant={role === r ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRole(r)}
                    className="justify-start text-xs h-auto py-2"
                  >
                    {r}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs mb-2 px-1">
                <span className="text-muted-foreground">
                  {credits.remainingFree > 0 && <strong>{credits.remainingFree} free</strong>}
                  {credits.remainingFree > 0 && credits.aiCredits > 0 && " + "}
                  {credits.aiCredits > 0 && <strong>{credits.aiCredits} top-up</strong>}
                  {!credits.canGenerate && <span className="text-destructive font-semibold">No credits left</span>}
                </span>
                <button onClick={() => setShowTopup(true)} className="text-primary font-semibold hover:underline flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Top-up ₹499
                </button>
              </div>
              <Button onClick={startInterview} disabled={loading || !role || !voiceReady} className="w-full" size="lg">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                {loading ? "Priya is preparing..." : !credits.canGenerate ? "Top-up ₹499 to Start" : "Start Live Interview"}
              </Button>
              {!voiceReady && (
                <p className="text-xs text-muted-foreground text-center mt-2">Loading voice...</p>
              )}

            </CardContent>
          </Card>
        )}

        {/* INTERVIEWING */}
        {(phase === "intro" || phase === "interviewing" || phase === "evaluating") && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-5">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-5">
                <div className="relative">
                  <img
                    src={hrAvatar}
                    alt="HR Priya"
                    width={160}
                    height={160}
                    className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 shadow-xl transition-all ${
                      isSpeaking
                        ? "border-green-500 scale-105 ring-4 ring-green-500/30 animate-pulse"
                        : isListening
                        ? "border-red-500 ring-4 ring-red-500/30"
                        : "border-primary"
                    }`}
                  />
                  {isSpeaking && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Volume2 className="h-3 w-3 animate-pulse" /> Speaking
                    </div>
                  )}
                  {isListening && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Mic className="h-3 w-3 animate-pulse" /> Listening
                    </div>
                  )}
                </div>
                <div className="text-center mt-4">
                  <p className="font-semibold">Priya Sharma</p>
                  <p className="text-xs text-muted-foreground">HR Manager • {role}</p>
                </div>
              </div>

              {phase === "evaluating" ? (
                <div className="text-center py-6">
                  <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
                  <p className="font-medium">Priya is evaluating your interview...</p>
                  <p className="text-xs text-muted-foreground mt-1">Reviewing all 25 answers</p>
                </div>
              ) : (
                <>
                  {/* Progress + Timer */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span>Question {currentIdx + 1} of {questions.length}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={timeLeft <= 10 && timeLeft > 0 ? "destructive" : "secondary"}
                          className={`text-xs font-mono tabular-nums ${timeLeft <= 10 && timeLeft > 0 ? "animate-pulse" : ""}`}
                        >
                          ⏱ {String(Math.floor(timeLeft / 60)).padStart(1, "0")}:{String(timeLeft % 60).padStart(2, "0")}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{Math.round(((currentIdx) / questions.length) * 100)}%</Badge>
                      </div>
                    </div>
                    <Progress value={((currentIdx) / questions.length) * 100} className="h-2" />
                  </div>

                  {/* Question */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                    <p className="text-xs text-primary font-medium mb-1">Priya asks:</p>
                    <p className="font-medium">{questions[currentIdx] || greeting}</p>
                  </div>

                  {/* Answer area */}
                  <div className="bg-muted/30 rounded-lg p-3 mb-4 min-h-[80px]">
                    <p className="text-xs text-muted-foreground mb-1">Your answer:</p>
                    <p className="text-sm">
                      {currentAnswer || <span className="text-muted-foreground italic">Press the mic and speak…</span>}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col gap-2">
                    {!isListening ? (
                      <Button onClick={startListening} disabled={isSpeaking} className="w-full" size="lg">
                        <Mic className="h-4 w-4 mr-2" /> {currentAnswer ? "Continue Speaking" : "Start Speaking"}
                      </Button>
                    ) : (
                      <Button onClick={stopListening} variant="destructive" className="w-full" size="lg">
                        <MicOff className="h-4 w-4 mr-2" /> Stop Recording
                      </Button>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={repeatQuestion} variant="outline" size="sm" disabled={isSpeaking || isListening}>
                        <Volume2 className="h-3 w-3 mr-1" /> Repeat
                      </Button>
                      <Button onClick={skipQuestion} variant="outline" size="sm" disabled={isSpeaking || isListening}>
                        Skip
                      </Button>
                      <Button onClick={submitAndNext} size="sm" disabled={isSpeaking || isListening || !currentAnswer.trim()}>
                        Next →
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* VERDICT */}
        {phase === "verdict" && verdict && (
          <Card className={`border-2 ${verdict.decision === "SELECTED" ? "border-green-500" : "border-red-500"}`}>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <img
                  src={hrAvatar}
                  alt="HR Priya"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary mx-auto mb-3 shadow-lg"
                />
                {verdict.decision === "SELECTED" ? (
                  <>
                    <Trophy className="h-14 w-14 text-yellow-500 mx-auto mb-2" />
                    <h2 className="text-2xl font-bold text-green-600">🎉 SELECTED</h2>
                    <p className="text-sm text-muted-foreground">Congratulations! You impressed Priya.</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-14 w-14 text-red-500 mx-auto mb-2" />
                    <h2 className="text-2xl font-bold text-red-600">Not Selected</h2>
                    <p className="text-sm text-muted-foreground">Don't worry — practice and try again!</p>
                  </>
                )}
                <div className="mt-3">
                  <Badge variant="secondary" className="text-base px-4 py-1">
                    Score: {verdict.score}/100
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-4 italic text-sm">
                "{verdict.spokenVerdict}"
                <p className="text-xs text-muted-foreground mt-2 not-italic">— Priya Sharma, HR Manager</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Strengths
                  </p>
                  <ul className="text-xs space-y-1">
                    {verdict.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">
                    Areas to Improve
                  </p>
                  <ul className="text-xs space-y-1">
                    {verdict.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              </div>

              <p className="text-sm text-center text-muted-foreground mb-5">{verdict.finalRemarks}</p>

              <div className="flex gap-2">
                <Button onClick={restart} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/mock-interview")} className="flex-1">
                  Back to Training
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <TopupDialog open={showTopup} onOpenChange={setShowTopup} onSuccess={() => credits.refresh()} />
      <ToolGateDialog
        reason={credits.gateReason}
        onOpenChange={(o) => !o && credits.dismissGate()}
        onTopup={() => { credits.dismissGate(); setShowTopup(true); }}
      />
    </Layout>

  );
};

export default LiveHRInterview;
