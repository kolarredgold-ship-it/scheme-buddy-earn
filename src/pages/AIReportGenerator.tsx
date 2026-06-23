import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Loader2, Copy, Download, Sparkles, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TopupDialog from '@/components/TopupDialog';
import { CreditCard } from 'lucide-react';


const courses = ['BCom', 'BBA', 'BCA', 'MCA', 'BE/BTech', 'MBA', 'ME/MTech', 'BSc', 'MSc', 'Other'];

const sections = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'introduction', label: 'Introduction' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'results', label: 'Results' },
  { key: 'conclusion', label: 'Conclusion' },
];

const AIReportGenerator = () => {
  const { user, loading: authLoading, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('abstract');
  const [generationsUsed, setGenerationsUsed] = useState(0);
  const [showTopup, setShowTopup] = useState(false);

  const isPro = profile?.subscription_status === 'active';
  // New rule: Pro subscribers get 3 generations TOTAL via ai_credits (shared pool),
  // free users get 1 per tool. Top-up adds +5 to shared ai_credits.
  const FREE_LIMIT = isPro ? 0 : 1;
  const aiCredits = (profile as any)?.ai_credits ?? 0;
  const remainingFree = Math.max(0, FREE_LIMIT - generationsUsed);
  const remainingTotal = remainingFree + aiCredits;
  const canGenerate = remainingFree > 0 || aiCredits > 0;

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkLimit();
  }, [user, profile]);

  const checkLimit = async () => {
    const { count } = await supabase
      .from('report_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('report_type', 'quick');
    setGenerationsUsed(count || 0);
  };

  const handleGenerate = async () => {
    if (!course || !topic) {
      toast.error('Please select course and enter topic');
      return;
    }
    if (!canGenerate) {
      setShowTopup(true);
      return;
    }

    setGenerating(true);
    setGeneratedContent({});
    setEditedContent({});

    try {
      // Record usage
      await supabase.from('report_generations').insert({
        user_id: user!.id,
        report_type: 'quick',
        form_data: { course, topic, description } as any,
      });

      // If using ai_credits pool, decrement via edge function
      if (remainingFree === 0 && aiCredits > 0) {
        await supabase.functions.invoke('consume-ai-credit', { body: { tool_key: 'quick' } });
        await refreshProfile();
      }

      const { data, error } = await supabase.functions.invoke('generate-report-content', {
        body: { mode: 'quick', course, topic, description },
      });

      if (error) throw error;

      if (data?.content) {
        setGeneratedContent(data.content);
        setEditedContent(data.content);
        toast.success('Content generated!');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      const msg = error?.message?.includes('Failed to fetch')
        ? "Couldn't reach the AI service. Please check your internet and try again."
        : error?.message || 'Failed to generate content. Please try again in a moment.';
      toast.error(msg);
    } finally {
      setGenerating(false);
      checkLimit();
    }
  };


  const handleCopy = (section: string) => {
    const text = editedContent[section] || generatedContent[section] || '';
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCopyAll = () => {
    const allText = sections
      .map(s => `## ${s.label}\n\n${editedContent[s.key] || generatedContent[s.key] || ''}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(allText);
    toast.success('Full report copied');
  };

  const handleExport = () => {
    const allText = sections
      .map(s => `${s.label}\n${'='.repeat(s.label.length)}\n\n${editedContent[s.key] || generatedContent[s.key] || ''}`)
      .join('\n\n\n');
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as text file');
  };

  const hasContent = Object.keys(generatedContent).length > 0;

  if (authLoading) return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 h-80 rounded-xl bg-muted animate-pulse" />
          <div className="lg:col-span-3 h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">AI Report Generator</h1>
            <p className="text-sm text-muted-foreground">Quick section-wise content generation by Techrola</p>
          </div>
        </div>

        <Card className={canGenerate ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"}>
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>
                <strong className="text-primary">{remainingTotal} generation{remainingTotal === 1 ? '' : 's'} left</strong>
                {remainingFree > 0 && <span className="text-muted-foreground"> ({remainingFree} free{aiCredits > 0 ? ` + ${aiCredits} top-up` : ''})</span>}
                {remainingFree === 0 && aiCredits > 0 && <span className="text-muted-foreground"> (top-up pool)</span>}
                {!canGenerate && <span className="text-destructive font-semibold ml-1">No credits left</span>}
                <span className="text-muted-foreground"> · {isPro ? 'Pro: 3 shared' : 'Free: 1 per tool'} · </span>
                <Link to="/subscription" className="underline">Pro ₹999</Link>
              </span>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowTopup(true)}>
              <CreditCard className="h-3 w-3" /> Top-up ₹499
            </Button>
          </CardContent>
        </Card>


        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Generate Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Course</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project Topic</Label>
                  <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Digital Marketing Strategy" />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={4} />
                </div>
                <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2" size="lg">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : !canGenerate ? (
                    <><Lock className="h-4 w-4" /> Top-up ₹499 to Generate</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Report Content</>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* Output */}
          <div className="lg:col-span-3">
            {hasContent ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Generated Content</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyAll}><Copy className="h-3 w-3 mr-1" /> Copy All</Button>
                    <Button size="sm" variant="outline" onClick={handleExport}><Download className="h-3 w-3 mr-1" /> Export</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeSection} onValueChange={setActiveSection}>
                    <TabsList className="w-full flex-wrap h-auto">
                      {sections.map(s => (
                        <TabsTrigger key={s.key} value={s.key} className="text-xs">{s.label}</TabsTrigger>
                      ))}
                    </TabsList>
                    {sections.map(s => (
                      <TabsContent key={s.key} value={s.key}>
                        <div className="flex justify-end mb-2">
                          <Button size="sm" variant="ghost" onClick={() => handleCopy(s.key)}>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <Textarea
                          value={editedContent[s.key] || ''}
                          onChange={e => setEditedContent(prev => ({ ...prev, [s.key]: e.target.value }))}
                          rows={16}
                          className="font-mono text-sm"
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
                  <p className="text-muted-foreground">Fill in the form and click Generate to create your report content using AI.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <TopupDialog open={showTopup} onOpenChange={setShowTopup} onSuccess={() => { refreshProfile(); checkLimit(); }} />
    </Layout>

  );
};

export default AIReportGenerator;
