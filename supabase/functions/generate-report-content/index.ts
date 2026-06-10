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

      systemPrompt = "You are an expert academic report writer. Write comprehensive, detailed, professional, grammatically perfect internship report content in formal academic English. Do NOT use markdown symbols like **, ##, or backticks. Use plain text with clear ALL-CAPS chapter headings (e.g. 'CHAPTER 1: INTRODUCTION'), numbered sub-headings (1.1, 1.2), and bullet points using '- ' at the start of a line. Use tables written in pipe format ( | col | col | ) wherever data, comparisons or lists of features make sense. Keep paragraphs well-structured with 1.5 line spacing in mind. NEVER include Research Methodology, Limitations of the Study, or Lessons Learned anywhere.";

      const chapterPrompts: Record<string, string> = {
        'front': `${baseContext}

Generate the FRONT MATTER for an internship report. Output the sections in this exact order with these ALL-CAPS headings:

STUDENT DECLARATION
(120-150 words. First-person declaration by ${studentName} (Reg: ${registerNumber}) confirming the report is original work submitted to ${university} through ${collegeName} for ${course}, under the guidance of ${guideName}. End with placeholders for Place, Date and Signature.)

CERTIFICATE
(100-120 words. Formal institutional certificate from ${collegeName} certifying that ${studentName} has completed the internship at ${companyName}, ${companyLocation} during ${internshipDuration}. Include signature placeholders for Internal Guide, HOD and Principal.)

ACKNOWLEDGEMENT
(150-180 words thanking the institution, guide, company supervisors, colleagues and family.)

EXECUTIVE SUMMARY
(350-450 words giving a comprehensive overview of the internship, the topic ${topicSpecialization}, the company ${companyName}, key tasks, skills gained, findings and outcomes.)

TABLE OF CONTENTS
(Clean numbered list covering: Student Declaration, Certificate, Acknowledgement, Executive Summary, Chapter 1 Introduction (with 1.1–1.x sub-sections), Chapter 2 Description of the Company (2.1–2.x), Chapter 3 Experiential Learning (3.1 Tasks Undertaken, 3.2 Skills Acquired, 3.3 Challenges Faced), Chapter 4 Internship Outcomes and Conclusion (4.1 Outcome, 4.2 Findings, 4.3 Suggestions, 4.4 Conclusion), Bibliography. Show page-number placeholders.)`,

        '1': `${baseContext}

Generate CHAPTER 1: INTRODUCTION (about 8-10 pages, 3000-4000 words) covering the TOPIC and DEPARTMENT only. DO NOT mention the company name. DO NOT include research methodology or limitations.

Use these numbered sub-headings in order:

1.1 About the Topic — ${topicSpecialization} (detailed background, industry context)
1.2 Title Meaning — meaning and interpretation of "${internshipTitle}"
1.3 Department Meaning — meaning, role and importance of the relevant department
1.4 Features of ${topicSpecialization} (use bullet points; include a small features table)
1.5 Objectives of ${topicSpecialization} (bullet points starting with "To ...")
1.6 Functions of ${topicSpecialization} (bullet points, include a table mapping function -> purpose)
1.7 Advantages (clear bullet points)
1.8 Disadvantages (clear bullet points)
1.9 Objective of the Internship (bullet points)
1.10 Scope of the Internship (well-developed paragraphs + bullets)

Write in formal academic English with grammar checked.`,

        '2': `${baseContext}

Generate CHAPTER 2: DESCRIPTION OF THE COMPANY (about 8-12 pages, 3000-4000 words) about ${companyName}, ${companyLocation}. Use these numbered sub-headings:

2.1 About the Company (detailed profile of ${companyName})
2.2 Company Photo (insert a placeholder line: "[Insert Photo of ${companyName}]" and a one-paragraph caption describing the premises)
2.3 History and Milestones
2.4 Vision
2.5 Mission
2.6 Objectives of the Company (bullet points)
2.7 Organisation Structure (describe hierarchy and include a textual org-chart table: Level | Role | Responsibility)
2.8 Products / Services Offered (bullet points + a table: Product/Service | Description | Target Customer)
2.9 Market Presence and Achievements
2.10 Role of ${topicSpecialization} in the Company

Use tables wherever they make the data clearer. Formal academic English, grammar perfect.`,

        '3': `${baseContext}

Generate CHAPTER 3: EXPERIENTIAL LEARNING (about 6-10 pages). This chapter MUST be written in clear, easy-to-understand BULLET POINTS, NOT long paragraphs. Use tables where helpful. DO NOT include "Lessons Learned".

Use only these three sub-headings:

3.1 Tasks Undertaken
- Provide 15-25 detailed bullet points describing the actual tasks ${studentName} performed at ${companyName} during ${internshipDuration} related to ${topicSpecialization}.
- Include a table: Week | Task | Tools/Methods Used | Outcome (cover at least 6-8 weeks).

3.2 Skills Acquired
- Provide bullet points grouped under two sub-bullets: Technical Skills and Soft Skills (10-15 bullets total).
- Include a table: Skill | How It Was Acquired | Where Applied.

3.3 Challenges Faced
- Provide 10-15 bullet points describing real challenges and how they were handled.
- Include a table: Challenge | Impact | How It Was Overcome.

Keep sentences short, simple and easy to understand.`,

        '4': `${baseContext}

Generate CHAPTER 4: INTERNSHIP OUTCOMES AND CONCLUSION (about 6-10 pages). Write in clear, easy-to-understand BULLET POINTS, not long paragraphs. Use tables wherever useful. DO NOT include lessons learned, methodology or limitations.

Use only these four sub-headings in order:

4.1 Outcome
- 12-18 bullet points covering the tangible and intangible outcomes of the internship related to ${topicSpecialization} at ${companyName}.

4.2 Findings
- 12-18 bullet points presenting specific findings observed during the internship.
- Include a findings table: Area | Observation | Implication.

4.3 Suggestions
- 10-15 bullet-point recommendations to the company and to future interns.

4.4 Conclusion
- A focused conclusion (250-350 words) summarising the entire report, key learnings about ${topicSpecialization} and the internship at ${companyName}. This conclusion comes BEFORE the bibliography.`,

        '5': `${baseContext}

Generate the BIBLIOGRAPHY only. It MUST fit on a single page (maximum 12-15 references). Use proper APA format. Mix books, journal articles, official websites and industry reports relevant to ${topicSpecialization} and the industry of ${companyName}. Do NOT add annexures, glossary, or any other section. Output heading: BIBLIOGRAPHY, then the numbered reference list only.`,
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
