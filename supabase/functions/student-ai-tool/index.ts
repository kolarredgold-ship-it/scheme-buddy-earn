import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_BASE =
  "You are a professional career writing assistant for Indian students. Write in clear, formal English. Use plain text only — NO markdown symbols (no **, ##, backticks). Use clear ALL-CAPS section headings and short bullet lines starting with '- '. Be specific, professional and grammatically perfect.";

function buildPrompt(tool: string, data: Record<string, string>) {
  switch (tool) {
    case "resume":
      return `Write a complete one-page professional RESUME in plain text for the following candidate. Use clearly separated ALL-CAPS sections in this order: HEADER, CAREER OBJECTIVE, EDUCATION, TECHNICAL SKILLS, SOFT SKILLS, PROJECTS, INTERNSHIPS / EXPERIENCE, CERTIFICATIONS, ACHIEVEMENTS, LANGUAGES, DECLARATION. Use short bullet points (- ...) under each section. End with a Declaration line and a Date/Place placeholder. Do NOT include any markdown.

Candidate details:
Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}
Address: ${data.address}
Course / Degree: ${data.course}
College: ${data.college}
Year of Study / Passing: ${data.year}
Skills: ${data.skills}
Projects: ${data.projects}
Internships / Experience: ${data.experience || "Fresher"}
Career Objective hint: ${data.objective || "entry-level role in " + (data.skills || "the field")}
Languages Known: ${data.languages || "English, Hindi"}
Hobbies: ${data.hobbies || ""}`;

    case "cover-letter":
      return `Write a professional COVER LETTER (300-380 words) from the candidate to the hiring manager. Plain text only. Structure: sender block, date, recipient block, subject line, salutation, 3 well-written paragraphs (intro+role, fit+achievements, closing+call to action), sign-off with candidate name.

Candidate: ${data.name}
Course: ${data.course} from ${data.college}
Skills / Strengths: ${data.skills}
Applying for role: ${data.role}
Company: ${data.company}
Why this company / role: ${data.reason || "interest in the role and company growth"}
Contact: ${data.email} | ${data.phone}`;

    case "sop":
      return `Write a high-quality STATEMENT OF PURPOSE (SOP) of 700-900 words for the candidate's application. Plain text, formal academic tone, well-structured paragraphs (no bullet points). Cover: introduction & motivation, academic background, projects/internships, why this program, why this university/country, short-term goals, long-term goals, conclusion.

Candidate: ${data.name}
Course applying for: ${data.target_course}
University / Country: ${data.target_university}
Current Education: ${data.course} from ${data.college}
Academic Background: ${data.background}
Projects / Research: ${data.projects}
Internships / Work Experience: ${data.experience || "None"}
Career Goal: ${data.goal}
Reason for choosing this program: ${data.reason}`;

    case "study-notes":
      return `Convert the following raw study material into clean, organised STUDY NOTES that a student can revise quickly. Plain text only. Use ALL-CAPS section headings, numbered sub-sections (1., 1.1) and short bullet points (- ...). Include: SUMMARY (3-5 bullets), KEY CONCEPTS, IMPORTANT DEFINITIONS, FORMULAS / IMPORTANT POINTS (if any), EXAMPLES, POSSIBLE EXAM QUESTIONS (5-8 with one-line answers).

Subject / Topic: ${data.topic}
Class / Level: ${data.level}
Raw material:
${data.material}`;

    case "roadmap":
      return `Create a detailed 6-MONTH CAREER ROADMAP in plain text for the student to become job-ready for the target role. Use ALL-CAPS month headings (MONTH 1, MONTH 2 ...) and short bullet points under each: Skills to Learn, Resources (free Indian-friendly), Mini Projects, Practice Tasks, Outcome. Include a final section RESUME & PLACEMENT PREP and FINAL CHECKLIST.

Student name: ${data.name}
Current education: ${data.course} from ${data.college}
Current skills: ${data.skills}
Target role: ${data.target_role}
Available hours per day: ${data.hours || "2-3"}
Preferred learning style: ${data.style || "videos + projects"}`;

    case "leave-letter":
      return `Write a formal LEAVE APPLICATION LETTER in plain text. Include sender address block, date, recipient (Principal / HOD / Manager) block, subject line, salutation, body (2 short paragraphs explaining reason and dates), closing with name and signature placeholder.

From: ${data.name}, ${data.course}, ${data.college}
To: ${data.recipient}
Reason: ${data.reason}
From date: ${data.from_date}
To date: ${data.to_date}
Number of days: ${data.days}`;

    default:
      return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tool, data } = await req.json();
    const prompt = buildPrompt(tool, data || {});
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Unknown tool" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiUrl = DEEPSEEK_API_KEY
      ? "https://api.deepseek.com/chat/completions"
      : "https://ai-gateway.lovable.dev/chat/completions";
    const aiKey = DEEPSEEK_API_KEY || LOVABLE_API_KEY;
    const model = DEEPSEEK_API_KEY ? "deepseek-chat" : "google/gemini-2.5-flash";
    if (!aiKey) throw new Error("No AI key configured");

    const response = await fetch(aiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_BASE },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error(`AI API error: ${response.status}`);
    }
    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("student-ai-tool error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
