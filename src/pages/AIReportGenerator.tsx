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

const courses = ['BCom', 'BBA', 'BCA', 'MCA', 'BE/BTech', 'MBA', 'ME/MTech', 'BSc', 'MSc', 'Other'];

const sections = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'introduction', label: 'Introduction' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'results', label: 'Results' },
  { key: 'conclusion', label: 'Conclusion' },
];

const AIReportGenerator = () => {
  const { user, loading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string>>({});
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('abstract');
  const [canGenerate, setCanGenerate] = useState<boolean | null>(null);
  const [generationsUsed, setGenerationsUsed] = useState(0);

  const isPro = profile?.subscription_status === 'active';

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) checkLimit();
  }, [user]);

  const checkLimit = async () => {
    const { count } = await supabase
      .from('report_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id);
    const used = count || 0;
    setGenerationsUsed(used);
    setCanGenerate(isPro || used < 1);
  };

  const handleGenerate = async () => {
    if (!course || !topic) {
      toast.error('Please select course and enter topic');
      return;
    }
    if (!canGenerate) {
      toast.error('Upgrade to Pro for unlimited generations');
      navigate('/subscription');
      return;
    }

    setGenerating(true);
    setGeneratedContent({});
    setEditedContent({});

    try {
      // Track generation
      await supabase.from('report_generations').insert({
        user_id: user!.id,
        report_type: 'quick',
        form_data: { course, topic, description } as any,
      });

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
      toast.error('Failed to generate content');
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

  if (authLoading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

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

        {!isPro && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Free: {Math.max(0, 1 - generationsUsed)} generation remaining. <Link to="/subscription" className="underline font-semibold">Upgrade to Pro</Link> for unlimited.
              </span>
            </CardContent>
          </Card>
        )}

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
                <Button onClick={handleGenerate} disabled={generating || canGenerate === false} className="w-full gap-2" size="lg">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : canGenerate === false ? (
                    <><Lock className="h-4 w-4" /> Upgrade to Pro</>
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
    </Layout>
  );
};

export default AIReportGenerator;
