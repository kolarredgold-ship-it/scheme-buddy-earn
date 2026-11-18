import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, ArrowRight, Loader2 } from 'lucide-react';

export default function MyReports() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');
  const reports = useQuery({
    queryKey: ['my-reports', user?.id], enabled: !!user, retry: 1,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('reports').select('id,internship_title,course,college_name,company_name,report_kind,pages_count,status,created_at,download_count,last_downloaded_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200).abortSignal(AbortSignal.timeout(15000));
      if (error) throw error;
      return data || [];
    },
  });
  if (!loading && !user) return <Navigate to="/login" replace />;
  const filtered = (reports.data || []).filter(report => (kind === 'all' || kind === report.report_kind) && (status === 'all' || status === report.status) && [report.internship_title,report.course,report.college_name,report.company_name].some(value => (value || '').toLowerCase().includes(search.toLowerCase())));
  return <Layout><main className="container max-w-5xl px-4 py-8 space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">My Reports</h1><Button asChild><Link to="/generate"><FileText className="mr-2 h-4 w-4" />New Report</Link></Button></header>
    <div className="grid gap-3 sm:grid-cols-3"><Input aria-label="Search reports" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} /><Select value={kind} onValueChange={setKind}><SelectTrigger aria-label="Report type"><SelectValue /></SelectTrigger><SelectContent>{['all','internship','project','thesis'].map(value => <SelectItem value={value} key={value}>{value === 'all' ? 'All types' : value}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Report status"><SelectValue /></SelectTrigger><SelectContent>{['all','completed','generating','pending','failed'].map(value => <SelectItem value={value} key={value}>{value === 'all' ? 'Any status' : value}</SelectItem>)}</SelectContent></Select></div>
    {loading || reports.isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : reports.isError ? <div role="alert">Could not load reports. <Button variant="outline" onClick={() => reports.refetch()}>Retry</Button></div> : filtered.length === 0 ? <p className="text-muted-foreground">No matching reports.</p> : <div className="space-y-3">{filtered.map(report => <article key={report.id} className="rounded-lg border bg-card p-5 flex flex-col sm:flex-row justify-between gap-4">
      <div className="min-w-0"><h2 className="font-bold text-lg break-words">{report.internship_title || 'Untitled Report'}</h2><p className="text-sm text-muted-foreground">{report.report_kind} · {report.course} · {report.status}</p><p className="text-sm text-muted-foreground">{report.college_name} · {report.pages_count || '—'} target pages · {new Date(report.created_at).toLocaleDateString()}</p><p className="text-xs text-muted-foreground mt-2">Downloads: {report.download_count}{report.last_downloaded_at ? ` · Last: ${new Date(report.last_downloaded_at).toLocaleString()}` : ''}</p></div>
      <Button asChild variant="outline" className="shrink-0"><Link to={`/create-report?reportId=${report.id}`}>{report.status === 'completed' ? 'View & Download' : 'Continue'}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
    </article>)}</div>}
  </main></Layout>;
}