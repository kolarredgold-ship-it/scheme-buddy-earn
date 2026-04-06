import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Loader2, Download, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Header, Footer, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import Layout from '@/components/Layout';

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
  { key: 'front', label: 'Front Matter', description: 'Certificate, Declaration, Acknowledgement, Abstract' },
  { key: '1', label: 'Chapter I', description: 'Introduction (5-8 pages)' },
  { key: '2', label: 'Chapter II', description: 'Description of the Organisation (8-12 pages)' },
  { key: '3', label: 'Chapter III', description: 'Experiential Learning (6-10 pages)' },
  { key: '4', label: 'Chapter IV', description: 'Internship Outcomes and Conclusion (6-10 pages)' },
  { key: '5', label: 'Bibliography', description: 'References & Annexures' },
];

const CreateReport = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generating, setGenerating] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string | null>(null);
  const [chapterContent, setChapterContent] = useState<Record<string, string | null>>({});
  const [generationProgress, setGenerationProgress] = useState(0);
  const [canGenerate, setCanGenerate] = useState<boolean | null>(null);
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isPro = profile?.subscription_status === 'active';

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkGenerationLimit();
  }, [user]);

  const checkGenerationLimit = async () => {
    const { count } = await supabase
      .from('report_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);
    const used = count || 0;
    setGenerationsUsed(used);
    setCanGenerate(isPro || used < 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const generateReport = async () => {
    if (!validateForm()) return;
    if (!canGenerate) {
      toast.error('Upgrade to Pro for unlimited report generation');
      navigate('/subscription');
      return;
    }

    setGenerating(true);
    setChapterContent({});
    setGenerationProgress(0);

    // Track generation
    await supabase.from('report_generations').insert({
      user_id: user!.id,
      report_type: 'full',
      form_data: formData as any,
    });

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      setCurrentChapter(ch.key);
      setGenerationProgress(((i) / chapters.length) * 100);

      try {
        const { data, error } = await supabase.functions.invoke('generate-report-content', {
          body: {
            mode: 'full',
            chapter: ch.key,
            ...formData,
          },
        });

        if (error) throw error;
        setChapterContent(prev => ({ ...prev, [ch.key]: data?.content || '' }));
      } catch (err: any) {
        console.error(`Error generating ${ch.label}:`, err);
        toast.error(`Failed to generate ${ch.label}`);
        setChapterContent(prev => ({ ...prev, [ch.key]: null }));
      }
    }

    setGenerationProgress(100);
    setCurrentChapter(null);
    setGenerating(false);
    toast.success('Report generated successfully!');
    checkGenerationLimit();
  };

  const downloadDocx = async () => {
    const allContent = chapters
      .map(ch => chapterContent[ch.key])
      .filter(Boolean)
      .join('\n\n');

    if (!allContent) {
      toast.error('No content to download');
      return;
    }

    const paragraphs: Paragraph[] = [];

    // Title page
    paragraphs.push(
      new Paragraph({ spacing: { before: 3000 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: formData.internshipTitle.toUpperCase(), bold: true, size: 36, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: 'INTERNSHIP REPORT', bold: true, size: 28, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600 },
        children: [new TextRun({ text: `Submitted by\n${formData.studentName}`, size: 24, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: `Register Number: ${formData.registerNumber}`, size: 22, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: `${formData.course}`, size: 22, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: formData.collegeName, size: 22, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: formData.university, size: 22, font: 'Times New Roman' })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: `Academic Year: ${formData.academicYear}`, size: 22, font: 'Times New Roman' })],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Content pages
    const lines = allContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
        continue;
      }

      // Detect headings
      if (trimmed.match(/^(CHAPTER|CERTIFICATE|DECLARATION|ACKNOWLEDGEMENT|ABSTRACT|EXECUTIVE SUMMARY|TABLE OF CONTENTS|BIBLIOGRAPHY|ANNEXURES)/i)) {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
          children: [new TextRun({ text: trimmed, bold: true, size: 28, font: 'Times New Roman' })],
        }));
      } else if (trimmed.match(/^\d+\.\d+/)) {
        paragraphs.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
          children: [new TextRun({ text: trimmed, bold: true, size: 24, font: 'Times New Roman' })],
        }));
      } else {
        paragraphs.push(new Paragraph({
          spacing: { after: 120, line: 360 },
          children: [new TextRun({ text: trimmed, size: 24, font: 'Times New Roman' })],
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: formData.collegeName, italics: true, size: 18, font: 'Times New Roman' })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, font: 'Times New Roman' })],
            })],
          }),
        },
        children: paragraphs,
      }],
    });

    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${formData.studentName.replace(/\s+/g, '_')}_Internship_Report.docx`);
    toast.success('Report downloaded!');
  };

  const completedChapters = Object.keys(chapterContent).filter(k => chapterContent[k]);
  const hasAllContent = chapters.every(ch => chapterContent[ch.key]);

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Create Internship Report</h1>
            <p className="text-sm text-muted-foreground">AI-powered report generation by TechRola</p>
          </div>
        </div>

        {/* Free tier notice */}
        {!isPro && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  Free: {1 - generationsUsed} report remaining. <Link to="/subscription" className="underline font-semibold">Upgrade to Pro</Link> for unlimited.
                </span>
              </div>
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
                      <Input name={f.name} value={formData[f.name as keyof FormData] as string} onChange={handleInputChange} className="mt-1" />
                    </div>
                  ))}
                  <div>
                    <Label className="text-xs">Target Pages</Label>
                    <Input name="pagesCount" type="number" min={10} max={40} value={formData.pagesCount} onChange={handleInputChange} className="mt-1" />
                  </div>
                </div>

                <Button onClick={generateReport} disabled={generating || canGenerate === false} className="w-full gap-2" size="lg">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating Report...</>
                  ) : canGenerate === false ? (
                    <><Lock className="h-4 w-4" /> Upgrade to Pro</>
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

            {hasAllContent && (
              <Button onClick={downloadDocx} className="w-full gap-2" size="lg">
                <Download className="h-4 w-4" /> Download DOCX Report
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
    </Layout>
  );
};

export default CreateReport;
