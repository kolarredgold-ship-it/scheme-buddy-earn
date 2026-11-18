import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { History, ArrowRight } from 'lucide-react';

const COURSE_LABEL: Record<string, string> = {
  ba: 'BA', bcom: 'B.Com', bba: 'BBA', bca: 'BCA', mcom: 'M.Com',
  mba: 'MBA', ma: 'MA', msc: 'MSc', med: 'M.Ed.', phd: 'PhD', mphil: 'M.Phil',
};
const TYPE_LABEL: Record<string, string> = {
  internship: 'Internship Report',
  project: 'Project Report',
  thesis: 'Thesis / Dissertation',
};

interface LastSelection {
  course: string;
  type: string;
  savedAt?: number;
}

const ResumeLastReport = () => {
  const [last, setLast] = useState<LastSelection | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('last_generate_selection');
      if (!raw) return;
      const parsed = JSON.parse(raw) as LastSelection;
      if (parsed && (parsed.course || parsed.type)) setLast(parsed);
    } catch {}
  }, []);

  if (!last) return null;

  const courseLbl = COURSE_LABEL[last.course] || '';
  const typeLbl = TYPE_LABEL[last.type] || '';
  const kind = TYPE_LABEL[last.type] ? last.type : 'internship';
  const params = new URLSearchParams();
  if (last.course) params.set('course', last.course);

  return (
    <section className="container mx-auto px-4 pt-6">
      <div className="rounded-lg border border-accent/30 bg-gradient-to-r from-accent/10 to-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate">Resume your last report</p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {[typeLbl, courseLbl].filter(Boolean).join(' · ') || 'Continue where you left off'}
            </p>
          </div>
        </div>
        <Link to={`/generate/${kind}?${params.toString()}`} className="sm:shrink-0">
          <Button variant="default" size="sm" className="w-full sm:w-auto">
            Resume <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ResumeLastReport;
