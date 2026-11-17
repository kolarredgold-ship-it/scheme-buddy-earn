import { describe, expect, it } from 'vitest';
import { pageBounds, parseReportChapters, reportChapterKeys, validateReportDetails } from './reportWorkflow';
const words = (n: number) => Array.from({ length: n }, () => 'research').join(' ');
const valid = { guideName: 'Guide', companyName: 'Company', internshipStart: '2026-01-01', internshipEnd: '2026-02-01', internshipRole: 'Finance intern', workDescription: words(50), projectTopic: 'Customer satisfaction', objective: words(50), researchTitle: 'Supply chain research', researchArea: 'Commerce', researchSummary: words(80) };
describe('Imported report conditions', () => {
  it('limits internship and project reports to 3–50 pages', () => { expect(pageBounds('internship')).toMatchObject({ min: 3, max: 50 }); expect(pageBounds('project')).toMatchObject({ min: 3, max: 50 }); });
  it('limits thesis reports to 150–400 pages', () => expect(pageBounds('thesis')).toMatchObject({ min: 150, max: 400, default: 200 }));
  it('requires 50 internship description words', () => { expect(validateReportDetails('internship', { ...valid, workDescription: words(49) })).not.toBeNull(); expect(validateReportDetails('internship', valid)).toBeNull(); });
  it('requires 50 project objective words', () => { expect(validateReportDetails('project', { ...valid, objective: words(49) })).not.toBeNull(); expect(validateReportDetails('project', valid)).toBeNull(); });
  it('requires 80 thesis summary words', () => { expect(validateReportDetails('thesis', { ...valid, researchSummary: words(79) })).not.toBeNull(); expect(validateReportDetails('thesis', valid)).toBeNull(); });
  it('requires 10-character project and research titles', () => { expect(validateReportDetails('project', { ...valid, projectTopic: '123456789' })).not.toBeNull(); expect(validateReportDetails('thesis', { ...valid, researchTitle: '123456789' })).not.toBeNull(); });
  it('rejects reversed internship dates', () => expect(validateReportDetails('internship', { ...valid, internshipEnd: '2025-12-31' })).not.toBeNull());
  it('makes the internship supervisor optional only', () => { expect(validateReportDetails('internship', { ...valid, guideName: '' })).toBeNull(); expect(validateReportDetails('project', { ...valid, guideName: '' })).not.toBeNull(); expect(validateReportDetails('thesis', { ...valid, guideName: '' })).not.toBeNull(); });
  it('preserves project and thesis conclusions in free reports', () => { expect(reportChapterKeys('internship', true)).not.toContain('5'); expect(reportChapterKeys('project', true)).toContain('5'); expect(reportChapterKeys('thesis', true)).toContain('5'); });
  it('honors excluded chapters', () => expect(reportChapterKeys('project', false, { customToc: [{ key: 'front', title: 'Title', items: [] }, { key: '3', title: 'Methods', items: [] }] })).toEqual(['front', '3']));
  it('restores chapter JSON without exporting JSON as prose', () => expect(parseReportChapters('{"front":"Title","1":"Intro","2":null}')).toEqual({ front: 'Title', '1': 'Intro' }));
});