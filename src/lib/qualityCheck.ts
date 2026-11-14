// Heuristic AI-output quality checks run before a report can be downloaded.
// Two dimensions: plagiarism/duplication risk and academic style compliance.

export interface QualityIssue {
  id: string;
  label: string;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface QualityReport {
  plagiarismRisk: number; // 0-100, higher = riskier
  styleScore: number; // 0-100, higher = better
  wordCount: number;
  duplicateSentences: number;
  issues: QualityIssue[];
  passed: boolean;
}

const MAX_PLAGIARISM_RISK = 55;
const MIN_STYLE_SCORE = 60;

const AI_ARTEFACTS = [
  'as an ai', 'as a language model', 'i cannot', "i'm sorry", 'chatgpt', 'openai',
  'here is the', 'certainly!', 'sure!', 'in this response', 'note that this is a',
];

const INFORMAL_WORDS = [
  'a lot of', 'stuff', 'things like', 'kind of', 'sort of', 'basically', 'huge',
  'awesome', 'nowadays', 'lots of', 'big time', 'okay',
];

const CONTRACTIONS = /\b(can't|won't|don't|doesn't|isn't|aren't|wasn't|weren't|it's|we're|they're|i'm|didn't|couldn't|shouldn't|wouldn't)\b/gi;
const FIRST_PERSON = /\b(i|me|my|mine)\b/gi;

const stripMarkup = (s: string) =>
  s.replace(/[#*_`>|]/g, ' ').replace(/\s+/g, ' ').trim();

const sentencesOf = (text: string) =>
  stripMarkup(text)
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.split(/\s+/).length >= 6);

const shingles = (words: string[], n: number) => {
  const out: string[] = [];
  for (let i = 0; i + n <= words.length; i++) out.push(words.slice(i, i + n).join(' '));
  return out;
};

export function runQualityCheck(chapters: Record<string, string>): QualityReport {
  const texts = Object.values(chapters).filter(Boolean);
  const full = texts.join('\n\n');
  const normalized = stripMarkup(full).toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const issues: QualityIssue[] = [];

  // ---- Duplication / plagiarism risk ----
  const sents = sentencesOf(full).map(s => s.toLowerCase());
  const seen = new Map<string, number>();
  sents.forEach(s => seen.set(s, (seen.get(s) || 0) + 1));
  const duplicateSentences = Array.from(seen.values()).filter(c => c > 1).reduce((a, c) => a + (c - 1), 0);
  const dupSentenceRate = sents.length ? duplicateSentences / sents.length : 0;

  const grams = shingles(words, 8);
  const gramSet = new Set<string>();
  let repeatedGrams = 0;
  grams.forEach(g => {
    if (gramSet.has(g)) repeatedGrams++;
    else gramSet.add(g);
  });
  const gramRepeatRate = grams.length ? repeatedGrams / grams.length : 0;

  const uniqueWordRatio = wordCount ? new Set(words).size / wordCount : 1;

  const artefactHits = AI_ARTEFACTS.filter(p => normalized.includes(p));

  let plagiarismRisk = Math.round(
    Math.min(100,
      dupSentenceRate * 160 +
      gramRepeatRate * 220 +
      Math.max(0, 0.22 - uniqueWordRatio) * 180 +
      artefactHits.length * 12,
    ),
  );

  if (wordCount < 1200) {
    plagiarismRisk = Math.min(100, plagiarismRisk + 10);
    issues.push({
      id: 'length',
      label: 'Report is short',
      detail: `Only ${wordCount.toLocaleString()} words detected. Short reports read as generic and score poorly on originality.`,
      severity: 'warning',
    });
  }

  if (dupSentenceRate > 0.03) {
    issues.push({
      id: 'dup-sentences',
      label: 'Repeated sentences',
      detail: `${duplicateSentences} sentence(s) repeat across chapters (${(dupSentenceRate * 100).toFixed(1)}%). Rephrase or remove them before submission.`,
      severity: dupSentenceRate > 0.08 ? 'critical' : 'warning',
    });
  }

  if (gramRepeatRate > 0.06) {
    issues.push({
      id: 'dup-phrases',
      label: 'Recycled phrasing',
      detail: `${(gramRepeatRate * 100).toFixed(1)}% of 8-word phrases repeat. University similarity checkers flag this pattern.`,
      severity: gramRepeatRate > 0.12 ? 'critical' : 'warning',
    });
  }

  if (artefactHits.length) {
    issues.push({
      id: 'ai-artefacts',
      label: 'AI meta-text detected',
      detail: `Found assistant phrasing: "${artefactHits.slice(0, 3).join('", "')}". These must be removed.`,
      severity: 'critical',
    });
  }

  // ---- Academic style compliance ----
  let styleScore = 100;

  const firstPerson = (normalized.match(FIRST_PERSON) || []).length;
  const firstPersonRate = wordCount ? firstPerson / wordCount : 0;
  if (firstPersonRate > 0.006) {
    const penalty = Math.min(20, Math.round(firstPersonRate * 2000));
    styleScore -= penalty;
    issues.push({
      id: 'first-person',
      label: 'First-person voice',
      detail: `${firstPerson} first-person pronouns found. Academic reports prefer impersonal or third-person voice.`,
      severity: 'warning',
    });
  }

  const contractions = (full.match(CONTRACTIONS) || []).length;
  if (contractions > 2) {
    styleScore -= Math.min(15, contractions);
    issues.push({
      id: 'contractions',
      label: 'Informal contractions',
      detail: `${contractions} contractions (e.g. "don't", "it's"). Expand them in formal academic writing.`,
      severity: 'warning',
    });
  }

  const informalHits = INFORMAL_WORDS.filter(w => normalized.includes(w));
  if (informalHits.length > 1) {
    styleScore -= Math.min(15, informalHits.length * 3);
    issues.push({
      id: 'informal',
      label: 'Colloquial vocabulary',
      detail: `Informal expressions found: "${informalHits.slice(0, 4).join('", "')}".`,
      severity: 'info',
    });
  }

  const headingCount = (full.match(/^\s*(#{1,4}\s+|\d+(\.\d+)*\s+[A-Z])/gm) || []).length;
  if (headingCount < 6) {
    styleScore -= 12;
    issues.push({
      id: 'headings',
      label: 'Weak heading structure',
      detail: `Only ${headingCount} headings detected. University formats expect a clear H1–H4 hierarchy per chapter.`,
      severity: 'warning',
    });
  }

  const hasCitations = /\(\s*[A-Z][A-Za-z&.\- ]+,\s*(19|20)\d{2}\s*\)|References|Bibliography/.test(full);
  if (!hasCitations) {
    styleScore -= 12;
    issues.push({
      id: 'citations',
      label: 'No references detected',
      detail: 'No citations or reference list found. Add APA-style references before submitting.',
      severity: 'warning',
    });
  }

  const allSentences = sentencesOf(full);
  const avgLen = allSentences.length
    ? allSentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / allSentences.length
    : 0;
  if (avgLen > 34) {
    styleScore -= 8;
    issues.push({
      id: 'sentence-length',
      label: 'Very long sentences',
      detail: `Average sentence length is ${avgLen.toFixed(0)} words. Break long sentences for readability.`,
      severity: 'info',
    });
  }

  styleScore = Math.max(0, Math.min(100, Math.round(styleScore)));
  plagiarismRisk = Math.max(0, Math.min(100, plagiarismRisk));

  const passed =
    wordCount > 0 &&
    plagiarismRisk <= MAX_PLAGIARISM_RISK &&
    styleScore >= MIN_STYLE_SCORE &&
    !issues.some(i => i.severity === 'critical');

  return { plagiarismRisk, styleScore, wordCount, duplicateSentences, issues, passed };
}

export const QUALITY_THRESHOLDS = { MAX_PLAGIARISM_RISK, MIN_STYLE_SCORE };

export const riskLabel = (risk: number) =>
  risk <= 25 ? 'Low' : risk <= MAX_PLAGIARISM_RISK ? 'Moderate' : 'High';
