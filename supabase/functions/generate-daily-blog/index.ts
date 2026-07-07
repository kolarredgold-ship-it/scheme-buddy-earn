// Generate one SEO blog per day using DeepSeek + Lovable AI image gateway.
// Trigger: pg_cron (with x-cron-secret header) or admin JWT.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const TOPIC_POOL = [
  'Earn Money Online', 'Extra Income for Students', 'Side Income Ideas', 'Passive Income',
  'Work From Home', 'Part Time Jobs', 'Data Entry Jobs Truth', 'Online Jobs',
  'Government Jobs', 'Career Tips', 'Resume Tips', 'Interview Tips', 'Internship',
  'Placement Preparation', 'Scholarships', 'Government Schemes', 'Student Productivity',
  'AI Tools for Students', 'Study Tips', 'Remote Jobs', 'Freelancing', 'Career Growth',
  'Digital Skills', 'Entrepreneurship', 'Financial Awareness', 'Skill Development',
  'Women Empowerment', 'Education Loans', 'Startup Ideas', 'Student Success',
];

const SYSTEM_PROMPT = `You are the official AI Content Writer for Techrola, India's AI-powered Career & Student Platform.
Your job: generate ONE brand-new, SEO-optimized blog. Every blog must be unique, target Indian readers, never copy existing content.
Never describe Techrola as an MLM or get-rich platform.
Always end referral talk with: "Referral rewards are subject to the official Techrola Career Program Terms & Conditions."
Every blog MUST begin with a strong emotional hook (e.g. "🚨 Don't Fall for Fake Online Earning Apps.").
Every blog MUST include a "## Why Choose the Techrola Career Program?" section with the 6-step roadmap (Register, Subscribe, Get EMP Code, Share, Stay Active, Get Hired).
Every blog MUST end with a "# 🚀 Don't Fall for Online Earning Scams" CTA linking to https://techrola.in, https://techrola.in/career-program, and https://techrola.in/ai-tools.
Word count: 2500-3500 words. Markdown format. Educational first, promotional second.`;

const USER_PROMPT = (topic: string, avoidTitles: string[]) => `Write today's Techrola blog on the topic: "${topic}".

AVOID these recent titles (never repeat): ${avoidTitles.length ? avoidTitles.join(' | ') : 'none yet'}.

Return STRICT JSON only (no markdown fences) matching this exact shape:
{
  "title": "SEO title, 55-65 chars, includes focus keyword",
  "meta_title": "60 chars max",
  "meta_description": "150-160 chars",
  "slug": "url-friendly-slug-with-hyphens",
  "focus_keyword": "primary keyword",
  "secondary_keywords": ["kw1","kw2","kw3","kw4","kw5"],
  "category": "one of: Earn Money | Career Tips | Government Schemes | AI Tools | Interview Prep | Skill Development | Student Life",
  "reading_time": 10,
  "hook": "the opening emotional hook line",
  "excerpt": "2-3 sentence teaser, 180 chars max",
  "featured_image_prompt": "detailed prompt for a hero image — Indian student/professional context, vibrant, editorial magazine style, no text on image",
  "body_markdown": "Full 2500-3500 word article in markdown. Include: Introduction, Problem, Real Indian Examples, Statistics (with source names), Common Mistakes, Expert Tips, Checklist, Comparison Table (markdown), Career Advice, '## Why Choose the Techrola Career Program?' with 6-step roadmap, and the mandatory closing CTA section '# 🚀 Don't Fall for Online Earning Scams'. Use H2/H3, bullet lists, and markdown tables. Do NOT include the FAQ inside body_markdown (return it separately below).",
  "faq": [{"q":"...","a":"..."}, ...at least 5],
  "social_captions": {
    "instagram": "hook + 5-8 hashtags, <220 chars",
    "linkedin": "professional 3-paragraph post, <1200 chars",
    "twitter": "punchy tweet <260 chars with 2-3 hashtags",
    "pinterest": "descriptive caption with keywords, <450 chars"
  },
  "internal_links": [{"anchor":"...","url":"https://techrola.in/..."}],
  "related_articles": ["Suggested Related Title 1","Suggested Related Title 2","Suggested Related Title 3"]
}
Return ONLY the JSON object. No commentary, no markdown fences.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Auth: cron secret header OR admin JWT
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
    const LOVABLE = Deno.env.get('LOVABLE_API_KEY');
    if (!DEEPSEEK) throw new Error('DEEPSEEK_API_KEY not set');
    if (!LOVABLE) throw new Error('LOVABLE_API_KEY not set');

    // Recent titles to avoid
    const { data: recent } = await admin
      .from('blogs')
      .select('title, category')
      .order('published_at', { ascending: false })
      .limit(20);
    const avoidTitles = (recent ?? []).map((r: any) => r.title);
    const recentCategories = new Set((recent ?? []).slice(0, 5).map((r: any) => r.category));

    // Pick a topic not recently used
    const available = TOPIC_POOL.filter((t) => !avoidTitles.some((tt) => tt?.toLowerCase().includes(t.toLowerCase())));
    const pool = available.length ? available : TOPIC_POOL;
    const topic = pool[Math.floor(Math.random() * pool.length)];

    // 1) DeepSeek: full article JSON
    const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        response_format: { type: 'json_object' },
        temperature: 0.85,
        max_tokens: 8000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: USER_PROMPT(topic, avoidTitles) },
        ],
      }),
    });
    if (!dsRes.ok) {
      const err = await dsRes.text();
      throw new Error(`DeepSeek ${dsRes.status}: ${err}`);
    }
    const dsJson = await dsRes.json();
    const rawContent = dsJson?.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error('DeepSeek returned empty content');

    let blog: any;
    try {
      blog = JSON.parse(rawContent);
    } catch {
      // Try to salvage JSON from fenced content
      const m = rawContent.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('DeepSeek did not return JSON');
      blog = JSON.parse(m[0]);
    }

    // Sanitize slug + ensure uniqueness
    let baseSlug = String(blog.slug || blog.title || 'blog')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    if (!baseSlug) baseSlug = 'blog-' + Date.now();
    let slug = baseSlug;
    let n = 0;
    while (true) {
      const { data: exists } = await admin.from('blogs').select('id').eq('slug', slug).maybeSingle();
      if (!exists) break;
      n += 1;
      slug = `${baseSlug}-${n}`;
    }

    // 2) Lovable AI image (Nano Banana, non-streaming)
    let featured_image_url: string | null = null;
    try {
      const imgPrompt = blog.featured_image_prompt ||
        `Editorial magazine hero image: ${blog.title}. Indian student context, vibrant colors, modern, no text.`;
      const imgRes = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [{ role: 'user', content: imgPrompt }],
          modalities: ['image', 'text'],
        }),
      });
      if (imgRes.ok) {
        const imgJson = await imgRes.json();
        const b64 = imgJson?.data?.[0]?.b64_json;
        if (b64) {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const path = `blogs/${slug}.png`;
          const { error: upErr } = await admin.storage
            .from('scheme-images')
            .upload(path, bytes, { contentType: 'image/png', upsert: true });
          if (!upErr) {
            const { data: pub } = admin.storage.from('scheme-images').getPublicUrl(path);
            featured_image_url = pub.publicUrl;
          }
        }
      }
    } catch (e) {
      console.error('Image generation failed:', e);
    }

    // 3) Insert row
    const { data: inserted, error: insErr } = await admin
      .from('blogs')
      .insert({
        slug,
        title: blog.title,
        meta_title: blog.meta_title ?? blog.title,
        meta_description: blog.meta_description ?? blog.excerpt ?? '',
        focus_keyword: blog.focus_keyword ?? null,
        secondary_keywords: Array.isArray(blog.secondary_keywords) ? blog.secondary_keywords : [],
        category: blog.category ?? 'Career Tips',
        reading_time: Number(blog.reading_time) || 10,
        featured_image_url,
        featured_image_prompt: blog.featured_image_prompt ?? null,
        hook: blog.hook ?? null,
        excerpt: blog.excerpt ?? null,
        body_markdown: blog.body_markdown ?? '',
        faq: Array.isArray(blog.faq) ? blog.faq : [],
        social_captions: blog.social_captions ?? {},
        internal_links: Array.isArray(blog.internal_links) ? blog.internal_links : [],
        related_articles: Array.isArray(blog.related_articles) ? blog.related_articles : [],
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select('id, slug, title')
      .single();

    if (insErr) throw new Error(`Insert failed: ${insErr.message}`);

    return new Response(JSON.stringify({ success: true, blog: inserted, topic }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
