import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { mode, course, topic, description, chapter, studentName, registerNumber, collegeName, university, guideName, internshipTitle, companyName, companyLocation, internshipDuration, academicYear, topicSpecialization, pagesCount } = body;

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    let prompt: string;
    let systemPrompt: string;

    if (mode === "quick") {
      // Quick AI Report Generator mode
      systemPrompt = "You are an academic report writing assistant. Return ONLY valid JSON. Write comprehensive, elaborate content with real examples and data.";
      prompt = `Generate a professional internship/project report content for:
Course: ${course}
Topic: ${topic}
${description ? `Description: ${description}` : ''}

Generate the following 5 sections in JSON format with keys: abstract, introduction, methodology, results, conclusion.
Each section should be 300-500 words, professional and academic in tone. Include real-world examples, statistics, and industry references.
Make each section comprehensive with multiple well-developed paragraphs.
Return ONLY valid JSON like: {"abstract":"...","introduction":"...","methodology":"...","results":"...","conclusion":"..."}`;
    } else {
      // Full chapter generation mode
      const baseContext = `Student: ${studentName}, Reg: ${registerNumber}, Course: ${course}
College: ${collegeName}, University: ${university}, Guide: ${guideName}
Internship: ${internshipTitle} at ${companyName}, ${companyLocation}
Duration: ${internshipDuration}, Year: ${academicYear}
Topic/Specialization: ${topicSpecialization}
Target: ${pagesCount} pages total`;

      systemPrompt = "You are an expert academic report writer. Write comprehensive, detailed, professional internship report content. Use formal academic English. Do NOT use markdown formatting like ** or #. Write plain text with clear section headers.";

      const chapterPrompts: Record<string, string> = {
        'front': `${baseContext}

Generate the FRONT MATTER for an internship report (1500-2000 words total):

CERTIFICATE
(Write a formal certificate - 80-100 words with institutional formatting, signature placeholders for Principal, HOD, and Guide)

DECLARATION
(Write student declaration - 100-120 words stating authenticity)

ACKNOWLEDGEMENT
(Write acknowledgement - 150-180 words thanking institution, guide, company supervisors, colleagues, family)

ABSTRACT
(Write abstract - 200-250 words summarizing the internship experience, objectives, methodology, findings)

EXECUTIVE SUMMARY
(Write executive summary - 300-400 words providing comprehensive overview)

TABLE OF CONTENTS
(Create a clean table of contents listing all chapters and sub-sections)

LIST OF ABBREVIATIONS
(Include 10-15 relevant abbreviations)

Write clear, professional content with formal academic English.`,

        '1': `${baseContext}

Generate CHAPTER I: INTRODUCTION (2500-3500 words, 5-8 pages):

1.1 Background of the Study (400-500 words - industry context, historical development of ${topicSpecialization})
1.2 Meaning of ${topicSpecialization} (350-450 words - definitions, theoretical framework)
1.3 Importance of ${topicSpecialization} in the Industry (350-450 words - industry statistics, trends)
1.4 Objectives of the Study (bullet format with "To study/analyse/understand..." objectives)
1.5 Scope of the Study (250-350 words)
1.6 Need and Significance (300-400 words)
1.7 Research Methodology (250-350 words)
1.8 Limitations of the Study (200-300 words)

DO NOT mention company name in this chapter. Focus on topic/field only.`,

        '2': `${baseContext}

Generate CHAPTER II: DESCRIPTION OF THE ORGANISATION (3000-4000 words, 8-12 pages):

2.1 Company Profile (400-500 words about ${companyName})
2.2 History of the Organisation (350-450 words)
2.3 Vision and Mission (300-400 words)
2.4 Organizational Structure (350-450 words)
2.5 Products and Services (400-500 words)
2.6 Market Presence (300-400 words)
2.7 Role of ${topicSpecialization} in the Organisation (400-500 words)`,

        '3': `${baseContext}

Generate CHAPTER III: EXPERIENTIAL LEARNING (2500-3500 words, 6-10 pages):

3.1 Internship Overview (350-450 words at ${companyName}, ${companyLocation})
3.2 Department Worked (300-400 words)
3.3 Daily Activities and Tasks (500-600 words during ${internshipDuration})
3.4 Skills and Knowledge Acquired (450-550 words - technical and soft skills)
3.5 Challenges Faced (350-450 words)`,

        '4': `${baseContext}

Generate CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (2500-3500 words, 6-10 pages):

4.1 Outcomes of Internship (350-450 words)
4.2 Findings Related to ${topicSpecialization} (500-600 words with data)
4.3 Operational Impact (350-450 words)
4.4 Key Learnings (400-500 words)
4.5 Suggestions and Recommendations (400-500 words)
4.6 Conclusion (350-450 words)`,

        '5': `${baseContext}

Generate BIBLIOGRAPHY section:

Provide 15-20 properly formatted references in APA format related to ${topicSpecialization}, ${internshipTitle}, and the industry of ${companyName}. Include books, journal articles, websites, and reports.

Then write ANNEXURES section with:
- Sample questionnaire (if applicable)
- Any additional data tables
- Glossary of terms`,
      };

      prompt = chapterPrompts[chapter] || chapterPrompts['1'];
    }

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    if (mode === "quick") {
      let content;
      try {
        const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
        content = JSON.parse(jsonMatch[1].trim());
      } catch {
        content = { abstract: raw, introduction: "", methodology: "", results: "", conclusion: "" };
      }
      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      return new Response(JSON.stringify({ content: raw, chapter }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
