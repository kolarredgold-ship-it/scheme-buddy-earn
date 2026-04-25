import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Brain, BookOpen, Code, Briefcase, ChevronRight, RotateCcw,
  ArrowRight, Star, Sparkles, GraduationCap, Info, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';

const courseOptions = ['BCom', 'BBA', 'BCA', 'MCA', 'BE/BTech', 'MBA', 'ME/MTech'];
const languageOptions = ['C', 'C++', 'Java', 'Python', 'JavaScript', 'SQL', 'React', 'Node.js'];
const roleOptions = ['Software Developer', 'Full Stack Developer', 'Data Analyst', 'AI Engineer', 'Accountant', 'HR Executive', 'Digital Marketing'];

const engineeringSpecializations: Record<string, string[]> = {
  'BE/BTech': ['Computer Science (CSE)', 'Electronics & Communication (ECE)', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering (EEE)', 'Information Technology (IT)', 'Chemical Engineering', 'Biotechnology'],
  'ME/MTech': ['Computer Science (CSE)', 'Electronics & Communication (ECE)', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & ML', 'Data Science', 'VLSI Design', 'Structural Engineering'],
};

type TrainingMode = null | 'course' | 'language' | 'role';
type ViewState = 'select-mode' | 'select-option' | 'select-specialization' | 'flashcards' | 'mock-interview';

interface Question {
  id: string;
  question: string;
  answer: string;
  difficulty: string;
}

interface InterviewResult {
  score: number;
  feedback: string;
  suggestions: string;
}

const MockInterview = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<ViewState>('select-mode');
  const [mode, setMode] = useState<TrainingMode>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [interviewRound, setInterviewRound] = useState(0);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Brain className="h-12 w-12 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-2">AI Mock Interview Training</h1>
          <p className="text-muted-foreground text-sm mb-5">Login to start practicing interviews with AI</p>
          <Button onClick={() => navigate('/login')} size="sm">Login to Continue</Button>
        </div>
      </Layout>
    );
  }

  const fetchQuestions = async (category: string, subcategory: string) => {
    setLoadingQuestions(true);
    try {
      const roleMapping: Record<string, string> = {
        'course': subcategory,
        'language': subcategory,
        'role': subcategory,
      };
      const roleQuery = roleMapping[category] || subcategory;
      
      const { data: dbQuestions, error: dbError } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('role', roleQuery)
        .order('category')
        .order('created_at');

      if (!dbError && dbQuestions && dbQuestions.length > 0) {
        setQuestions(dbQuestions.map((q: any) => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          difficulty: q.difficulty,
        })));
      } else {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('mock-interview', {
          body: { action: 'generate-questions', category, subcategory, userId: user?.id },
        });
        if (aiError) throw aiError;
        setQuestions(aiData?.questions || []);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load questions.', variant: 'destructive' });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const generateQuestionsForRole = async (role: string) => {
    setGeneratingQuestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
        body: { role },
      });
      if (error) throw error;
      toast({
        title: 'Questions Generated',
        description: `Generated questions for ${role}: ${JSON.stringify(data?.results)}`,
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate questions.', variant: 'destructive' });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const allGeneratableRoles = [
    ...roleOptions,
    ...Object.entries(engineeringSpecializations).flatMap(([degree, specs]) =>
      specs.map(spec => `${degree} - ${spec}`)
    ),
  ];

  const generateAllQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      for (const role of allGeneratableRoles) {
        toast({ title: 'Generating...', description: `Generating questions for ${role}...` });
        const { data, error } = await supabase.functions.invoke('generate-interview-questions', {
          body: { role },
        });
        if (error) {
          console.error(`Error for ${role}:`, error);
        }
      }
      toast({ title: 'Done!', description: 'All interview questions have been generated.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleSelectMode = (m: TrainingMode) => {
    setMode(m);
    setView('select-option');
  };

  const handleSelectOption = (option: string) => {
    if (engineeringSpecializations[option]) {
      setSelectedCourse(option);
      setView('select-specialization');
      return;
    }
    setSelectedOption(option);
    const category = mode === 'course' ? 'course' : mode === 'language' ? 'language' : 'role';
    fetchQuestions(category, option);
    setView('flashcards');
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleSelectSpecialization = (spec: string) => {
    const fullRole = `${selectedCourse} - ${spec}`;
    setSelectedOption(fullRole);
    fetchQuestions('course', fullRole);
    setView('flashcards');
    setCurrentIndex(0);
    setFlipped(false);
  };

  const startMockInterview = async () => {
    setView('mock-interview');
    setInterviewRound(0);
    setResult(null);
    setUserAnswer('');
    await fetchNextQuestion();
  };

  const fetchNextQuestion = async () => {
    setLoadingQuestion(true);
    setResult(null);
    setUserAnswer('');
    try {
      const topic = selectedOption || 'general';
      const { data, error } = await supabase.functions.invoke('mock-interview', {
        body: { action: 'ask-question', topic, round: interviewRound + 1, userId: user?.id },
      });
      if (error) throw error;
      setInterviewQuestion(data?.question || 'Tell me about yourself.');
      setInterviewRound(prev => prev + 1);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to get question.', variant: 'destructive' });
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast({ title: 'Empty answer', description: 'Please type your answer.', variant: 'destructive' });
      return;
    }
    setEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('mock-interview', {
        body: {
          action: 'evaluate',
          question: interviewQuestion,
          answer: userAnswer,
          topic: selectedOption,
          userId: user?.id,
        },
      });
      if (error) throw error;
      setResult({
        score: data?.score || 0,
        feedback: data?.feedback || '',
        suggestions: data?.suggestions || '',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to evaluate answer.', variant: 'destructive' });
    } finally {
      setEvaluating(false);
    }
  };

  const goBack = () => {
    if (view === 'mock-interview') setView('flashcards');
    else if (view === 'flashcards') { 
      if (selectedCourse && engineeringSpecializations[selectedCourse]) {
        setView('select-specialization'); 
      } else {
        setView('select-option');
      }
      setQuestions([]); 
    }
    else if (view === 'select-specialization') { setView('select-option'); setSelectedCourse(''); }
    else if (view === 'select-option') { setView('select-mode'); setMode(null); }
  };

  const getOptions = () => {
    if (mode === 'course') return courseOptions;
    if (mode === 'language') return languageOptions;
    if (mode === 'role') return roleOptions;
    return [];
  };

  const currentQ = questions[currentIndex];
  const difficultyColor = (d: string) =>
    d === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : d === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-5xl">

        {/* ===== MODE SELECTION ===== */}
        {view === 'select-mode' && (
          <div className="animate-fade-in">
            <div className="text-center mb-6 sm:mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-3">
                <Brain className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">AI-Powered Training</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                Choose Your <span className="text-primary">Training Path</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto px-2">
                Up to 200 questions per category • Swipe left/right to navigate • Tap to flip
              </p>
            </div>

            {isAdmin && (
              <div className="max-w-2xl mx-auto mb-4 sm:mb-6">
                <Card className="border-dashed border-2 border-primary/30">
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-xs sm:text-sm">Admin: Generate Q&A Database</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Generate 200 questions per role using DeepSeek AI</p>
                    </div>
                    <Button 
                      onClick={generateAllQuestions} 
                      disabled={generatingQuestions}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      {generatingQuestions ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Generating...</> : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Generate All</>}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="max-w-2xl mx-auto mb-5 sm:mb-8">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Note: AI Generated Questions</p>
                  <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500">Try the AI Mock Interview for real-time evaluation.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              {[
                { mode: 'course' as TrainingMode, icon: GraduationCap, title: 'Course Based', desc: 'BCom, BBA, BCA, MBA, BE/BTech & more', color: 'from-blue-500 to-indigo-600', badge: '7 Courses' },
                { mode: 'language' as TrainingMode, icon: Code, title: 'Programming', desc: 'C, Java, Python, JS, SQL & more', color: 'from-emerald-500 to-teal-600', badge: '8 Languages' },
                { mode: 'role' as TrainingMode, icon: Briefcase, title: 'Job Roles', desc: 'Software Dev, Data Analyst, HR & more', color: 'from-purple-500 to-pink-600', badge: '7 Roles' },
              ].map((item, i) => (
                <Card 
                  key={i} 
                  className="group cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all border-0 shadow-md relative overflow-hidden" 
                  onClick={() => handleSelectMode(item.mode)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />
                  <CardContent className="p-5 sm:p-8 flex sm:flex-col items-center sm:text-center gap-4 sm:gap-0">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 sm:mx-auto sm:mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:justify-center sm:mb-3">
                        <h3 className="text-base sm:text-xl font-bold">{item.title}</h3>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">{item.badge}</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 sm:hidden" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== OPTION SELECTION ===== */}
        {view === 'select-option' && (
          <div className="animate-fade-in">
            <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center mb-5 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                Select {mode === 'course' ? 'Your Course' : mode === 'language' ? 'Programming Language' : 'Job Role'}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Pick a topic to start practicing</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
              {getOptions().map((opt) => (
                <Card 
                  key={opt} 
                  className="cursor-pointer hover:shadow-md active:scale-[0.97] transition-all group border border-border/50"
                  onClick={() => handleSelectOption(opt)}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <h3 className="font-semibold text-sm sm:text-lg group-hover:text-primary transition-colors leading-tight">{opt}</h3>
                    <ChevronRight className="w-4 h-4 mx-auto mt-1.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== SPECIALIZATION SELECTION ===== */}
        {view === 'select-specialization' && selectedCourse && engineeringSpecializations[selectedCourse] && (
          <div className="animate-fade-in">
            <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center mb-5 sm:mb-8">
              <Badge variant="secondary" className="mb-2">{selectedCourse}</Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                Select Specialization
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">Choose your branch to get relevant questions</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto">
              {engineeringSpecializations[selectedCourse].map((spec) => (
                <Card 
                  key={spec} 
                  className="cursor-pointer hover:shadow-md active:scale-[0.97] transition-all group border border-border/50"
                  onClick={() => handleSelectSpecialization(spec)}
                >
                  <CardContent className="p-4 sm:p-6 text-center">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 text-primary/50 group-hover:text-primary transition-colors" />
                    <h3 className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors leading-tight">{spec}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== FLASH CARDS ===== */}
        {view === 'flashcards' && (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8 flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold truncate">{selectedOption}</h2>
                  <p className="text-muted-foreground text-xs">Flashcard Training</p>
                </div>
              </div>
              <Button 
                onClick={startMockInterview} 
                className="w-full sm:w-auto sm:self-end bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg active:scale-[0.98]"
                size="sm"
              >
                <Brain className="w-4 h-4 mr-2" /> Start AI Mock Interview
              </Button>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4 sm:mb-6 max-w-2xl mx-auto">
              <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500">
                For unlimited questions with evaluation, try <strong>AI Mock Interview</strong>.
              </p>
            </div>

            {loadingQuestions ? (
              <Card className="border-0 shadow-md max-w-2xl mx-auto">
                <CardContent className="p-10 sm:p-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Generating questions with AI...</p>
                </CardContent>
              </Card>
            ) : questions.length === 0 ? (
              <Card className="border-0 shadow-md max-w-2xl mx-auto">
                <CardContent className="p-10 sm:p-16 text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold text-base mb-1">No Flashcards Available</p>
                  <p className="text-muted-foreground text-xs mb-5">Try the AI Mock Interview for unlimited AI-generated questions!</p>
                  <Button onClick={startMockInterview} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <Brain className="w-4 h-4 mr-2" /> Start AI Mock Interview
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Progress */}
                <div className="max-w-2xl mx-auto mb-3 sm:mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-primary">{currentIndex + 1} / {questions.length}</span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Flashcard with swipe */}
                <div
                  className="mx-auto max-w-2xl select-none"
                  style={{ perspective: '1000px' }}
                  onTouchStart={(e) => {
                    (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
                    (e.currentTarget as any)._touchStartY = e.touches[0].clientY;
                    (e.currentTarget as any)._touchMoved = false;
                  }}
                  onTouchMove={(e) => {
                    const startX = (e.currentTarget as any)._touchStartX || 0;
                    const startY = (e.currentTarget as any)._touchStartY || 0;
                    const dx = e.touches[0].clientX - startX;
                    const dy = e.touches[0].clientY - startY;
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                      (e.currentTarget as any)._touchMoved = true;
                    }
                  }}
                  onTouchEnd={(e) => {
                    const startX = (e.currentTarget as any)._touchStartX || 0;
                    const startY = (e.currentTarget as any)._touchStartY || 0;
                    const endX = e.changedTouches[0].clientX;
                    const endY = e.changedTouches[0].clientY;
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const moved = (e.currentTarget as any)._touchMoved;
                    // Horizontal swipe takes precedence
                    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                      if (dx < 0 && currentIndex < questions.length - 1) {
                        setCurrentIndex((p) => p + 1);
                        setFlipped(false);
                      } else if (dx > 0 && currentIndex > 0) {
                        setCurrentIndex((p) => p - 1);
                        setFlipped(false);
                      }
                    } else if (!moved) {
                      // Treat as tap → flip
                      setFlipped((f) => !f);
                    }
                  }}
                  onClick={(e) => {
                    // Desktop click flip (touch handled above)
                    if ((e as any).nativeEvent.pointerType === 'mouse' || !('ontouchstart' in window)) {
                      setFlipped(!flipped);
                    }
                  }}
                >
                  <div
                    className="relative transition-transform duration-500 cursor-pointer"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
                      minHeight: '260px',
                    }}
                  >
                    {/* Front - Question */}
                    <Card className="absolute inset-0 border-0 shadow-lg" style={{ backfaceVisibility: 'hidden' }}>
                      <CardContent className="p-5 sm:p-8 flex flex-col items-center justify-center h-full min-h-[260px]">
                        <Badge className={`mb-3 sm:mb-5 text-[10px] sm:text-xs ${difficultyColor(currentQ?.difficulty || 'medium')}`}>
                          {currentQ?.difficulty || 'medium'}
                        </Badge>
                        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Question</p>
                        <p className="text-base sm:text-xl text-center font-semibold leading-relaxed px-1">{currentQ?.question}</p>
                        <div className="mt-5 sm:mt-8 flex flex-col items-center gap-1 text-primary text-xs">
                          <span className="animate-pulse">Tap to reveal answer</span>
                          <span className="text-[10px] text-muted-foreground">← Swipe left/right to navigate →</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Back - Answer */}
                    <Card className="absolute inset-0 border-0 shadow-lg border-t-4 border-t-primary" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <CardContent className="p-5 sm:p-8 flex flex-col items-center justify-center h-full min-h-[260px]">
                        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-primary mb-3 font-bold">Answer</p>
                        <p className="text-center text-muted-foreground text-sm sm:text-base whitespace-pre-wrap leading-relaxed px-1">{currentQ?.answer}</p>
                        <div className="mt-5 sm:mt-8 flex flex-col items-center gap-1 text-muted-foreground text-xs">
                          <span>Tap to see question</span>
                          <span className="text-[10px]">← Swipe left/right to navigate →</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-center gap-2 sm:gap-3 mt-5 sm:mt-8">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentIndex === 0} 
                    onClick={() => { setCurrentIndex(prev => prev - 1); setFlipped(false); }}
                    className="px-3 sm:px-4"
                  >
                    <ArrowLeft className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setFlipped(false); setCurrentIndex(0); }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentIndex === questions.length - 1} 
                    onClick={() => { setCurrentIndex(prev => prev + 1); setFlipped(false); }}
                    className="px-3 sm:px-4"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ArrowRight className="w-4 h-4 sm:ml-1" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== MOCK INTERVIEW ===== */}
        {view === 'mock-interview' && (
          <div className="animate-fade-in max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-1">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center mb-5 sm:mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
                <Brain className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Live AI Interview</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate px-4">
                {selectedOption || 'General'} Interview
              </h2>
            </div>

            {loadingQuestion ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-10 sm:p-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">AI is preparing your question...</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 sm:h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <CardHeader className="pb-1 px-4 sm:px-6 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600">{interviewRound}</span>
                    </div>
                    Round {interviewRound}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 pb-6 px-4 sm:px-6">
                  <div className="bg-secondary/20 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-border/30">
                    <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">Interview Question</p>
                    <p className="font-semibold text-sm sm:text-lg leading-relaxed">{interviewQuestion}</p>
                  </div>

                  {!result ? (
                    <>
                      <Textarea
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={5}
                        className="text-sm sm:text-base"
                      />
                      <Button 
                        onClick={submitAnswer} 
                        disabled={evaluating} 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 active:scale-[0.98]" 
                        size="default"
                      >
                        {evaluating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Evaluating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Submit Answer</>}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold ${result.score >= 7 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : result.score >= 4 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          <Star className="w-5 h-5" />
                          Score: {result.score}/10
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg sm:rounded-xl p-4 border border-blue-200/30">
                        <p className="font-semibold mb-1.5 text-blue-700 dark:text-blue-400 text-xs">💬 Feedback</p>
                        <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-300 leading-relaxed">{result.feedback}</p>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg sm:rounded-xl p-4 border border-green-200/30">
                        <p className="font-semibold mb-1.5 text-green-700 dark:text-green-400 text-xs">✨ Suggestions</p>
                        <p className="text-xs sm:text-sm text-green-900 dark:text-green-300 leading-relaxed">{result.suggestions}</p>
                      </div>

                      <Button 
                        onClick={fetchNextQuestion} 
                        className="w-full bg-gradient-to-r from-primary to-primary/80 active:scale-[0.98]" 
                        size="default"
                      >
                        Next Question <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MockInterview;
