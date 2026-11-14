import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { runQualityCheck, riskLabel, QUALITY_THRESHOLDS, type QualityReport } from '@/lib/qualityCheck';

interface Props {
  chapters: Record<string, string>;
  onResult: (passed: boolean) => void;
}

const QualityGate = ({ chapters, onResult }: Props) => {
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<QualityReport | null>(null);

  const run = async () => {
    setRunning(true);
    setReport(null);
    onResult(false);
    // Yield so the UI can show the scanning state on large reports.
    await new Promise(r => setTimeout(r, 450));
    const result = runQualityCheck(chapters);
    setReport(result);
    onResult(result.passed);
    setRunning(false);
  };

  const risk = report?.plagiarismRisk ?? 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm">AI Output Quality Check</p>
            <p className="text-xs text-muted-foreground">
              Plagiarism risk & academic style compliance must pass before download.
            </p>
          </div>
        </div>
        <Button size="sm" variant={report ? 'outline' : 'default'} onClick={run} disabled={running} className="shrink-0">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : report ? <RefreshCw className="w-4 h-4" /> : null}
          <span className="ml-1">{running ? 'Scanning…' : report ? 'Re-check' : 'Run check'}</span>
        </Button>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Plagiarism / duplication risk</span>
                <Badge variant={risk <= QUALITY_THRESHOLDS.MAX_PLAGIARISM_RISK ? 'secondary' : 'destructive'}>
                  {riskLabel(risk)} · {risk}%
                </Badge>
              </div>
              <Progress value={risk} className="h-2" />
              <p className="text-[11px] text-muted-foreground mt-2">
                Must stay at or below {QUALITY_THRESHOLDS.MAX_PLAGIARISM_RISK}%.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Academic style compliance</span>
                <Badge variant={report.styleScore >= QUALITY_THRESHOLDS.MIN_STYLE_SCORE ? 'secondary' : 'destructive'}>
                  {report.styleScore}/100
                </Badge>
              </div>
              <Progress value={report.styleScore} className="h-2" />
              <p className="text-[11px] text-muted-foreground mt-2">
                Must reach at least {QUALITY_THRESHOLDS.MIN_STYLE_SCORE}. {report.wordCount.toLocaleString()} words analysed.
              </p>
            </div>
          </div>

          {report.issues.length > 0 && (
            <ul className="space-y-2">
              {report.issues.map(issue => (
                <li key={issue.id} className="flex gap-2 text-xs rounded-lg border p-2.5">
                  {issue.severity === 'critical' ? (
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{issue.label}</p>
                    <p className="text-muted-foreground break-words">{issue.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div
            className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
              report.passed
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-destructive/10 border border-destructive/30 text-destructive'
            }`}
          >
            {report.passed ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>
              {report.passed
                ? 'Quality check passed — download is unlocked.'
                : 'Quality check failed. Regenerate the flagged chapters, then run the check again to unlock download.'}
            </span>
          </div>
        </div>
      )}

      {!report && !running && (
        <p className="text-xs text-muted-foreground">
          Run the check to unlock the download buttons.
        </p>
      )}
    </div>
  );
};

export default QualityGate;
