import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { FileText, ArrowLeft, Loader2, Download, Sparkles, CreditCard, Clock, CheckCircle2, AlertCircle, Eye, EyeOff, Wifi, RotateCcw, Timer, Volume2, Square } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, ImageRun, Header, Footer, PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import TopupDialog from '@/components/TopupDialog';
import GenerateShortcuts from '@/components/GenerateShortcuts';
import QualityGate from '@/components/QualityGate';
import { getReportKindTheme } from '@/lib/reportKindTheme';



interface FormData {
  studentName: string;
  registerNumber: string;
  course: string;
  collegeName: string;
  university: string;
  guideName: string;
  internshipTitle: string;
  companyName: string;
  companyLocation: string;
  internshipDuration: string;
  academicYear: string;
  topicSpecialization: string;
  pagesCount: number;
}

const initialFormData: FormData = {
  studentName: '',
  registerNumber: '',
  course: '',
  collegeName: '',
  university: '',
  guideName: '',
  internshipTitle: '',
  companyName: '',
  companyLocation: '',
  internshipDuration: '',
  academicYear: '',
  topicSpecialization: '',
  pagesCount: 25,
};

const MAX_TOPIC_PAYLOAD_LENGTH = 9000;
const MIN_PAGES_COUNT = 3;
const MAX_PAGES_COUNT = 50;
const THESIS_MIN_PAGES_COUNT = 150;
const THESIS_MAX_PAGES_COUNT = 400;

const getMinPagesCount = (kind: ReportKind) => kind === 'thesis' ? THESIS_MIN_PAGES_COUNT : MIN_PAGES_COUNT;
const getMaxPagesCount = (kind: ReportKind) => kind === 'thesis' ? THESIS_MAX_PAGES_COUNT : MAX_PAGES_COUNT;

const clampPagesCount = (value: unknown, kind: ReportKind = 'internship') => {
  const parsed = typeof value === 'number' || typeof value === 'string' ? Number(value) : initialFormData.pagesCount;
  if (!Number.isFinite(parsed)) return initialFormData.pagesCount;
  return Math.min(Math.max(Math.trunc(parsed), getMinPagesCount(kind)), getMaxPagesCount(kind));
};

const getGenerationPayload = (data: FormData, kind: ReportKind = 'internship'): FormData => ({
  ...data,
  topicSpecialization: data.topicSpecialization.trim().slice(0, MAX_TOPIC_PAYLOAD_LENGTH),
  pagesCount: clampPagesCount(data.pagesCount, kind),
});

// Chapters to generate (in order) - varies by report kind
export type ReportKind = 'internship' | 'project' | 'thesis';

const getChapters = (internshipTitle?: string, kind: ReportKind = 'internship') => {
  if (kind === 'internship') {
    return [
      { key: 'front', label: 'Front Matter', description: 'Certificate, Declaration, Acknowledgement, Abstract, Executive Summary, TOC' },
      { key: '1', label: 'Chapter I', description: 'Introduction (5-8 pages)' },
      { key: '2', label: 'Chapter II', description: 'Description of the Organisation (8-12 pages)' },
      { key: '3', label: 'Chapter III', description: 'Experiential Learning (6-10 pages)' },
      { key: '4', label: 'Chapter IV', description: 'Internship Outcomes and Conclusion (6-10 pages)' },
      { key: '5', label: 'Bibliography', description: 'References & Annexures' },
    ];
  }
  const isThesis = kind === 'thesis';
  return [
    { key: 'front', label: 'Front Matter', description: `Certificate, Declaration, Abstract, ${isThesis ? 'Synopsis' : 'Executive Summary'}, TOC` },
    { key: '1', label: 'Chapter I', description: 'Introduction, Problem Statement & Objectives' },
    { key: '2', label: 'Chapter II', description: isThesis ? 'Review of Literature' : 'Theoretical Background & Profile' },
    { key: '3', label: 'Chapter III', description: 'Research Design & Methodology' },
    { key: '4', label: 'Chapter IV', description: 'Data Analysis & Interpretation' },
    { key: '5', label: 'Chapter V', description: 'Findings, Suggestions, Conclusion & Bibliography' },
  ];
};

// Sound notification function
const playCompletionSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a pleasant chime sequence
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playNote(523.25, now, 0.2);        // C5
    playNote(659.25, now + 0.15, 0.2); // E5
    playNote(783.99, now + 0.3, 0.3);  // G5
  } catch (e) {
    console.log('Audio notification not supported');
  }
};

interface ChapterContent {
  [key: string]: string | null;
}

const CreateReport = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [reportKind, setReportKind] = useState<ReportKind>('internship');
  const kindTheme = getReportKindTheme(reportKind);
  const KindIcon = kindTheme.icon;
  const kindFields = reportKind === 'thesis'
    ? {
        sectionTitle: 'Thesis / Dissertation Details',
        sectionHint: 'Provide your research details. Accurate inputs give a stronger thesis.',
        detailsHeading: 'Research Details',
        titleLabel: 'Research Title *',
        titlePlaceholder: 'e.g. Impact of AI on retail supply chains',
        showCompany: false,
        orgLabel: 'Case Study Organisation (optional)',
        orgPlaceholder: 'Organisation studied, if any',
        topicLabel: 'Research Area & Summary *',
        topicPlaceholder: 'Describe your research area, problem statement, hypothesis, methodology and expected outcomes.',
        pitch: '✓ Customized for your research topic',
      }
    : reportKind === 'project'
      ? {
          sectionTitle: 'Project Report Details',
          sectionHint: 'Provide your project details. Accurate inputs give a stronger report.',
          detailsHeading: 'Project Details',
          titleLabel: 'Project Title *',
          titlePlaceholder: 'e.g. Customer satisfaction study for XYZ Ltd',
          showCompany: false,
          orgLabel: 'Case Study Company (optional)',
          orgPlaceholder: 'Company studied, if any',
          topicLabel: 'Project Objective & Scope *',
          topicPlaceholder: 'Describe the project objective, scope, methodology and the data or tools you used.',
          pitch: '✓ Customized for your project',
        }
      : {
          sectionTitle: 'Internship Details',
          sectionHint: 'All fields are required. Provide accurate information for the best results.',
          detailsHeading: 'Internship Details',
          titleLabel: 'Internship Title *',
          titlePlaceholder: 'Enter internship title',
          showCompany: true,
          orgLabel: 'Company Name *',
          orgPlaceholder: 'Enter company name',
          topicLabel: 'Topic/Specialization *',
          topicPlaceholder: 'Explain about the company and the internship you completed in this company. Include the company website for better understanding and results',
          pitch: '✓ Customized for your internship',
        };


  const [qualityPassed, setQualityPassed] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<ChapterContent>({});

  // Any change to generated content invalidates a previous quality check.
  useEffect(() => { setQualityPassed(false); }, [chapterContent]);

  const [canGenerate, setCanGenerate] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'pending' | 'verified'>('none');
  const [hasApprovedPayment, setHasApprovedPayment] = useState(false);
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [needsTopup, setNeedsTopup] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationPhase, setGenerationPhase] = useState('');
  const [failedChapters, setFailedChapters] = useState<string[]>([]);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [allGeneratedLines, setAllGeneratedLines] = useState<{chapter: string; line: string}[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [generateInParts, setGenerateInParts] = useState(false);
  const [currentPart, setCurrentPart] = useState<string | null>(null);
  const [parallelGeneration, setParallelGeneration] = useState(true); // Fast mode on by default
  const [activeChapters, setActiveChapters] = useState<string[]>([]); // Track chapters being generated in parallel
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [resumingReport, setResumingReport] = useState(false);
  const [chapterTimes, setChapterTimes] = useState<number[]>([]);
  const [chapterStartTime, setChapterStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const [funMessage, setFunMessage] = useState<string>('');
  const [funMessageIndex, setFunMessageIndex] = useState(0);
  const [stopRequested, setStopRequested] = useState(false);
  const [thinkingSeconds, setThinkingSeconds] = useState(0); // Timer for AI thinking
  const [isApiCalling, setIsApiCalling] = useState(false); // Track when API is being called
  const scrollRef = useRef<HTMLDivElement>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fun status messages to keep users engaged
  const funMessages = [
    "🤔 Thinking deeply about your internship...",
    "📚 Analyzing industry best practices...",
    "✍️ Crafting professional content...",
    "🎓 Making it university-ready...",
    "🔍 Adding relevant insights...",
    "💡 Generating creative sections...",
    "📝 Structuring chapters perfectly...",
    "🎨 Polishing the presentation...",
    "🧠 AI is working its magic...",
    "⚡ Processing your requirements...",
    "📖 Building comprehensive content...",
    "🎯 Tailoring to your specifications...",
    "🌟 Creating something amazing...",
    "🚀 Almost there, quality takes time...",
    "💼 Professional formatting in progress...",
    "🔧 Fine-tuning the details...",
    "📊 Incorporating data analysis...",
    "🎉 Making your report stand out...",
    "🏆 Ensuring top-notch quality...",
    "✨ Sprinkling some AI excellence...",
  ];

  // Rotate fun messages during generation
  useEffect(() => {
    if (generating) {
      setFunMessage(funMessages[0]);
      const interval = setInterval(() => {
        setFunMessageIndex(prev => {
          const next = (prev + 1) % funMessages.length;
          setFunMessage(funMessages[next]);
          return next;
        });
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setFunMessage('');
      setFunMessageIndex(0);
    }
  }, [generating]);

  // Thinking timer - counts up while API is calling
  useEffect(() => {
    if (isApiCalling) {
      setThinkingSeconds(0);
      thinkingTimerRef.current = setInterval(() => {
        setThinkingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
      setThinkingSeconds(0);
    }
    return () => {
      if (thinkingTimerRef.current) {
        clearInterval(thinkingTimerRef.current);
      }
    };
  }, [isApiCalling]);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [allGeneratedLines, currentLine]);

  // Check for resumable reports on load
  useEffect(() => {
    if (user) {
      checkForResumableReport();
    }
  }, [user]);

  // Prefill from Generate wizard (sessionStorage handoff)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('prefill_report_form');
      if (!raw) return;
      const p = JSON.parse(raw) || {};
      let kind: ReportKind = 'internship';
      if (p.reportKind === 'project' || p.reportKind === 'thesis' || p.reportKind === 'internship') {
        kind = p.reportKind;
        setReportKind(p.reportKind);
      }
      setFormData(prev => ({
        ...prev,
        studentName: p.studentName ?? prev.studentName,
        registerNumber: p.registerNumber ?? prev.registerNumber,
        course: p.course ?? prev.course,
        collegeName: p.collegeName ?? prev.collegeName,
        university: p.university ?? prev.university,
        guideName: p.guideName ?? prev.guideName,
        internshipTitle: p.internshipTitle ?? prev.internshipTitle,
        companyName: p.companyName ?? prev.companyName,
        companyLocation: p.companyLocation ?? prev.companyLocation,
        internshipDuration: p.internshipDuration ?? prev.internshipDuration,
        academicYear: p.academicYear ?? prev.academicYear,
        topicSpecialization: p.topicSpecialization ?? prev.topicSpecialization,
        pagesCount: p.pagesCount !== undefined ? clampPagesCount(p.pagesCount, kind) : prev.pagesCount,
      }));
      sessionStorage.removeItem('prefill_report_form');
      toast({ title: 'Details prefilled', description: 'We filled the form with your wizard answers. Review and generate.' });
    } catch (e) {
      console.error('prefill parse error', e);
    }
  }, []);

  const checkForResumableReport = async () => {
    try {
      // Find reports that have partial content saved
      const { data: reports } = await supabase
        .from('reports')
        .select('id, report_content, report_kind, student_name, register_number, course, college_name, university, guide_name, internship_title, company_name, company_location, internship_duration, academic_year, topic_specialization, pages_count')
        .eq('user_id', user?.id)
        .eq('status', 'generating')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (reports && reports.length > 0) {
        const report = reports[0];
        if (report.report_content) {
          try {
            const savedContent = JSON.parse(report.report_content) as ChapterContent;
            const completedCount = Object.keys(savedContent).filter(k => savedContent[k]).length;
            
            if (completedCount > 0 && completedCount < getChapters(report.internship_title).length) {
              setResumingReport(true);
              setCurrentReportId(report.id);
              setChapterContent(savedContent);

              const savedKind: ReportKind =
                report.report_kind === 'project' || report.report_kind === 'thesis' || report.report_kind === 'internship'
                  ? report.report_kind
                  : 'internship';
              setReportKind(savedKind);
              
              // Restore form data
              setFormData({
                studentName: report.student_name,
                registerNumber: report.register_number,
                course: report.course,
                collegeName: report.college_name,
                university: report.university,
                guideName: report.guide_name,
                internshipTitle: report.internship_title,
                companyName: report.company_name,
                companyLocation: report.company_location,
                internshipDuration: report.internship_duration,
                academicYear: report.academic_year,
                topicSpecialization: report.topic_specialization,
                pagesCount: clampPagesCount(report.pages_count, savedKind),
              });

              toast({
                title: 'Resume available',
                description: `Found incomplete report with ${completedCount}/${getChapters(report.internship_title).length} chapters. You can continue from where you left off.`,
              });
            }
          } catch (e) {
            console.error('Error parsing saved content:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for resumable reports:', error);
    }
  };

  // Save chapter content to database
  const saveChapterToDb = async (reportId: string, content: ChapterContent) => {
    try {
      await supabase
        .from('reports')
        .update({ 
          report_content: JSON.stringify(content),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);
    } catch (error) {
      console.error('Error saving chapter to database:', error);
    }
  };

  // Calculate estimated time remaining (accounts for parallel generation)
  const updateEstimatedTime = (completedChaptersCount: number) => {
    const BATCH_SIZE = parallelGeneration ? 3 : 1;
    const totalChapters = getChapters(formData.internshipTitle, reportKind).length;
    const remainingChapters = totalChapters - completedChaptersCount;
    const remainingBatches = Math.ceil(remainingChapters / BATCH_SIZE);
    
    if (chapterTimes.length === 0) {
      // Default estimate: 30 seconds per batch in parallel mode, 45 in sequential
      const secondsPerBatch = parallelGeneration ? 30 : 45;
      const seconds = remainingBatches * secondsPerBatch;
      setEstimatedTimeRemaining(formatTime(seconds));
    } else {
      // Use actual timing data
      const avgBatchTime = chapterTimes.reduce((a, b) => a + b, 0) / chapterTimes.length;
      const seconds = Math.round((remainingBatches * avgBatchTime) / 1000);
      setEstimatedTimeRemaining(formatTime(seconds));
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `~${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}m ${secs}s`;
  };

  const completedChapters = Object.keys(chapterContent).filter(k => chapterContent[k]);
  const hasAnyContent = completedChapters.length > 0;
  const allChapters = getChapters(formData.internshipTitle, reportKind);
  const requiredChapters = hasApprovedPayment ? allChapters : allChapters.filter(ch => ch.key !== '5');
  const hasAllContent = requiredChapters.every(ch => chapterContent[ch.key]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data: isAdminData } = await supabase
        .rpc('has_role', { _user_id: user?.id as string, _role: 'admin' });
      if (isAdminData) {
        setCanGenerate(true); setNeedsTopup(false); setPaymentStatus('verified'); setHasApprovedPayment(true);
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_expires_at')
        .eq('user_id', user!.id)
        .maybeSingle();
      const isPro = prof?.subscription_status === 'active' &&
        (!prof?.subscription_expires_at || new Date(prof.subscription_expires_at) > new Date());
      const { count: freeUsedCount } = await supabase
        .from('report_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('report_type', 'full');
      const { data: credit } = await supabase
        .from('tool_credits')
        .select('credits')
        .eq('user_id', user!.id)
        .eq('tool_key', 'full')
        .maybeSingle();
      const paidCredits = credit ? credit.credits : (isPro ? 3 : 0);
      const used = freeUsedCount || 0;
      setGenerationsUsed(used);
      setHasApprovedPayment(isPro);
      const allowed = isPro ? paidCredits > 0 : used < 1;
      setCanGenerate(allowed);
      setNeedsTopup(!allowed);
      setPaymentStatus(isPro ? 'verified' : 'none');
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculatePrice = () => {
    // Fixed price - ₹499 only
    return 499;
  };

  const validateForm = () => {
    const requiredFields = [
      'studentName', 'registerNumber', 'course', 'collegeName', 
      'university', 'guideName', 'internshipTitle',
      ...(reportKind === 'internship'
        ? ['companyName', 'companyLocation', 'internshipDuration']
        : []),
      'academicYear', 'topicSpecialization'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) return;

    try {
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          user_id: user?.id,
          student_name: formData.studentName,
          register_number: formData.registerNumber,
          course: formData.course,
          college_name: formData.collegeName,
          university: formData.university,
          guide_name: formData.guideName,
          internship_title: formData.internshipTitle,
          company_name: formData.companyName,
          company_location: formData.companyLocation,
          internship_duration: formData.internshipDuration,
          academic_year: formData.academicYear,
          topic_specialization: formData.topicSpecialization,
          report_kind: reportKind,
          pages_count: clampPagesCount(formData.pagesCount, reportKind),
          status: 'pending_payment',
        })
        .select()
        .single();

      if (reportError) throw reportError;

      setPendingReportId(reportData.id);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Create report error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTopupPayment = () => {
    setPendingReportId(null);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus('pending');
    setShowPaymentModal(false);
    toast({
      title: 'Payment submitted!',
      description: 'Your payment is under review. Report will be generated after verification.',
    });
  };

  // Generate a single chapter with retry logic and fallback to parts
  const generateChapter = async (chapterKey: string, retries = 2): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Generating chapter ${chapterKey}, attempt ${attempt}/${retries}`);
        
        setIsApiCalling(true); // Start thinking timer
        
        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            ...getGenerationPayload(formData, reportKind),
            userId: user?.id,
            reportKind,
            chapter: chapterKey,
          },
        });

        setIsApiCalling(false); // Stop thinking timer
        
        if (error) throw error;
        return data?.content || null;
      } catch (error: any) {
        setIsApiCalling(false); // Stop thinking timer on error
        console.error(`Error generating chapter ${chapterKey} (attempt ${attempt}):`, error);
        
        // If this was the last attempt, try generating in parts
        if (attempt === retries) {
          console.log(`Attempting to generate chapter ${chapterKey} in parts...`);
          setAllGeneratedLines(prev => [...prev, { 
            chapter: chapterKey, 
            line: `🔄 Generating in smaller parts...` 
          }]);
          
          const partsContent = await generateChapterInParts(chapterKey);
          if (partsContent) {
            return partsContent;
          }
          return null;
        }
        
        // Show retry notification
        setAllGeneratedLines(prev => [...prev, { 
          chapter: chapterKey, 
          line: `⏳ Retrying... (attempt ${attempt + 1}/${retries})` 
        }]);
        
        // Wait before retrying (2s, 4s)
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    return null;
  };

  // Part labels for display
  const partLabels: Record<string, string> = {
    'part1_certificate': 'Certificate & Declaration',
    'part2_abstract': 'Abstract & TOC',
    'part1_background': 'Background & Context',
    'part2_objectives': 'Objectives & Scope',
    'part1_industry': 'Industry Overview',
    'part2_company': 'Company Profile',
    'part1_theory': 'Theoretical Framework',
    'part2_review': 'Literature & Research',
    'part1_activities': 'External Learning Activities',
    'part2_projects': 'Learning Outcomes',
    'part1_technical': 'Internship Results',
    'part2_soft': 'Skills & Outcomes',
    'part1_methodology': 'Data Methodology',
    'part2_findings': 'Findings & Analysis',
    'part1_challenges': 'Challenges Faced',
    'part2_solutions': 'Solutions & Lessons',
    'part1_recommendations': 'Recommendations',
    'part2_future': 'Future Scope',
    'part1_conclusion': 'Conclusion',
    'part2_references': 'Bibliography & Annexures',
  };

  // Stop generation handler
  const handleStopGeneration = () => {
    setStopRequested(true);
    setAllGeneratedLines(prev => [...prev, { 
      chapter: currentChapter || '', 
      line: `\n🛑 Generation stopped by user. Saving progress...` 
    }]);
  };

  // Generate chapter in smaller parts when full generation times out
  const generateChapterInParts = async (chapterKey: string): Promise<string | null> => {
    const chapterParts: Record<string, string[]> = reportKind === 'thesis'
      ? {
          'front': ['part1', 'part2'],
          '1': ['part1', 'part2'],
          '2': ['part1', 'part2'],
          '3': ['part1', 'part2'],
          '4': ['part1', 'part2'],
          '5': ['part1', 'part2'],
        }
      : {
          'front': ['part1_certificate', 'part2_abstract'],
          '1': ['part1_background', 'part2_objectives'],
          '2': ['part1_industry', 'part2_company'],
          '3': ['part1_theory', 'part2_review'],
          '4': ['part1_activities', 'part2_projects'],
          '5': ['part1_technical', 'part2_soft'],
          '6': ['part1_methodology', 'part2_findings'],
          '7': ['part1_challenges', 'part2_solutions'],
          '8': ['part1_recommendations', 'part2_future'],
          '9': ['part1_conclusion', 'part2_references'],
        };

    const parts = chapterParts[chapterKey] || ['part1', 'part2'];
    const contents: string[] = [];

    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
      const part = parts[partIdx];
      const partLabel = partLabels[part] || part;
      
      try {
        setCurrentPart(partLabel);
        setAllGeneratedLines(prev => [...prev, { 
          chapter: chapterKey, 
          line: `   📝 Part ${partIdx + 1}/${parts.length}: ${partLabel}...` 
        }]);

        setIsApiCalling(true); // Start thinking timer
        
        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            ...getGenerationPayload(formData, reportKind),
            userId: user?.id,
            reportKind,
            chapter: chapterKey,
            part: part,
          },
        });

        setIsApiCalling(false); // Stop thinking timer
        
        if (error) throw error;
        if (data?.content) {
          contents.push(data.content);
          
          // Show content line by line for parts too
          const lines = data.content.split('\n');
          for (const line of lines) {
            for (let i = 0; i <= line.length; i += 5) {
              setCurrentLine(line.slice(0, i));
              await new Promise(resolve => setTimeout(resolve, 1));
            }
            setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line }]);
            setLineCount(prev => prev + 1);
            setCurrentLine('');
          }
        }

        // Small delay between parts
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Error generating ${chapterKey} ${part}:`, error);
        setAllGeneratedLines(prev => [...prev, { 
          chapter: chapterKey, 
          line: `   ⚠️ Failed: ${partLabel}` 
        }]);
      }
    }

    setCurrentPart(null);
    
    if (contents.length > 0) {
      return contents.join('\n\n');
    }
    return null;
  };

  // Retry a single failed chapter
  const handleRetrySingleChapter = async (chapterKey: string) => {
    const chapter = getChapters(formData.internshipTitle, reportKind).find(c => c.key === chapterKey);
    if (!chapter) return;

    setGenerating(true);
    setCurrentChapter(chapterKey);
    setGenerationPhase(`Retrying ${chapter.label}...`);
    
    // Add chapter header to preview
    setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line: `\n━━━ Retrying ${chapter.label} ━━━\n` }]);
    
    const content = await generateChapter(chapterKey);
    
    if (content) {
      setChapterContent(prev => {
        const updated = { ...prev, [chapterKey]: content };
        // Save to database
        if (currentReportId) saveChapterToDb(currentReportId, updated);
        return updated;
      });
      setFailedChapters(prev => prev.filter(k => k !== chapterKey));
      
      // Show content line by line
      const lines = content.split('\n');
      for (const line of lines) {
        for (let i = 0; i <= line.length; i += 5) {
          setCurrentLine(line.slice(0, i));
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line }]);
        setLineCount(prev => prev + 1);
        setCurrentLine('');
      }
      
      toast({
        title: 'Chapter generated!',
        description: `${chapter.label} has been generated successfully.`,
      });
    } else {
      setAllGeneratedLines(prev => [...prev, { chapter: chapterKey, line: `⚠️ Still failed to generate ${chapter.label}` }]);
      toast({
        title: 'Generation failed',
        description: `${chapter.label} could not be generated.`,
        variant: 'destructive',
      });
    }

    setGenerating(false);
    setCurrentChapter(null);
    setGenerationPhase('');
    setCurrentLine('');
  };

  // Generate all chapters sequentially
  const handleGenerateReport = async () => {
    if (!canGenerate) {
      toast({
        title: 'Generation limit reached',
        description: 'Please top up to continue generating reports.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) return;

    setGenerating(true);
    setFailedChapters([]);
    setCurrentLine('');
    setChapterTimes([]);
    setEstimatedTimeRemaining(null);
    
    // Initialize timing estimate
    updateEstimatedTime(Object.keys(chapterContent).filter(k => chapterContent[k]).length);
    
    // Only reset lines if starting fresh
    if (!resumingReport) {
      setAllGeneratedLines([]);
      setLineCount(0);
    }
    
    // Create or use existing report record
    let reportId = currentReportId;
    
    if (!reportId) {
      try {
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .insert({
            user_id: user?.id,
            student_name: formData.studentName,
            register_number: formData.registerNumber,
            course: formData.course,
            college_name: formData.collegeName,
            university: formData.university,
            guide_name: formData.guideName,
            internship_title: formData.internshipTitle,
            company_name: formData.companyName,
            company_location: formData.companyLocation,
            internship_duration: formData.internshipDuration,
            academic_year: formData.academicYear,
            topic_specialization: formData.topicSpecialization,
            report_kind: reportKind,
            pages_count: clampPagesCount(formData.pagesCount, reportKind),
            status: 'generating',
          })
          .select()
          .single();

        if (reportError) throw reportError;
        reportId = reportData.id;
        setCurrentReportId(reportId);
      } catch (error: any) {
        console.error('Create report error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create report. Please try again.',
          variant: 'destructive',
        });
        setGenerating(false);
        return;
      }
    }
    
    const newContent: ChapterContent = { ...chapterContent };
    const failed: string[] = [];
    const times: number[] = [...chapterTimes];

    // Find chapters to generate (skip already completed ones if resuming)
    const CHAPTERS = getChapters(formData.internshipTitle, reportKind);
    
    // Free users (no verified payment) only get up to Chapter 4 (no Bibliography)
    const isFreeGeneration = !hasApprovedPayment;
    const availableChapters = isFreeGeneration 
      ? CHAPTERS.filter(ch => ch.key !== '5') // Exclude Bibliography for free users
      : CHAPTERS;
    
    const chaptersToGenerate = resumingReport 
      ? availableChapters.filter(ch => !chapterContent[ch.key])
      : availableChapters;
    
    if (isFreeGeneration) {
      setAllGeneratedLines(prev => [...prev, { chapter: 'system', line: `\n📋 Free trial: Generating up to Chapter 4. Top up ₹499 for full reports with Bibliography.\n` }]);
    }
    
    if (resumingReport) {
      setAllGeneratedLines(prev => [...prev, { chapter: 'system', line: `\n🔄 Resuming generation... (${CHAPTERS.length - chaptersToGenerate.length}/${CHAPTERS.length} already done)\n` }]);
    }

    // Parallel generation: process chapters in batches of 3 for speed
    const BATCH_SIZE = parallelGeneration ? 3 : 1;
    
    if (parallelGeneration) {
      setAllGeneratedLines(prev => [...prev, { chapter: 'system', line: `\n⚡ Parallel generation enabled (${BATCH_SIZE} chapters at a time)\n` }]);
    }

    for (let batchStart = 0; batchStart < chaptersToGenerate.length; batchStart += BATCH_SIZE) {
      // Check if stop was requested
      if (stopRequested) {
        setAllGeneratedLines(prev => [...prev, { 
          chapter: 'system', 
          line: `\n✅ Generation stopped. Progress saved. You can resume later.` 
        }]);
        break;
      }

      const batch = chaptersToGenerate.slice(batchStart, batchStart + BATCH_SIZE);
      const batchKeys = batch.map(ch => ch.key);
      
      // Update UI to show all active chapters
      setActiveChapters(batchKeys);
      setCurrentChapter(batchKeys.join(', '));
      
      const overallProgress = resumingReport 
        ? Math.round(((CHAPTERS.length - chaptersToGenerate.length + batchStart) / CHAPTERS.length) * 100)
        : Math.round((batchStart / CHAPTERS.length) * 100);
      setGenerationProgress(overallProgress);
      
      if (parallelGeneration && batch.length > 1) {
        setGenerationPhase(`Generating ${batch.length} chapters in parallel: ${batch.map(ch => ch.label).join(', ')}...`);
      } else {
        setGenerationPhase(`Generating ${batch[0].label}: ${batch[0].description}...`);
      }
      
      setChapterStartTime(Date.now());

      // Add headers for all chapters in batch
      for (const chapter of batch) {
        setAllGeneratedLines(prev => [...prev, { chapter: chapter.key, line: `\n━━━ ${chapter.label}: ${chapter.description} ━━━\n` }]);
        setLineCount(prev => prev + 1);
      }

      // Generate all chapters in batch simultaneously
      const batchPromises = batch.map(async (chapter) => {
        let content: string | null = null;
        
        if (generateInParts) {
          content = await generateChapterInParts(chapter.key);
        } else {
          content = await generateChapter(chapter.key);
        }
        
        return { key: chapter.key, label: chapter.label, content };
      });

      // Wait for all in batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Track timing
      const batchTime = Date.now() - (chapterStartTime || Date.now());
      times.push(batchTime);
      setChapterTimes(times);

      // Process results
      for (const result of batchResults) {
        if (result.content) {
          newContent[result.key] = result.content;
          setChapterContent(prev => {
            const updated = { ...prev, [result.key]: result.content };
            if (reportId) saveChapterToDb(reportId, updated);
            return updated;
          });
          
          // Show condensed output for parallel mode
          if (parallelGeneration && batch.length > 1) {
            const lineCount = result.content.split('\n').length;
            setAllGeneratedLines(prev => [...prev, { 
              chapter: result.key, 
              line: `✅ ${result.label} completed (${lineCount} lines)` 
            }]);
          } else {
            // Full typing effect for sequential mode
            const lines = result.content.split('\n');
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
              const line = lines[lineIndex];
              for (let charIndex = 0; charIndex <= line.length; charIndex += 5) {
                setCurrentLine(line.slice(0, charIndex));
                await new Promise(resolve => setTimeout(resolve, 1));
              }
              setAllGeneratedLines(prev => [...prev, { chapter: result.key, line }]);
              setLineCount(prev => prev + 1);
              setCurrentLine('');
            }
          }
          
          const completedCount = Object.keys(newContent).filter(k => newContent[k]).length;
          updateEstimatedTime(completedCount);
        } else {
          failed.push(result.key);
          setAllGeneratedLines(prev => [...prev, { chapter: result.key, line: `⚠️ Failed to generate ${result.label}` }]);
        }
      }

      setActiveChapters([]);

      // Small delay between batches to avoid rate limiting
      if (batchStart + BATCH_SIZE < chaptersToGenerate.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    setFailedChapters(failed);
    setGenerating(false);
    setCurrentChapter(null);
    setGenerationProgress(100);
    setGenerationPhase('');
    setCurrentLine('');
    setResumingReport(false);
    setEstimatedTimeRemaining(null);
    setChapterStartTime(null);
    setStopRequested(false);

    // Update report status to completed if all done (and not stopped)
    if (failed.length === 0 && reportId && !stopRequested) {
      try {
        await supabase
          .from('reports')
          .update({ status: 'completed' })
          .eq('id', reportId);
      } catch (e) {
        console.error('Error updating report status:', e);
      }
    }

    checkUserStatus();

    // Play sound notification when complete
    if (failed.length === 0 && !stopRequested) {
      playCompletionSound();
      toast({
        title: '🎉 Report generated successfully!',
        description: 'All chapters have been generated. Download your report now.',
      });
    } else if (stopRequested) {
      toast({
        title: 'Generation stopped',
        description: 'Your progress has been saved. You can resume later.',
      });
    } else if (failed.length < getChapters(formData.internshipTitle, reportKind).length) {
      playCompletionSound();
      toast({
        title: 'Report partially generated',
        description: `${getChapters(formData.internshipTitle, reportKind).length - failed.length} of ${getChapters(formData.internshipTitle, reportKind).length} chapters generated. You can retry failed chapters.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Retry failed chapters
  const handleRetryFailed = async () => {
    if (failedChapters.length === 0) return;

    setGenerating(true);
    const stillFailed: string[] = [];

    for (let i = 0; i < failedChapters.length; i++) {
      const chapterKey = failedChapters[i];
      const chapter = getChapters(formData.internshipTitle, reportKind).find(c => c.key === chapterKey);
      if (!chapter) continue;

      setCurrentChapter(chapterKey);
      setGenerationProgress(Math.round((i / failedChapters.length) * 100));
      setGenerationPhase(`Retrying ${chapter.label}: ${chapter.description}...`);

      const content = await generateChapter(chapterKey);
      
      if (content) {
        setChapterContent(prev => {
          const updated = { ...prev, [chapterKey]: content };
          // Save to database
          if (currentReportId) saveChapterToDb(currentReportId, updated);
          return updated;
        });
      } else {
        stillFailed.push(chapterKey);
      }

      if (i < failedChapters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setFailedChapters(stillFailed);
    setGenerating(false);
    setCurrentChapter(null);
    setGenerationProgress(100);
    setGenerationPhase('');

    if (stillFailed.length === 0) {
      // Update report status to completed
      if (currentReportId) {
        try {
          await supabase
            .from('reports')
            .update({ status: 'completed' })
            .eq('id', currentReportId);
        } catch (e) {
          console.error('Error updating report status:', e);
        }
      }
      
      toast({
        title: 'All chapters generated!',
        description: 'Your report is now complete.',
      });
    } else {
      toast({
        title: 'Some chapters still failed',
        description: `${stillFailed.length} chapter(s) could not be generated.`,
        variant: 'destructive',
      });
    }
  };

  // Clean up asterisks and formatting from content
  const cleanContent = (content: string): string => {
    return content
      .replace(/\*\*\*/g, '') // Remove triple asterisks
      .replace(/\*\*/g, '')   // Remove double asterisks (bold markers)
      .replace(/\*/g, '')      // Remove single asterisks (italic markers)
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/`/g, '')       // Remove backticks
      .trim();
  };

  // Fetch an AI-generated image as buffer
  const fetchImageAsBuffer = async (keyword: string, index: number): Promise<{ buffer: ArrayBuffer; type: 'png' | 'jpg' } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-report-image', {
        body: { keyword, index },
      });
      if (error || !data?.image) return null;
      const binaryStr = atob(data.image);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      // Detect image type from first bytes
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      return { buffer: bytes.buffer, type: isPng ? 'png' : 'jpg' };
    } catch {
      return null;
    }
  };

  // Get topic-related image keywords
  const getImageKeywords = (): string[] => {
    const title = formData.internshipTitle.toLowerCase();
    const specialization = title.split(' ').slice(0, 3).join(' ');
    return [
      specialization,
      `${specialization} workplace`,
      `${title.split(' ')[0]} technology`,
      'internship student learning',
      'business office professional',
      'corporate team meeting',
      'data analysis computer',
      'project management workflow',
      'presentation skills training',
      'industry workplace modern',
      'digital technology innovation',
      'professional development career',
    ].slice(0, 10);
  };

  // Download full merged report
  const downloadFullReport = async (bnuFormat: boolean = false) => {
    if (!hasAnyContent) return;

    // Fetch 10 topic-related images
    toast({
      title: 'Preparing report...',
      description: 'Generating AI images for your report. This may take a moment.',
    });

    const keywords = getImageKeywords();
    const imagePromises = keywords.map((kw, i) => fetchImageAsBuffer(kw, i));
    const imageResults = (await Promise.all(imagePromises)).filter(Boolean) as { buffer: ArrayBuffer; type: 'png' | 'jpg' }[];

    // Merge all chapters in order and clean up asterisks
    const orderedContent = getChapters(formData.internshipTitle, reportKind)
      .map(ch => chapterContent[ch.key] ? cleanContent(chapterContent[ch.key]!) : null)
      .filter(Boolean)
      .join('\n\n---\n\n');

    const sections = orderedContent.split('\n\n');
    const children: (Paragraph | Table)[] = [];

    // Title page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: formData.university.toUpperCase(), bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: formData.collegeName, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: reportKind === 'thesis'
            ? 'THESIS / DISSERTATION'
            : reportKind === 'project'
              ? 'PROJECT REPORT'
              : (bnuFormat ? 'INTERNSHIP REPORT' : 'INTERNSHIP PROJECT REPORT'),
          bold: true, size: 36 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `On`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `"${formData.internshipTitle}"`, bold: true, size: 28, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Submitted by`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: formData.studentName, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Register No: ${formData.registerNumber}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Under the guidance of`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: formData.guideName, bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${formData.course}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Academic Year: ${formData.academicYear}`, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Certificate page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'CERTIFICATE', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `This is to certify that ${formData.studentName} (Register No: ${formData.registerNumber}) of ${formData.course}, ${formData.collegeName}, has successfully completed the Internship Project Report titled "${formData.internshipTitle}" at ${formData.companyName} during the academic year ${formData.academicYear}, under the guidance of ${formData.guideName}.`, size: 24 })],
        spacing: { after: 600 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Guide', bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: formData.guideName, size: 24 })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Head of Department', bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '________________________', size: 24 })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'External Examiner', bold: true, size: 24 })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '________________________', size: 24 })],
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Declaration page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'DECLARATION', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `I, ${formData.studentName}, hereby declare that the Internship Project Report titled "${formData.internshipTitle}" submitted to ${formData.university} is a record of original work done by me during my internship at ${formData.companyName}, under the guidance of ${formData.guideName}. This report has not been submitted to any other university or institution for the award of any degree or diploma.`, size: 24 })],
        spacing: { after: 600 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `Place: ________________________`, size: 24 })],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Date: ________________________`, size: 24 })],
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: formData.studentName, bold: true, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `Register No: ${formData.registerNumber}`, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Acknowledgement page
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'ACKNOWLEDGEMENT', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `I would like to express my sincere gratitude to my guide ${formData.guideName} for the continuous support, guidance, and encouragement throughout the internship period.`, size: 24 })],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `I am grateful to ${formData.collegeName}, ${formData.university} for providing me with the opportunity to undertake this internship.`, size: 24 })],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `I also extend my thanks to ${formData.companyName} for allowing me to carry out my internship and for providing the necessary resources and environment to learn and grow.`, size: 24 })],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: `Finally, I would like to thank my family and friends for their constant support and motivation.`, size: 24 })],
        spacing: { after: 600 },
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [new TextRun({ text: formData.studentName, bold: true, size: 24 })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Track image insertion points
    let imageIndex = 0;
    const imageInsertAfterHeadings = new Set([1, 2, 4, 5, 7, 8, 10, 11, 13, 15]);
    let headingCount = 0;

    // Parse and add content with images
    sections.forEach(section => {
      if (section.trim() && section.trim() !== '---') {
        const trimmed = section.trim();
        const isH1 = trimmed.startsWith('# ');
        const isH2 = trimmed.startsWith('## ');
        const isH3 = trimmed.startsWith('### ');
        const isH4 = trimmed.startsWith('#### ');
        const isChapterHeading = (text: string) => /chapter\s/i.test(text);
        const isFrontMatterHeading = (text: string) => /^(EXECUTIVE SUMMARY|ABSTRACT|TABLE OF CONTENTS|LIST OF|BIBLIOGRAPHY|ANNEXURES)/i.test(text);

        // Markdown table detection: lines starting with | and a separator row containing ---
        const sectionLines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const looksLikeTable =
          sectionLines.length >= 2 &&
          sectionLines[0].startsWith('|') &&
          /^\|?\s*:?-{2,}/.test(sectionLines[1].replace(/\|/g, '|'));

        if (looksLikeTable) {
          const parseRow = (line: string) =>
            line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
          const headerCells = parseRow(sectionLines[0]);
          const bodyRows = sectionLines.slice(2).filter(l => l.startsWith('|')).map(parseRow);
          const colCount = headerCells.length;
          const tableWidth = 9360;
          const colWidth = Math.floor(tableWidth / colCount);
          const columnWidths = Array(colCount).fill(colWidth);
          const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
          const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
          const makeCell = (text: string, header: boolean) => new TableCell({
            borders: cellBorders,
            width: { size: colWidth, type: WidthType.DXA },
            shading: header ? { fill: 'E8EEF7', type: ShadingType.CLEAR, color: 'auto' } : undefined,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text, bold: header, size: 22 })] })],
          });
          const rows = [
            new TableRow({ children: headerCells.map(c => makeCell(c, true)) }),
            ...bodyRows.map(r => new TableRow({
              children: Array.from({ length: colCount }, (_, i) => makeCell(r[i] ?? '', false)),
            })),
          ];
          children.push(new Table({
            width: { size: tableWidth, type: WidthType.DXA },
            columnWidths,
            rows,
          }));
          children.push(new Paragraph({ children: [new TextRun({ text: '', size: 20 })], spacing: { after: 200 } }));
          return;
        }


        if (isH1 || isH2) {
          const headingText = trimmed.replace(/^#{1,2}\s/, '');
          headingCount++;
          // Add page break before each chapter
          if (isH1 && (isChapterHeading(headingText) || isFrontMatterHeading(headingText))) {
            children.push(new Paragraph({ children: [new PageBreak()] }));
          }
          children.push(
            new Paragraph({
              children: [new TextRun({ text: headingText, bold: true, underline: { type: 'single' }, size: 28 })],
              heading: isH1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
              spacing: { before: isH1 ? 400 : 300, after: isH1 ? 200 : 150 },
              alignment: isH1 ? AlignmentType.CENTER : AlignmentType.LEFT,
            })
          );
          // Insert image after certain headings
          if (imageInsertAfterHeadings.has(headingCount) && imageIndex < imageResults.length) {
            const img = imageResults[imageIndex];
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: img.buffer,
                    transformation: { width: 500, height: 312 },
                    type: img.type,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `Figure ${imageIndex + 1}`, italics: true, size: 20, color: '666666' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              })
            );
            imageIndex++;
          }
        } else if (isH3) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, underline: { type: 'single' }, size: 28 })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (isH4) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed.replace('#### ', ''), bold: true, italics: true, size: 28 })],
              heading: HeadingLevel.HEADING_4,
              spacing: { before: 160, after: 80 },
            })
          );
        } else if (/^\d+[\.\)]\s/.test(trimmed)) {
          // Numbered lists
          const numberMatch = trimmed.match(/^(\d+[\.\)])\s(.*)/)!;
          const numberLabel = numberMatch[1];
          const itemText = numberMatch[2];
          const colonIdx = itemText.indexOf(':');
          if (colonIdx > 0 && colonIdx < 60) {
            const keyPart = itemText.substring(0, colonIdx + 1);
            const valuePart = itemText.substring(colonIdx + 1);
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${numberLabel} `, size: 24 }),
                  new TextRun({ text: keyPart, bold: true, size: 24 }),
                  new TextRun({ text: valuePart, size: 24 }),
                ],
                spacing: { after: 120 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 720 },
              })
            );
          } else {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${numberLabel} `, size: 24 }),
                  new TextRun({ text: itemText, size: 24 }),
                ],
                spacing: { after: 120 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 720 },
              })
            );
          }
        } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          // Bullet points - highlight with bold bullet marker
          const bulletText = trimmed.replace(/^[•\-\*]\s/, '');
          // Check if bullet has a colon (key: value pattern) - bold the key part
          const colonIndex = bulletText.indexOf(':');
          if (colonIndex > 0 && colonIndex < 60) {
            const keyPart = bulletText.substring(0, colonIndex + 1);
            const valuePart = bulletText.substring(colonIndex + 1);
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '• ', size: 24 }),
                  new TextRun({ text: keyPart, bold: true, size: 24 }),
                  new TextRun({ text: valuePart, size: 24 }),
                ],
                spacing: { after: 120 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 720 },
              })
            );
          } else {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '• ', size: 24 }),
                  new TextRun({ text: bulletText, size: 24 }),
                ],
                spacing: { after: 120 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: 720 },
              })
            );
          }
        } else {
          // Parse inline bold (**text**) and render with bold TextRuns
          const boldPattern = /\*\*(.*?)\*\*/g;
          const parts: { text: string; bold: boolean }[] = [];
          let lastIndex = 0;
          let match;
          while ((match = boldPattern.exec(trimmed)) !== null) {
            if (match.index > lastIndex) {
              parts.push({ text: trimmed.slice(lastIndex, match.index), bold: false });
            }
            parts.push({ text: match[1], bold: true });
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < trimmed.length) {
            parts.push({ text: trimmed.slice(lastIndex), bold: false });
          }
          children.push(
            new Paragraph({
              children: parts.map(p => new TextRun({ text: p.text, bold: p.bold, size: 24 })),
              spacing: { after: 200 },
              alignment: AlignmentType.JUSTIFIED,
            })
          );
        }
      }
    });

    // Line spacing 1.5 is set via default document style below

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: bnuFormat ? { font: 'Times New Roman', size: 24 } : undefined,
            paragraph: {
              spacing: { line: 360 }, // 1.5 line spacing
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new TextRun({ text: formData.internshipTitle, bold: true, size: 20 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: formData.studentName, size: 18 }),
                  new TextRun({ text: '\t\t' }),
                  new TextRun({ text: 'Page ' }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                ],
                tabStops: [
                  { type: 'right' as any, position: 9360 },
                ],
              }),
            ],
          }),
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `${formData.studentName.replace(/\s+/g, '_')}_Internship_Report.docx`;
    saveAs(blob, filename);

    toast({
      title: 'Downloaded!',
      description: `Your report has been downloaded with ${imageIndex} topic-related images.`,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen hero-gradient ${kindTheme.className}`}>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <KindIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">InternReport.in</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 rounded-2xl kind-surface border border-primary/20 p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <KindIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent text-accent-foreground mb-1">
                {kindTheme.shortLabel} mode
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">{kindTheme.label}</h1>
              <p className="text-muted-foreground text-sm mt-1">{kindTheme.tagline}</p>
            </div>
          </div>
        </div>

        {/* Quick-start shortcuts (same as home page) */}
        <div className="mb-8 -mx-4">
          <GenerateShortcuts />
        </div>

        {hasAnyContent ? (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <KindIcon className="w-5 h-5 text-primary" />
                {kindTheme.progressTitle}
              </CardTitle>
              <CardDescription>
                {hasAllContent 
                  ? `All ${kindTheme.unitPlural} generated! Download your complete ${kindTheme.label.toLowerCase()}.`
                  : `${completedChapters.length} of ${getChapters(formData.internshipTitle, reportKind).length} ${kindTheme.unitPlural} generated. ${kindTheme.progressHint}`}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Chapter Generation Grid - Individual Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getChapters(formData.internshipTitle, reportKind).map(chapter => {
                  const isCompleted = !!chapterContent[chapter.key];
                  const isCurrent = currentChapter === chapter.key;
                  const isFailed = failedChapters.includes(chapter.key);
                  
                  return (
                    <div 
                      key={chapter.key}
                      className={`p-3 rounded-xl border ${
                        isCompleted 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                          : isCurrent
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 animate-pulse'
                          : isFailed
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                            {isCurrent && <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />}
                            {isFailed && !isCompleted && <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                            {!isCompleted && !isCurrent && !isFailed && <div className="w-4 h-4 rounded-full bg-muted flex-shrink-0" />}
                            <span className="font-semibold text-sm">{chapter.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{chapter.description}</p>
                        </div>
                        <Button
                          variant={isCompleted ? "outline" : isFailed ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleRetrySingleChapter(chapter.key)}
                          disabled={generating || isCurrent}
                          className="flex-shrink-0"
                        >
                          {isCurrent ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isCompleted ? (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Redo
                            </>
                          ) : isFailed ? (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Retry
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 mr-1" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Generate All Button */}
              {!hasAllContent && !generating && (
                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="default"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setResumingReport(completedChapters.length > 0);
                      handleGenerateReport();
                    }}
                    disabled={generating}
                  >
                    <Sparkles className="w-5 h-5" />
                    {completedChapters.length > 0 
                      ? `Generate All Remaining (${getChapters(formData.internshipTitle, reportKind).length - completedChapters.length} chapters)`
                      : `Generate All Chapters (${getChapters(formData.internshipTitle, reportKind).length} chapters)`
                    }
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Or generate individual chapters above
                  </p>
                </div>
              )}

              {/* Progress indicator during generation */}
              {generating && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">Generating Report</p>
                      <p className="text-xs text-muted-foreground">{generationPhase}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-primary">{generationProgress}%</p>
                      {estimatedTimeRemaining && (
                        <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                          <Timer className="w-3 h-3" />
                          {estimatedTimeRemaining} remaining
                        </p>
                      )}
                    </div>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                  
                  {/* AI Thinking Timer Popup */}
                  {isApiCalling && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-lg p-4 animate-pulse">
                      <div className="flex items-center justify-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-amber-600">{thinkingSeconds}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                            🧠 AI is thinking...
                          </p>
                          <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                            Please wait {thinkingSeconds < 30 ? `for ~${Math.max(30 - thinkingSeconds, 5)}s` : 'a moment'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Live Content Preview Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                    <span className="text-xs text-muted-foreground">Live Preview</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      className="h-6 px-2"
                    >
                      {showLivePreview ? (
                        <><EyeOff className="w-3 h-3 mr-1" /> Hide</>
                      ) : (
                        <><Eye className="w-3 h-3 mr-1" /> Show</>
                      )}
                    </Button>
                  </div>

                  {/* Live Generated Content Display - All Chapters */}
                  {showLivePreview && (allGeneratedLines.length > 0 || currentLine) && (
                    <div className="mt-3 bg-background/50 rounded-lg border border-border/50 overflow-hidden">
                      <div className="bg-muted/50 px-3 py-1.5 border-b border-border/50 flex items-center gap-2 flex-wrap">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {getChapters(formData.internshipTitle, reportKind).find(c => c.key === currentChapter)?.label}
                          {currentPart && <span className="text-primary ml-1">→ {currentPart}</span>}
                        </span>
                        {generateInParts && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">Parts Mode</span>
                        )}
                        <span className="ml-auto text-xs text-muted-foreground/60">
                          {lineCount.toLocaleString()} lines
                        </span>
                      </div>
                      <ScrollArea className="h-80">
                        <div className="p-3 font-mono text-xs leading-relaxed text-foreground/80">
                          {allGeneratedLines.map((item, idx) => (
                            <div 
                              key={idx} 
                              className={`${item.line.includes('━━━') ? 'text-primary font-bold mt-4 mb-2' : ''} ${item.line.includes('⚠️') ? 'text-amber-500' : ''}`}
                            >
                              {item.line}
                            </div>
                          ))}
                          {currentLine && (
                            <div className="inline">
                              {currentLine}
                              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle" />
                            </div>
                          )}
                          <div ref={scrollRef} className="h-1" />
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {/* Fun Status Messages */}
                  {funMessage && (
                    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-lg p-3 border border-primary/10">
                      <p className="text-sm text-center font-medium text-foreground/80 animate-pulse">
                        {funMessage}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                      This may take 5-10 minutes. Please keep this page open.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStopGeneration}
                      disabled={stopRequested}
                      className="flex items-center gap-1"
                    >
                      <Square className="w-3 h-3" />
                      {stopRequested ? 'Stopping...' : 'Stop'}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60 justify-center">
                    <Volume2 className="w-3 h-3" />
                    <span>Sound notification when complete</span>
                  </div>
                </div>
              )}


              {/* Quality gate + download — only when ALL chapters are complete */}
              {hasAllContent && !generating && (
                <div className="space-y-3">
                  <QualityGate chapters={chapterContent as Record<string, string>} onResult={setQualityPassed} />
                  <Button
                    variant="default"
                    onClick={() => downloadFullReport(false)}
                    className="w-full"
                    size="lg"
                    disabled={!qualityPassed}
                  >
                    <Download className="w-5 h-5" />
                    Download Complete Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadFullReport(true)}
                    className="w-full"
                    size="sm"
                    disabled={!qualityPassed}
                  >
                    <Download className="w-4 h-4" />
                    Download BNU Format (B.Com / BBA)
                  </Button>
                  {!qualityPassed && (
                    <p className="text-xs text-center text-muted-foreground">
                      Downloads unlock once the quality check passes.
                    </p>
                  )}
                </div>
              )}

              
              {/* Progress message if not all chapters are done */}
              {hasAnyContent && !hasAllContent && !generating && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ {completedChapters.length}/{getChapters(formData.internshipTitle, reportKind).length} chapters generated. 
                    Complete all chapters to download the report.
                  </p>
                </div>
              )}

              <Button 
                variant="outline" 
                onClick={() => {
                  setChapterContent({});
                  setFailedChapters([]);
                  setCurrentReportId(null);
                  setResumingReport(false);
                  setAllGeneratedLines([]);
                  setLineCount(0);
                  setFormData(initialFormData);
                }} 
                className="w-full"
                disabled={generating}
              >
                Create Another Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <KindIcon className="w-5 h-5 text-primary" />
                {kindFields.sectionTitle}
              </CardTitle>
              <CardDescription>
                {kindFields.sectionHint}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-6">
                {/* Student Information */}
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg">Student Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName">Full Name *</Label>
                      <Input
                        id="studentName"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registerNumber">Register Number *</Label>
                      <Input
                        id="registerNumber"
                        name="registerNumber"
                        value={formData.registerNumber}
                        onChange={handleInputChange}
                        placeholder="Enter your register number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course *</Label>
                      <Input
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        placeholder="Enter your course"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year *</Label>
                      <Input
                        id="academicYear"
                        name="academicYear"
                        value={formData.academicYear}
                        onChange={handleInputChange}
                        placeholder="Enter academic year"
                      />
                    </div>
                  </div>
                </div>

                {/* Institution Details */}
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg">Institution Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collegeName">College Name *</Label>
                      <Input
                        id="collegeName"
                        name="collegeName"
                        value={formData.collegeName}
                        onChange={handleInputChange}
                        placeholder="Enter your college name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University *</Label>
                      <Input
                        id="university"
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        placeholder="Enter your university name"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="guideName">Guide/Supervisor Name *</Label>
                      <Input
                        id="guideName"
                        name="guideName"
                        value={formData.guideName}
                        onChange={handleInputChange}
                        placeholder="Enter guide/supervisor name"
                      />
                    </div>
                  </div>
                </div>

                {/* Report-kind specific details */}
                <div className="space-y-4">
                  <h3 className="font-display font-semibold text-lg">{kindFields.detailsHeading}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="internshipTitle">{kindFields.titleLabel}</Label>
                      <Input
                        id="internshipTitle"
                        name="internshipTitle"
                        value={formData.internshipTitle}
                        onChange={handleInputChange}
                        placeholder={kindFields.titlePlaceholder}
                      />
                    </div>
                    <div className={kindFields.showCompany ? 'space-y-2' : 'space-y-2 md:col-span-2'}>
                      <Label htmlFor="companyName">{kindFields.orgLabel}</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder={kindFields.orgPlaceholder}
                      />
                    </div>
                    {kindFields.showCompany && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="companyLocation">Company Location *</Label>
                          <Input
                            id="companyLocation"
                            name="companyLocation"
                            value={formData.companyLocation}
                            onChange={handleInputChange}
                            placeholder="Enter company location"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="internshipDuration">Internship Duration *</Label>
                          <Input
                            id="internshipDuration"
                            name="internshipDuration"
                            value={formData.internshipDuration}
                            onChange={handleInputChange}
                            placeholder="Enter internship duration"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topicSpecialization">{kindFields.topicLabel}</Label>
                    <Textarea
                      id="topicSpecialization"
                      name="topicSpecialization"
                      value={formData.topicSpecialization}
                      onChange={handleInputChange}
                      placeholder={kindFields.topicPlaceholder}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Status & Action Section */}
                {checkingStatus ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Checking your status...</span>
                  </div>
                ) : needsTopup ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="w-6 h-6 text-amber-600" />
                      </div>
                      <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 mb-3 inline-block">
                        <span className="font-bold text-lg">1/1 Generations Used</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Generation Limit Reached</h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        You have reached your limit of 1 free report generation. Top up to continue generating reports.
                      </p>
                      <div className="bg-primary/10 rounded-lg p-4 mb-4">
                        <p className="font-display text-2xl font-bold text-primary">₹499</p>
                        <p className="text-xs text-muted-foreground">for 3 more generations</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={handleTopupPayment}
                    >
                      <CreditCard className="w-5 h-5" />
                      Top Up - ₹499
                    </Button>
                  </div>
                ) : paymentStatus === 'pending' ? (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">Payment Under Review</h3>
                    <p className="text-muted-foreground text-sm">
                      Your payment has been submitted and is being verified. Once approved, you can generate reports.
                      This usually takes less than 24 hours.
                    </p>
                  </div>
                ) : canGenerate ? (
                  <div className="space-y-4">
                    <div className={`rounded-xl p-4 flex items-center gap-3 ${hasApprovedPayment ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'}`}>
                      <CheckCircle2 className={`w-5 h-5 ${hasApprovedPayment ? 'text-emerald-600' : 'text-blue-600'}`} />
                      <div>
                        <p className={`font-semibold ${hasApprovedPayment ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'}`}>
                          {hasApprovedPayment ? 'Ready to Generate' : 'Free Trial - 1 Report (Till Chapter 4)'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hasApprovedPayment ? `${generationsUsed} generations used` : 'No payment needed for your first report'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
                        📋 Your report will include:
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {(hasApprovedPayment ? getChapters(formData.internshipTitle, reportKind) : getChapters(formData.internshipTitle, reportKind).filter(ch => ch.key !== '5')).map(ch => (
                          <div key={ch.key}>• {ch.label}</div>
                        ))}
                      </div>
                      {!hasApprovedPayment && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          ⚠️ Bibliography excluded in free trial. Top up ₹499 for full reports.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        ⏱️ Generation takes 5-10 minutes. Please keep this page open.
                      </p>
                    </div>
                    
                    {/* Fast Parallel Generation Toggle */}
                    <div className={`flex items-center justify-between rounded-lg p-3 border transition-all ${parallelGeneration ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 border-border/50'}`}>
                      <div className="flex items-center gap-2 flex-1">
                        <Sparkles className={`w-4 h-4 ${parallelGeneration ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-medium">⚡ Fast Mode (3x Speed)</p>
                          <p className="text-xs text-muted-foreground">
                            Generate 3 chapters simultaneously
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!parallelGeneration && (
                          <span className="text-xs text-primary font-medium animate-pulse flex items-center gap-1">
                            Turn on →
                          </span>
                        )}
                        <Switch
                          checked={parallelGeneration}
                          onCheckedChange={setParallelGeneration}
                        />
                      </div>
                    </div>

                    {/* Slow Connection Mode Toggle */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center gap-2 flex-1">
                        <Wifi className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Slow Connection Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Generate in smaller parts to avoid timeouts
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={generateInParts}
                        onCheckedChange={setGenerateInParts}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="w-full min-h-[56px]"
                      onClick={handleGenerateReport}
                      disabled={generating}
                    >
                      {generating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                          <span className="text-sm truncate max-w-[250px]">
                            {funMessage || "🚀 Starting generation..."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Complete Report
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-muted-foreground">Report Price:</span>
                        <div className="text-right">
                          <span className="font-display text-3xl font-bold text-primary">₹{calculatePrice()}</span>
                          <p className="text-xs text-muted-foreground">One-time payment</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>✓ AI-powered professional report</p>
                        <p>{kindFields.pitch}</p>
                        <p>✓ 3 report generations included</p>
                        <p>✓ Instant download as DOCX</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate('/subscription')}
                    >
                      <CreditCard className="w-5 h-5" />
                      Proceed to Payment
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Payment Modal */}
      <TopupDialog open={showPaymentModal} onOpenChange={setShowPaymentModal} onSuccess={checkUserStatus} />
    </div>
  );
};

export default CreateReport;
