import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Loader2, Download, Sparkles, Lock, CheckCircle2, RotateCcw, CreditCard, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Header, Footer, PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle, LevelFormat } from 'docx';
import { saveAs } from 'file-saver';
import Layout from '@/components/Layout';
import Seo, { SITE_URL } from "@/components/Seo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TopupDialog from '@/components/TopupDialog';


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

const chapters = [
  { key: 'front', label: 'Front Matter', description: 'Declaration, Certificate, Acknowledgement, Executive Summary, TOC' },
  { key: '1', label: 'Chapter 1', description: 'Introduction — topic, department, features, advantages (8-10 pages)' },
  { key: '2', label: 'Chapter 2', description: 'Description of the Company (8-12 pages)' },
  { key: '3', label: 'Chapter 3', description: 'Experiential Learning — Tasks, Skills, Challenges (bullets, 6-10 pages)' },
  { key: '4', label: 'Chapter 4', description: 'Outcomes, Findings, Suggestions, Conclusion (bullets, 6-10 pages)' },
  { key: '5', label: 'Bibliography', description: 'One-page reference list (APA)' },
];

interface Report {
  id: string;
  form_data: FormData;
  chapter_content: Record<string, string>;
  status: string;
  created_at: string;
  report_type: string;
}

const CreateReport = () => {
  const { user, loading: authLoading, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generating, setGenerating] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<Record<string, string | null>>({});
  const [generationProgress, setGenerationProgress] = useState(0);
  const [reportCredits, setReportCredits] = useState(0);
  const [freeUsed, setFreeUsed] = useState(0);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [previousReports, setPreviousReports] = useState<Report[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPro = profile?.subscription_status === 'active';
  const FREE_LIMIT = isPro ? 3 : 1;
  const aiCredits = (profile as any)?.ai_credits ?? 0;

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadCreditsAndReports();
    }
  }, [user, profile]);


  const loadCreditsAndReports = async () => {
    const { count } = await supabase
      .from('report_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('report_type', 'full');
    setFreeUsed(count || 0);

    const { data: prof } = await supabase
      .from('profiles')
      .select('report_credits, ai_credits')
      .eq('user_id', user!.id)
      .single();
    setReportCredits((prof as any)?.report_credits || 0);

    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (reports) setPreviousReports(reports as any);
  };

  const canGenerate = freeUsed < FREE_LIMIT || reportCredits > 0 || aiCredits > 0;

  const consumeCredit = async () => {
    if (freeUsed < FREE_LIMIT) {
      await supabase.from('report_generations').insert({
        user_id: user!.id,
        report_type: 'full',
        form_data: formData as any,
      });
      return true;
    } else if (reportCredits > 0) {
      await supabase
        .from('profiles')
        .update({ report_credits: reportCredits - 1 })
        .eq('user_id', user!.id);
      await supabase.from('report_generations').insert({
        user_id: user!.id,
        report_type: 'full',
        form_data: formData as any,
      });
      return true;
    } else if (aiCredits > 0) {
      // Deduct from global AI credits pool via edge function (DB trigger blocks client writes)
      const { data, error } = await supabase.functions.invoke('consume-ai-credit', {
        body: { tool_key: 'full' },
      });
      if (error || !(data as any)?.success) return false;
      await refreshProfile();
      await supabase.from('report_generations').insert({
        user_id: user!.id,
        report_type: 'full',
        form_data: formData as any,
      });
      return true;
    }
    return false;
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'pagesCount' ? parseInt(value) || 25 : value }));
  };

  const validateForm = () => {
    const required = ['studentName', 'registerNumber', 'course', 'collegeName', 'university', 'guideName', 'internshipTitle', 'companyName', 'companyLocation', 'internshipDuration', 'academicYear', 'topicSpecialization'];
    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        toast.error('Please fill in all required fields');
        return false;
      }
    }
    return true;
  };

  const saveReportProgress = async (reportId: string, content: Record<string, string | null>, status: string) => {
    await supabase
      .from('reports')
      .update({
        chapter_content: content as any,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
  };

  const generateReport = async (resumeFromReport?: Report) => {
    if (!resumeFromReport && !validateForm()) return;

    if (!resumeFromReport && !canGenerate) {
      setShowTopup(true);
      return;
    }

    setGenerating(true);

    let reportId = resumeFromReport?.id || currentReportId;
    let existingContent: Record<string, string | null> = resumeFromReport?.chapter_content as any || {};

    if (!resumeFromReport) {
      // Consume credit and create report record
      const credited = await consumeCredit();
      if (!credited) {
        setShowTopup(true);
        setGenerating(false);
        return;
      }

      const { data: newReport } = await supabase
        .from('reports')
        .insert({
          user_id: user!.id,
          report_type: 'full',
          form_data: formData as any,
          chapter_content: {} as any,
          status: 'generating',
        })
        .select()
        .single();

      reportId = newReport?.id || null;
      existingContent = {};
    } else {
      // Resuming — restore form data
      setFormData(resumeFromReport.form_data);
      existingContent = resumeFromReport.chapter_content || {};
    }

    setCurrentReportId(reportId);
    setChapterContent(existingContent);
    setGenerationProgress(0);

    const formToUse = resumeFromReport?.form_data || formData;

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];

      // Skip already generated chapters
      if (existingContent[ch.key]) {
        setGenerationProgress(((i + 1) / chapters.length) * 100);
        continue;
      }

      setCurrentChapter(ch.key);
      setGenerationProgress((i / chapters.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke('generate-report-content', {
          body: {
            mode: 'full',
            chapter: ch.key,
            ...formToUse,
          },
        });

        if (error) throw error;

        const content = data?.content || '';
        existingContent[ch.key] = content;
        setChapterContent({ ...existingContent });

        // Save progress after each chapter
        if (reportId) {
          await saveReportProgress(reportId, existingContent, 'generating');
        }
      } catch (err: any) {
        console.error(`Error generating ${ch.label}:`, err);
        toast.error(`Failed to generate ${ch.label}. You can resume later.`);

        // Mark as interrupted
        if (reportId) {
          await saveReportProgress(reportId, existingContent, 'interrupted');
        }

        setGenerating(false);
        setCurrentChapter(null);
        loadCreditsAndReports();
        return;
      }
    }

    // Mark as completed
    if (reportId) {
      await saveReportProgress(reportId, existingContent, 'completed');
    }

    setGenerationProgress(100);
    setCurrentChapter(null);
    setGenerating(false);
    toast.success('Report generated successfully!');
    loadCreditsAndReports();
  };

  const downloadDocx = async (content?: Record<string, string>, formOverride?: FormData) => {
    const useContent = content || chapterContent;
    const useForm = formOverride || formData;

    const hasAny = chapters.some(ch => useContent[ch.key]);
    if (!hasAny) {
      toast.error('No content to download');
      return;
    }

    const FONT = 'Times New Roman';
    const LINE = 360; // 1.5 line spacing

    const makeTextRun = (text: string, opts: { bold?: boolean; size?: number; italics?: boolean } = {}) =>
      new TextRun({ text, font: FONT, size: opts.size ?? 24, bold: opts.bold, italics: opts.italics });

    const buildTable = (rows: string[][]) => {
      const colCount = Math.max(...rows.map(r => r.length));
      const totalWidth = 9000;
      const colWidth = Math.floor(totalWidth / colCount);
      const border = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
      const borders = { top: border, bottom: border, left: border, right: border };
      return new Table({
        width: { size: totalWidth, type: WidthType.DXA },
        columnWidths: Array(colCount).fill(colWidth),
        rows: rows.map((cells, rIdx) => new TableRow({
          children: Array.from({ length: colCount }).map((_, cIdx) => new TableCell({
            borders,
            width: { size: colWidth, type: WidthType.DXA },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            shading: rIdx === 0 ? { fill: 'E7E6E6', type: 'clear' as any, color: 'auto' } : undefined,
            children: [new Paragraph({
              spacing: { line: LINE },
              children: [makeTextRun(cells[cIdx] || '', { bold: rIdx === 0, size: 22 })],
            })],
          })),
        })),
      });
    };

    const parseChapter = (raw: string): (Paragraph | Table)[] => {
      const out: (Paragraph | Table)[] = [];
      const lines = raw.split('\n');
      let i = 0;
      let pendingBullets: string[] = [];
      let pendingTable: string[][] = [];

      const flushBullets = () => {
        for (const b of pendingBullets) {
          out.push(new Paragraph({
            numbering: { reference: 'report-bullets', level: 0 },
            spacing: { after: 80, line: LINE },
            children: [makeTextRun(b)],
          }));
        }
        pendingBullets = [];
      };
      const flushTable = () => {
        if (pendingTable.length) {
          out.push(buildTable(pendingTable));
          out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
          pendingTable = [];
        }
      };

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Pipe table row
        if (/^\|.*\|$/.test(trimmed)) {
          flushBullets();
          // Skip markdown separator row like |---|---|
          if (!/^\|[\s\-:|]+\|$/.test(trimmed)) {
            const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
            pendingTable.push(cells);
          }
          i++;
          continue;
        } else {
          flushTable();
        }

        // Bullet
        if (/^[-•]\s+/.test(trimmed)) {
          pendingBullets.push(trimmed.replace(/^[-•]\s+/, ''));
          i++;
          continue;
        } else {
          flushBullets();
        }

        if (!trimmed) {
          out.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
          i++;
          continue;
        }

        // Headings
        if (/^(CHAPTER\s|STUDENT DECLARATION|CERTIFICATE|ACKNOWLEDGEMENT|EXECUTIVE SUMMARY|TABLE OF CONTENTS|BIBLIOGRAPHY)/i.test(trimmed)) {
          out.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 240, line: LINE },
            children: [makeTextRun(trimmed.toUpperCase(), { bold: true, size: 32 })],
          }));
        } else if (/^\d+\.\d+\.\d+/.test(trimmed)) {
          out.push(new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 120, line: LINE },
            children: [makeTextRun(trimmed, { bold: true, size: 24 })],
          }));
        } else if (/^\d+\.\d+\s/.test(trimmed)) {
          out.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 140, line: LINE },
            children: [makeTextRun(trimmed, { bold: true, size: 26 })],
          }));
        } else {
          out.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 140, line: LINE },
            children: [makeTextRun(trimmed)],
          }));
        }
        i++;
      }
      flushBullets();
      flushTable();
      return out;
    };

    const children: (Paragraph | Table)[] = [];

    // Title page
    children.push(
      new Paragraph({ spacing: { before: 3000 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [makeTextRun(useForm.internshipTitle.toUpperCase(), { bold: true, size: 36 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [makeTextRun('INTERNSHIP REPORT', { bold: true, size: 28 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600 }, children: [makeTextRun('Submitted by', { size: 24 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [makeTextRun(useForm.studentName, { bold: true, size: 26 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [makeTextRun(`Register Number: ${useForm.registerNumber}`, { size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [makeTextRun(useForm.course, { size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [makeTextRun(useForm.collegeName, { size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100 }, children: [makeTextRun(useForm.university, { size: 22 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [makeTextRun(`Academic Year: ${useForm.academicYear}`, { size: 22 })] }),
      new Paragraph({ children: [new PageBreak()] }),
    );

    // Each chapter on a NEW page
    chapters.forEach((ch, idx) => {
      const raw = useContent[ch.key];
      if (!raw) return;
      const parsed = parseChapter(raw);
      children.push(...parsed);
      if (idx < chapters.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });

    const doc = new Document({
      styles: {
        default: { document: { run: { font: FONT, size: 24 } } },
      },
      numbering: {
        config: [{
          reference: 'report-bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        }],
      },
      sections: [{
        properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } } },
        headers: {
          default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [makeTextRun(useForm.collegeName, { italics: true, size: 18 })] })] }),
        },
        footers: {
          default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, font: FONT })] })] }),
        },
        children,
      }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${useForm.studentName.replace(/\s+/g, '_')}_Internship_Report.docx`);
    toast.success('Report downloaded!');
  };

  const completedChapters = Object.keys(chapterContent).filter(k => chapterContent[k]);
  const hasAnyContent = completedChapters.length > 0;
  const hasAllContent = chapters.every(ch => chapterContent[ch.key]);
  const remainingFree = Math.max(0, FREE_LIMIT - freeUsed);
  const totalCredits = remainingFree + reportCredits + aiCredits;


  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  return (
    <Layout>
      <Seo
        title="AI Internship Report Generator — Download DOCX Free | Techrola"
        description="Generate a complete, college-ready internship report with AI in minutes and download it as an editable DOCX file. Made for Indian students and their university formats."
        path="/create-report"
        keywords="internship report generator, ai internship report, internship report format docx, college internship report india"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AI Internship Report Generator",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Web",
          url: `${SITE_URL}/create-report`,
          provider: { "@type": "Organization", name: "Techrola", url: SITE_URL },
        }}
      />
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Create Internship Report</h1>
              <p className="text-sm text-muted-foreground">AI-powered report generation by Techrola</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" /> My Reports
          </Button>
        </div>

        {/* Credits Banner */}
        <Card className={totalCredits > 0 ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}>
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {remainingFree > 0 && <span>{remainingFree} free report{remainingFree > 1 ? 's' : ''}</span>}
                  {remainingFree > 0 && (reportCredits + aiCredits) > 0 && <span> + </span>}
                  {(reportCredits + aiCredits) > 0 && <span>{reportCredits + aiCredits} top-up credit{(reportCredits + aiCredits) > 1 ? 's' : ''}</span>}
                  {totalCredits === 0 && <span className="text-destructive">No credits remaining</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPro ? 'Pro members get 3 free reports.' : 'Free users get 1 report. Upgrade to Pro for 3 free!'}
                  {' '}Top-up credits work across all AI tools.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowTopup(true)}>
              <CreditCard className="h-4 w-4" /> Top-up ₹499 (+3 AI)
            </Button>

          </CardContent>
        </Card>

        {/* Interrupted Reports Banner */}
        {previousReports.filter(r => r.status === 'interrupted' || r.status === 'generating').length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> You have interrupted reports
              </p>
              {previousReports.filter(r => r.status === 'interrupted' || r.status === 'generating').map(r => {
                const fd = r.form_data;
                const completedCount = Object.keys(r.chapter_content || {}).filter(k => r.chapter_content[k]).length;
                return (
                  <div key={r.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                    <div>
                      <p className="text-sm font-medium">{fd.internshipTitle}</p>
                      <p className="text-xs text-muted-foreground">{completedCount}/{chapters.length} chapters • {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {completedCount > 0 && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadDocx(r.chapter_content, fd)}>
                          <Download className="h-3 w-3" /> Download
                        </Button>
                      )}
                      <Button size="sm" className="gap-1" onClick={() => generateReport(r)}>
                        <RotateCcw className="h-3 w-3" /> Resume
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Report Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'studentName', label: 'Student Name' },
                    { name: 'registerNumber', label: 'Register Number' },
                    { name: 'course', label: 'Course (e.g. BCA, MBA)' },
                    { name: 'collegeName', label: 'College Name' },
                    { name: 'university', label: 'University' },
                    { name: 'guideName', label: 'Guide/Mentor Name' },
                    { name: 'internshipTitle', label: 'Internship Title' },
                    { name: 'companyName', label: 'Company Name' },
                    { name: 'companyLocation', label: 'Company Location' },
                    { name: 'internshipDuration', label: 'Duration (e.g. 3 months)' },
                    { name: 'academicYear', label: 'Academic Year' },
                    { name: 'topicSpecialization', label: 'Topic/Specialization' },
                  ].map(f => (
                    <div key={f.name}>
                      <Label className="text-xs">{f.label}</Label>
                      <Input name={f.name} value={formData[f.name as keyof FormData] as string} onChange={handleInputChange} className="mt-1" disabled={generating} />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs">Target Pages</Label>
                    <Input name="pagesCount" type="number" min={10} max={40} value={formData.pagesCount} onChange={handleInputChange} className="mt-1" disabled={generating} />
                  </div>
                </div>

                <Button onClick={() => generateReport()} disabled={generating} className="w-full gap-2" size="lg">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating Report...</>
                  ) : !canGenerate ? (
                    <><Lock className="h-4 w-4" /> Top-up to Generate</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Full Report</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Download */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {generating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{Math.round(generationProgress)}% complete</p>
                  </div>
                )}

                {chapters.map(ch => {
                  const status = chapterContent[ch.key] ? 'done' : currentChapter === ch.key ? 'generating' : 'pending';
                  return (
                    <div key={ch.key} className="flex items-center gap-2 text-sm">
                      {status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : status === 'generating' ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
                      )}
                      <div>
                        <span className="font-medium">{ch.label}</span>
                        <span className="text-muted-foreground ml-1 text-xs hidden md:inline">- {ch.description}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {hasAnyContent && (
              <Button onClick={() => downloadDocx()} className="w-full gap-2" size="lg">
                <Download className="h-4 w-4" /> Download {hasAllContent ? 'Full' : 'Partial'} Report
              </Button>
            )}

            {/* Preview */}
            {completedChapters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div ref={scrollRef} className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {chapters.map(ch => chapterContent[ch.key] ? (
                        <div key={ch.key} className="mb-4">
                          <div className="font-bold text-primary mb-1">{ch.label}</div>
                          <div>{(chapterContent[ch.key] || '').substring(0, 500)}...</div>
                        </div>
                      ) : null)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Top-up Dialog (Razorpay) */}
      <TopupDialog
        open={showTopup}
        onOpenChange={setShowTopup}
        onSuccess={() => { refreshProfile(); loadCreditsAndReports(); }}
      />


      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> My Reports
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previousReports.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No reports generated yet</p>
            ) : (
              previousReports.map(r => {
                const fd = r.form_data;
                const completedCount = Object.keys(r.chapter_content || {}).filter(k => r.chapter_content[k]).length;
                const isComplete = r.status === 'completed';
                const isInterrupted = r.status === 'interrupted' || r.status === 'generating';

                return (
                  <div key={r.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{fd.internshipTitle || 'Untitled Report'}</p>
                        <p className="text-xs text-muted-foreground">{fd.studentName} • {fd.course} • {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isComplete ? 'bg-green-100 text-green-700' : isInterrupted ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                        {isComplete ? 'Completed' : isInterrupted ? `${completedCount}/${chapters.length} chapters` : r.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {completedCount > 0 && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => { downloadDocx(r.chapter_content, fd); setShowHistory(false); }}>
                          <Download className="h-3 w-3" /> Download
                        </Button>
                      )}
                      {isInterrupted && (
                        <Button size="sm" className="gap-1" onClick={() => { generateReport(r); setShowHistory(false); }}>
                          <RotateCcw className="h-3 w-3" /> Resume
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CreateReport;
