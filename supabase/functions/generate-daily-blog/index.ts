// Generate a batch of short SEO blogs per day using DeepSeek.
// Triggered by pg_cron (with x-cron-secret) or an admin JWT.
// Default batch: 25 blogs. Override with { count: N } (10-50).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOPIC_POOL = [
  'Earn Money Online Safely', 'Extra Income for Indian Students', 'Side Income Ideas',
  'Passive Income for Beginners', 'Work From Home Jobs', 'Part Time Jobs for College',
  'Data Entry Job Scams', 'Online Jobs Without Investment', 'Government Jobs Preparation',
  'Career Tips for Freshers', 'Resume Writing Tips', 'HR Interview Questions',
  'Internship Report Writing', 'Placement Preparation Guide', 'Scholarships for Students',
  'PM Government Schemes', 'State Government Schemes', 'Student Productivity Habits',
  'AI Tools for Students', 'Free Certification Courses', 'Study Tips for Exams',
  'Remote Jobs for Freshers', 'Freelancing for Beginners', 'Career Growth Roadmap',
  'Digital Skills to Learn', 'Startup Ideas for Students', 'Financial Literacy Basics',
  'Skill Development Programs', 'Women Empowerment Schemes', 'Education Loans in India',
  'Referral Program Tips', 'How to Get Hired Fast', 'Best Side Hustles',
  'Building an Online Portfolio', 'LinkedIn Profile Tips', 'Cover Letter Writing',
  'Group Discussion Tips', 'Aptitude Test Preparation', 'Coding Interview Prep',
  'MBA Entrance Tips', 'UPSC Beginner Guide', 'Bank Exam Preparation',
  'SSC Preparation Tips', 'Government Scholarship Application', 'Startup India Registration',
  'PMEGP Loan Guide', 'Mudra Loan for Students', 'Skill India Courses',
  'Digital India Benefits', 'NSP Scholarship Guide',
];

const CATEGORIES = [
  'Earn Money', 'Career Tips', 'Government Schemes', 'AI Tools',
  'Interview Prep', 'Skill Development', 'Student Life',
] as const;

const CAREER_CTA_HEADING = '## Join the Techrola Career Program (Work from Home)';
const CAREER_CTA_BLOCK = `\n\n${CAREER_CTA_HEADING}\n\nWork from home with Techrola's Career Program — earn while you learn, get AI career tools, and grow with a verified network of Indian students. **[Join the Techrola Career Program →](https://techrola.in/career-program)**\n`;

const SYSTEM_PROMPT = `You are the AI Content Writer for Techrola — India's AI-powered Career & Student Platform.
You write SHORT, punchy, SEO-optimized blogs (500-800 words each) for Indian students and job seekers.
Rules:
- Never mention any specific year (do NOT include 2024, 2025, 2026, 2027 etc. in titles, slugs or body).
- Never describe Techrola as an MLM or a get-rich-quick platform.
- Educational and honest tone. Warn against scams. Always cite realistic Indian examples.
- EVERY article MUST include a section titled exactly "## Join the Techrola Career Program (Work from Home)" with 2-3 lines and a markdown link to https://techrola.in/career-program.
- End every article with a short CTA to techrola.in, /career-program and /ai-tools.`;

const batchPrompt = (topics: string[], avoidTitles: string[]) => `Generate ${topics.length} SHORT SEO blog posts for Techrola.
Assign each blog to one topic in order:
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

AVOID these existing titles (do NOT repeat or paraphrase): ${avoidTitles.slice(0, 40).join(' | ') || 'none'}.

Return STRICT JSON only (no markdown fences) matching this exact shape:
{
  "blogs": [
    {
      "title": "SEO title 45-65 chars, NO YEAR mentioned, includes a keyword",
      "meta_title": "60 chars max, no year",
      "meta_description": "150-160 chars, no year",
      "slug": "url-friendly-slug-with-hyphens (no year, no numbers unless part of scheme name)",
      "focus_keyword": "primary keyword",
      "secondary_keywords": ["kw1","kw2","kw3"],
      "category": "one of: ${CATEGORIES.join(' | ')}",
      "reading_time": 4,
      "hook": "one strong opening line (emoji ok)",
      "excerpt": "2 sentence teaser, 180 chars max, no year",
      "body_markdown": "500-800 word markdown article. Must include: H2 intro, 2-3 H2 sections with bullets, a small markdown comparison table, a '## Why Techrola?' 3-bullet section, and a closing '## Next Steps' CTA linking to https://techrola.in, https://techrola.in/career-program and https://techrola.in/ai-tools. Never mention a year.",
      "faq": [{"q":"...","a":"..."}, {"q":"...","a":"..."}, {"q":"...","a":"..."}]
    }
  ]
}
Return ONLY the JSON object. No commentary. No fences. Ensure valid JSON.`;

const YEAR_RE = /\b(20\d{2}|19\d{2})\b/g;
const stripYear = (s: string | undefined | null) =>
  (s ?? '').replace(YEAR_RE, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.:;!?])/g, '$1').trim();

const slugify = (s: string) =>
  s.toLowerCase().replace(YEAR_RE, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

async function callDeepSeek(topics: string[], avoidTitles: string[], apiKey: string) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: batchPrompt(topics, avoidTitles) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek empty content');
  let parsed: any;
  try { parsed = JSON.parse(content); }
  catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('DeepSeek did not return JSON');
    parsed = JSON.parse(m[0]);
  }
  return Array.isArray(parsed?.blogs) ? parsed.blogs : [];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cronSecret = req.headers.get('x-cron-secret');
  const authHeader = req.headers.get('Authorization');
  let authorized = false;
  if (cronSecret) {
    const { data } = await admin.rpc('verify_cron_secret', { _token: cronSecret });
    if (data === true) authorized = true;
  }
  if (!authorized && authHeader?.startsWith('Bearer ')) {
    const { data: userData } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userData?.user) {
      const { data: isAdmin } = await admin.rpc('has_role', {
        _user_id: userData.user.id, _role: 'admin',
      });
      if (isAdmin === true) authorized = true;
    }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const DEEPSEEK = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK) throw new Error('DEEPSEEK_API_KEY not set');

    let body: any = {};
    try { body = await req.json(); } catch { /* no body */ }
    const requested = Math.min(50, Math.max(10, Number(body?.count) || 25));

    // Recent titles to avoid duplication
    const { data: recent } = await admin
      .from('blogs')
      .select('title')
      .order('published_at', { ascending: false })
      .limit(120);
    const avoidTitles = (recent ?? []).map((r: any) => r.title).filter(Boolean);
    const avoidLower = new Set(avoidTitles.map((t) => t.toLowerCase()));

    // Pick unique topics not in avoid list
    const shuffled = [...TOPIC_POOL].sort(() => Math.random() - 0.5);
    const topics = shuffled.filter((t) => !avoidLower.has(t.toLowerCase())).slice(0, requested);
    while (topics.length < requested) topics.push(shuffled[topics.length % shuffled.length]);

    // Generate in chunks of 8 to stay within token limits
    const CHUNK = 8;
    const allBlogs: any[] = [];
    for (let i = 0; i < topics.length; i += CHUNK) {
      const slice = topics.slice(i, i + CHUNK);
      try {
        const blogs = await callDeepSeek(slice, avoidTitles, DEEPSEEK);
        allBlogs.push(...blogs);
      } catch (e) {
        console.error(`Chunk ${i} failed:`, (e as Error).message);
      }
    }

    // Insert rows with unique slugs, stripping years
    let inserted = 0;
    const errors: string[] = [];
    for (const b of allBlogs) {
      try {
        const title = stripYear(b.title);
        if (!title) continue;
        let baseSlug = slugify(b.slug || title);
        if (!baseSlug) baseSlug = 'blog-' + Date.now();
        let slug = baseSlug;
        let n = 0;
        while (true) {
          const { data: exists } = await admin.from('blogs').select('id').eq('slug', slug).maybeSingle();
          if (!exists) break;
          n += 1;
          slug = `${baseSlug}-${n}`;
          if (n > 10) { slug = `${baseSlug}-${Date.now()}`; break; }
        }

        const { error: insErr } = await admin.from('blogs').insert({
          slug,
          title,
          meta_title: stripYear(b.meta_title) || title,
          meta_description: stripYear(b.meta_description) || stripYear(b.excerpt) || '',
          focus_keyword: b.focus_keyword ?? null,
          secondary_keywords: Array.isArray(b.secondary_keywords) ? b.secondary_keywords : [],
          category: CATEGORIES.includes(b.category) ? b.category : 'Career Tips',
          reading_time: Number(b.reading_time) || 4,
          hook: b.hook ?? null,
          excerpt: stripYear(b.excerpt),
          body_markdown: (() => {
            const md = stripYear(b.body_markdown) || '';
            return md.includes('Techrola Career Program (Work from Home)') ? md : md + CAREER_CTA_BLOCK;
          })(),
          faq: Array.isArray(b.faq) ? b.faq : [],
          social_captions: {},
          internal_links: [],
          related_articles: [],
          status: 'published',
          published_at: new Date().toISOString(),
        });
        if (insErr) errors.push(insErr.message);
        else inserted += 1;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    return new Response(JSON.stringify({
      success: true, requested, generated: allBlogs.length, inserted, errors: errors.slice(0, 5),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
