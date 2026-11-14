import { Briefcase, GraduationCap, Presentation, type LucideIcon } from 'lucide-react';

export type ReportKind = 'internship' | 'project' | 'thesis';

export interface ReportKindTheme {
  kind: ReportKind;
  /** Scope class that remaps the semantic colour tokens for this report type. */
  className: string;
  label: string;
  shortLabel: string;
  tagline: string;
  icon: LucideIcon;
  /** Words used in progress / generation copy. */
  unitSingular: string;
  unitPlural: string;
  /** Bullet list shown while the form is being filled. */
  highlights: string[];
  /** Copy shown on the generation screen. */
  progressTitle: string;
  progressHint: string;
}

export const REPORT_KIND_THEMES: Record<ReportKind, ReportKindTheme> = {
  internship: {
    kind: 'internship',
    className: 'kind-internship',
    label: 'Internship Report',
    shortLabel: 'Internship',
    tagline: 'Company-based internship report with certificate, chapters & annexures.',
    icon: Briefcase,
    unitSingular: 'chapter',
    unitPlural: 'chapters',
    highlights: [
      'Company profile & industry overview',
      'Day-to-day work, tasks and tools used',
      'Learning outcomes and skills gained',
      'Certificate page + annexures ready to attach',
    ],
    progressTitle: 'Internship Report Progress',
    progressHint: 'Chapters follow the internship flow: organisation → work done → learnings.',
  },
  project: {
    kind: 'project',
    className: 'kind-project',
    label: 'Project Report',
    shortLabel: 'Project',
    tagline: 'Academic project & case-study report formatted to university guidelines.',
    icon: Presentation,
    unitSingular: 'section',
    unitPlural: 'sections',
    highlights: [
      'Problem statement, objectives and scope',
      'Methodology, tools and system/case design',
      'Data analysis with tables and interpretation',
      'Findings, suggestions and conclusion',
    ],
    progressTitle: 'Project Report Progress',
    progressHint: 'Sections follow the project flow: objectives → methodology → analysis → findings.',
  },
  thesis: {
    kind: 'thesis',
    className: 'kind-thesis',
    label: 'Thesis / Dissertation',
    shortLabel: 'Thesis',
    tagline: 'Structure and format your research for PhD, M.Phil & PG dissertations.',
    icon: GraduationCap,
    unitSingular: 'chapter',
    unitPlural: 'chapters',
    highlights: [
      'Abstract, synopsis and research problem',
      'Review of literature with research gap',
      'Research design, hypotheses and methodology',
      'Analysis, discussion and scope for future research',
    ],
    progressTitle: 'Thesis Structuring Progress',
    progressHint: 'Your own data and findings stay intact — we structure and format them academically.',
  },
};

export const getReportKindTheme = (kind?: string | null): ReportKindTheme =>
  REPORT_KIND_THEMES[(kind as ReportKind) in REPORT_KIND_THEMES ? (kind as ReportKind) : 'internship'];
