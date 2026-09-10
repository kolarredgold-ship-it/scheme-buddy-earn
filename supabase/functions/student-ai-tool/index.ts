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

    case "lor":
      return `Write a strong LETTER OF RECOMMENDATION (450-600 words) in formal plain text from the recommender's perspective, addressed "To Whom It May Concern". Cover: introduction & relationship, academic/work performance, key strengths with specific examples, character & soft skills, suitability for the purpose, strong closing endorsement. Sign off with the recommender's name, title and institution.

Student/Candidate: ${data.student_name}
Recommender: ${data.recommender_name}, ${data.recommender_title}
Institution / Company: ${data.institution}
Relationship & Duration: ${data.relationship}
Key Strengths: ${data.strengths}
Achievements / Projects: ${data.achievements}
Purpose (applying for): ${data.purpose}`;

    case "project-report":
      return `Write an academic MINI PROJECT REPORT in plain text. Use ALL-CAPS section headings in this order: TITLE PAGE INFO, ABSTRACT, INTRODUCTION, OBJECTIVES, LITERATURE REVIEW (brief), SYSTEM REQUIREMENTS, SYSTEM DESIGN, MODULES, IMPLEMENTATION, TESTING, RESULTS, ADVANTAGES, FUTURE SCOPE, CONCLUSION, REFERENCES (5-7 placeholder). Use short bullets where appropriate.

Student: ${data.name}
Course: ${data.course}
College: ${data.college}
Guide: ${data.guide || "Prof. _____"}
Project Title: ${data.title}
Domain: ${data.domain}
Tech Stack: ${data.tech}
Objective: ${data.objective}
Features / Modules: ${data.features}`;

    case "email-writer":
      return `Write a professional EMAIL in plain text. Output exactly: a "Subject:" line, blank line, then salutation, 2-3 concise paragraphs, polite closing, sender name. No markdown.

From: ${data.sender}
To: ${data.recipient}
Purpose: ${data.purpose}
Context: ${data.context}
Tone: ${data.tone || "formal"}`;

    case "viva-questions":
      return `Generate 20 VIVA / INTERVIEW QUESTIONS WITH MODEL ANSWERS in plain text for the given topic. Number them 1. to 20. Each item should have "Q: ..." and "A: ..." on separate lines, with answer 2-4 sentences, simple language. Cover basic to advanced. End with a SECTION "QUICK TIPS" with 5 bullets on how to answer confidently.

Topic / Project Title: ${data.topic}
Subject: ${data.subject}
Level: ${data.level}
Context: ${data.context || "general"}`;

    case "ppt-outline":
      return `Create a slide-by-slide PRESENTATION OUTLINE in plain text. For each slide produce: "SLIDE N: <Title>", then 3-5 bullet points (- ...), then a line "Speaker Notes: <2-3 sentences>". First slide is Title Slide, last is Thank You / Q&A.

Topic: ${data.topic}
Audience: ${data.audience}
Number of slides: ${data.slides || 10}
Duration: ${data.duration || 10} minutes
Objective: ${data.objective}`;

    case "scholarship-essay":
      return `Write a compelling SCHOLARSHIP ESSAY (500-700 words) in plain text, first person, formal but heartfelt tone. Structure: hook introduction, background & challenges, academic & extracurricular achievements, career goals & impact, why this scholarship matters, strong conclusion. No bullet points, only paragraphs.

Applicant: ${data.name}
Scholarship: ${data.scholarship}
Course / Field: ${data.course}
Background: ${data.background}
Achievements: ${data.achievements}
Career Goal / Why deserving: ${data.goal}
Financial Need: ${data.financial || "modest family income"}`;

    case "linkedin-bio":
      return `Write a LINKEDIN PROFILE OPTIMISATION pack in plain text with these ALL-CAPS sections: HEADLINE OPTIONS (3 distinct one-line headlines with character count <220), ABOUT SECTION (180-250 words, first person, engaging, uses line breaks and emojis sparingly), TOP SKILLS (10 bullets), FEATURED PROJECTS (3 bullets), CALL TO ACTION (1-2 lines for recruiters).

Name: ${data.name}
Current Role: ${data.role}
Skills: ${data.skills}
Achievements / Projects: ${data.achievements}
Career Goal: ${data.goal}
Tone: ${data.tone || "professional"}`;

    case "business-plan":
      return `Write a LEAN BUSINESS PLAN in plain text with ALL-CAPS sections: EXECUTIVE SUMMARY, PROBLEM, SOLUTION, TARGET CUSTOMERS, MARKET SIZE (estimate), UNIQUE VALUE PROPOSITION, REVENUE MODEL, GO-TO-MARKET STRATEGY, COMPETITORS, TEAM, BUDGET & USE OF FUNDS, MILESTONES (6/12 months), RISKS, CONCLUSION. Use short bullets where useful.

Founder: ${data.founder}
Idea: ${data.idea}
Problem: ${data.problem}
Solution: ${data.solution}
Target Customers: ${data.audience}
Revenue Model: ${data.revenue || "to be defined"}
Starting Budget: ${data.budget || "bootstrapped"}`;

    case "assignment":
      return `Write a complete COLLEGE ASSIGNMENT answer in plain text. Use ALL-CAPS sections: TITLE, INTRODUCTION, MAIN CONTENT (with numbered sub-sections 1., 2., 3. covering the topic in depth, mix of paragraphs and bullets), EXAMPLES / CASE STUDY (if relevant), CONCLUSION, REFERENCES (5 placeholder). Stay close to the requested word count.

Student: ${data.name}
Course / Class: ${data.course}
Subject: ${data.subject}
Topic / Question: ${data.topic}
Approx Word Count: ${data.words || 800}`;

    case "essay":
      return `Write a well-structured ESSAY in plain text, close to the requested word count. Format: TITLE (centered ALL-CAPS), INTRODUCTION, 3-4 BODY PARAGRAPHS each with a mini ALL-CAPS sub-heading, CONCLUSION. Smooth flow, no bullet points unless useful.

Topic: ${data.topic}
Type: ${data.type || "general"}
Level: ${data.level}
Approx Word Count: ${data.words || 600}
Key Points (optional): ${data.points || "cover the topic comprehensively"}`;

    case "speech":
      return `Write a powerful SPEECH in plain text suitable for spoken delivery. Structure: strong opening hook / greeting, 3 main body sections (each with ALL-CAPS sub-heading), audience interaction line, memorable closing & thank you. Mix short and long sentences, end with a punchy line. Aim length to fit duration (about 130 words per minute).

Speaker: ${data.name}
Occasion: ${data.occasion}
Audience: ${data.audience}
Topic: ${data.topic}
Duration: ${data.duration || 5} minutes
Tone: ${data.tone || "motivational"}`;

    default:
      return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth is optional for student tools — they only generate text, no DB writes.
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const anonClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
        );
        await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
      } catch (_) {
        // ignore — allow anonymous use
      }
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
    const aiUrl = "https://api.deepseek.com/chat/completions";
    const aiKey = DEEPSEEK_API_KEY;
    const model = "deepseek-chat";
    if (!aiKey) throw new Error("DEEPSEEK_API_KEY not configured");

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
