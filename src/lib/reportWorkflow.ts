export type ReportKind = 'internship' | 'project' | 'thesis';
export type ReportPreferences = {
  fontStyle?: string;
  includeAppendix?: boolean;
  customToc?: { key: string; title: string; items: string[] }[];
};

export const pageBounds = (kind: ReportKind) => kind === 'thesis'
  ? { min: 150, max: 400, default: 200 }
  : { min: 3, max: 50, default: 30 };

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function validateReportDetails(kind: ReportKind, data: {
  guideName: string; companyName: string; internshipStart: string; internshipEnd: string;
  internshipRole: string; workDescription: string; projectTopic: string; objective: string;
  researchTitle: string; researchArea: string; researchSummary: string;
}): string | null {
  if (kind !== 'internship' && !data.guideName.trim()) return 'Guide / Supervisor name is required';
  if (kind === 'internship') {
    if (!data.companyName.trim()) return 'Enter company name';
    if (!data.internshipStart || !data.internshipEnd) return 'Enter internship duration';
    if (data.internshipEnd < data.internshipStart) return 'End date must be after the start date';
    if (!data.internshipRole.trim()) return 'Enter department / role';
    if (wordCount(data.workDescription) < 50) return 'Work description must be at least 50 words';
  } else if (kind === 'project') {
    if (data.projectTopic.trim().length < 10) return 'Project topic should be at least 10 characters';
    if (wordCount(data.objective) < 50) return 'Objective / scope must be at least 50 words';
  } else {
    if (data.researchTitle.trim().length < 10) return 'Research title should be at least 10 characters';
    if (!data.researchArea.trim()) return 'Enter research area / field';
    if (wordCount(data.researchSummary) < 80) return 'Research summary must be at least 80 words';
  }
  return null;
}

export function parseReportChapters(content: unknown, fallback: unknown = {}): Record<string, string> {
  const clean = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0))
    : {};
  if (typeof content === 'string' && content.trim()) {
    try { return clean(JSON.parse(content)); }
    catch { return { front: content }; }
  }
  return clean(fallback);
}

export function reportChapterKeys(kind: ReportKind, free: boolean, preferences: ReportPreferences = {}) {
  const keys = preferences.customToc?.map(section => section.key) || ['front', '1', '2', '3', '4', '5'];
  return keys.filter(key => !(free && kind === 'internship' && key === '5'));
}