import { Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import ResumeLastReport from '@/components/ResumeLastReport';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Briefcase, FolderKanban, ScrollText, CheckCircle2 } from 'lucide-react';

const OPTIONS = [
  {
    slug: 'internship',
    title: 'Internship Report',
    description: 'Company-based internship report with certificate, chapters & annexures.',
    points: ['Company & role details', 'Weekly work summary', 'BNU / university format'],
    icon: Briefcase,
    iconBg: 'bg-primary/10 text-primary',
    accent: 'from-primary/10 to-primary/5',
  },
  {
    slug: 'project',
    title: 'Project Report',
    description: 'Academic project & case-study report formatted to university guidelines.',
    points: ['Topic suggestions by AI', 'Objectives & scope', 'Case-study support'],
    icon: FolderKanban,
    iconBg: 'bg-accent/20 text-accent-foreground',
    accent: 'from-accent/20 to-accent/5',
  },
  {
    slug: 'thesis',
    title: 'Thesis / Dissertation',
    description: 'Structure and format your research for PhD, M.Phil & PG dissertations.',
    points: ['Uses your own research', 'Chapter structuring', 'Academic formatting'],
    icon: ScrollText,
    iconBg: 'bg-primary/10 text-primary',
    accent: 'from-primary/10 to-accent/10',
  },
];

const GenerateChooser = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo title="Report Generator — Smartlio" description="Create internship reports, projects and thesis documents." path="/generate" />
      <ResumeLastReport />
      <Link to="/my-reports" className="block text-center py-3 text-primary">My Reports</Link>

      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Home</Button></Link>
          <span className="font-display font-bold">Generate Report</span>
          <div className="w-16" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold">What do you need to generate?</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Choose one — each type has its own short form, so you only answer what matters.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {OPTIONS.map(o => {
            const Icon = o.icon;
            return (
              <Card key={o.slug} className={`p-6 border-0 shadow-soft hover-lift bg-gradient-to-br ${o.accent} flex flex-col`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${o.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="font-display text-lg font-bold mb-1">{o.title}</h2>
                <p className="text-sm text-muted-foreground mb-4">{o.description}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {o.points.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <Link to={`/generate/${o.slug}`}>
                  <Button variant="default" className="w-full">
                    Start <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GenerateChooser;
