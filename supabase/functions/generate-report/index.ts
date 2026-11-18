 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };

const MIN_PAGES_COUNT = 3;
const MAX_PAGES_COUNT = 50;
const THESIS_MIN_PAGES_COUNT = 150;
const THESIS_MAX_PAGES_COUNT = 400;

const getMinPagesCount = (kind: string) => kind === 'thesis' ? THESIS_MIN_PAGES_COUNT : MIN_PAGES_COUNT;
const getMaxPagesCount = (kind: string) => kind === 'thesis' ? THESIS_MAX_PAGES_COUNT : MAX_PAGES_COUNT;
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // ========== AUTHENTICATION ==========
     const authHeader = req.headers.get('Authorization');
     if (!authHeader?.startsWith('Bearer ')) {
       console.error("Missing or invalid Authorization header");
       return new Response(
         JSON.stringify({ error: 'Authentication required' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
     const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
     
     const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } }
     });
 
     const token = authHeader.replace('Bearer ', '');
     const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
     
     if (claimsError || !claimsData?.claims) {
       console.error("JWT validation failed:", claimsError);
       return new Response(
         JSON.stringify({ error: 'Invalid or expired token' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const userId = claimsData.claims.sub;
     if (!userId) {
       console.error("No user ID in token claims");
       return new Response(
         JSON.stringify({ error: 'Invalid token: no user ID' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     console.log("Authenticated user:", userId);
 
     // ========== INPUT VALIDATION ==========
     let body;
     try {
       body = await req.json();
     } catch {
       return new Response(
         JSON.stringify({ error: 'Invalid JSON in request body' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const isInternshipKind = !(body.reportKind === 'project' || body.reportKind === 'thesis');
     const requiredFields = [
       'studentName', 'registerNumber', 'course', 'collegeName',
       'university', ...(!isInternshipKind ? ['guideName'] : []), 'internshipTitle',
       ...(isInternshipKind ? ['companyName', 'internshipDuration'] : []),
       'academicYear',
       'topicSpecialization', 'pagesCount'
     ];

     // Optional fields still validated for type/length when present
     const optionalStringFields = isInternshipKind ? ['guideName', 'companyLocation'] : ['companyName', 'companyLocation', 'internshipDuration'];
     for (const field of optionalStringFields) {
       if (body[field] === undefined || body[field] === null) body[field] = '';
     }

     for (const field of requiredFields) {
       if (body[field] === undefined || body[field] === null || body[field] === '') {
         return new Response(
           JSON.stringify({ error: `Missing required field: ${field}` }),
           { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
     }
 
      const requestedPagesCount = typeof body.pagesCount === 'string'
        ? Number(body.pagesCount)
        : body.pagesCount;

      const reportKind: 'internship' | 'project' | 'thesis' =
        body.reportKind === 'project' || body.reportKind === 'thesis' ? body.reportKind : 'internship';

      if (!Number.isFinite(requestedPagesCount) || !Number.isInteger(requestedPagesCount)) {
       return new Response(
         JSON.stringify({ error: 'pagesCount must be an integer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
  
      if (requestedPagesCount < getMinPagesCount(reportKind)) {
        return new Response(
          JSON.stringify({ error: `pagesCount must be at least ${getMinPagesCount(reportKind)} for ${reportKind} reports` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const pagesCount = Math.min(requestedPagesCount, getMaxPagesCount(reportKind));
 
      const fieldMaxLength: Record<string, number> = {
        topicSpecialization: 12000,
      };
      const defaultMaxLength = 500;
      for (const field of requiredFields) {
        if (field === 'pagesCount') continue;

        if (typeof body[field] !== 'string') {
          return new Response(
            JSON.stringify({ error: `${field} must be a string` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const limit = fieldMaxLength[field] ?? defaultMaxLength;
        if (field !== 'topicSpecialization' && body[field].length > limit) {
          return new Response(
            JSON.stringify({ error: `${field} exceeds maximum length of ${limit} characters` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const sanitize = (str: string, max = defaultMaxLength) => str.trim().replace(/\s+/g, ' ').substring(0, max);
      const createTopicFocus = (str: string) => {
        const firstUsefulLine = str
          .split(/[\n.]/)
          .map((line) => line.trim())
          .find((line) => line.length > 0) || str;

        return sanitize(firstUsefulLine.replace(/https?:\/\/\S+/gi, ''), 160) || 'the internship specialization';
      };

      const studentName = sanitize(body.studentName);
      const registerNumber = sanitize(body.registerNumber);
      const course = sanitize(body.course);
      const collegeName = sanitize(body.collegeName);
      const university = sanitize(body.university);
      const guideName = sanitize(body.guideName);
      const internshipTitle = sanitize(body.internshipTitle);
      const companyName = sanitize(body.companyName);
      const companyLocation = sanitize(body.companyLocation);
      const internshipDuration = sanitize(body.internshipDuration);
      const academicYear = sanitize(body.academicYear);
      const topicDetails = sanitize(body.topicSpecialization, fieldMaxLength.topicSpecialization);
      const topicSpecialization = createTopicFocus(body.topicSpecialization);
      const chapter = body.chapter || null;
      const part = body.part || null;
  
      console.log("Input validation passed for user:", userId, "Kind:", reportKind, "Chapter:", chapter || "Full", "Part:", part || "Full");
 
     const supabase = supabaseAuth;
     const reportId = body.reportId;
     if (typeof reportId !== 'string' || !/^[0-9a-f-]{36}$/i.test(reportId)) {
       return new Response(JSON.stringify({ error: 'Save a report before generating.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     }
     const { data: ownedReport } = await supabase.from('reports').select('id').eq('id', reportId).eq('user_id', userId).maybeSingle();
     if (!ownedReport) return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     const newCount = 0;

      const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
      
      if (!DEEPSEEK_API_KEY) {
        throw new Error("DeepSeek API key not configured");
      }
 
     // Scale factor for thesis length. Internship/project cap at 50 pages; thesis can be 150-400.
      const isThesis = reportKind === 'thesis';
      const thesisScale = isThesis ? Math.max(1, pagesCount / 50) : 1;
      const maxPagesLabel = isThesis ? `${THESIS_MAX_PAGES_COUNT} pages` : `${MAX_PAGES_COUNT} pages`;
      const scaled = (min: number, max: number) => {
        const sMin = Math.round(min * thesisScale);
        const sMax = Math.round(max * thesisScale);
        return `${sMin}-${sMax}`;
      };
      const scaledSingle = (target: number) => `${Math.round(target * thesisScale)}`;
      const scaledRange = (target: number, variance: number) => {
        const min = Math.round((target - variance) * thesisScale);
        const max = Math.round((target + variance) * thesisScale);
        return `${min}-${max}`;
      };

     // Base context for all prompts
      const baseContext = `Student: ${studentName}, Reg: ${registerNumber}, Course: ${course}
  College: ${collegeName}, University: ${university}, Guide: ${guideName}
  Internship: ${internshipTitle} at ${companyName}, ${companyLocation}
  Duration: ${internshipDuration}, Year: ${academicYear}
   Topic/Specialization: ${topicSpecialization}
   Student-provided internship/company details: ${topicDetails}
  Target: ${pagesCount} pages total (MAXIMUM ${maxPagesLabel} overall)

GLOBAL FORMATTING REQUIREMENTS (apply to ALL content you generate):
- Explain every concept in DEPTH. Mix DETAILED PARAGRAPHS with BULLET POINTS in every section — first 1-2 explanatory paragraphs, then a bulleted list of key points/features/steps, then optionally a closing paragraph. Never use only paragraphs or only bullets.
- Use a clear heading hierarchy: # for H1 (chapter title), ## for H2 (main sections), ### for H3 (sub-sections), #### for H4 (sub-sub-points). All headings will render at 14pt; body content at 12pt.
- ${isThesis ? `This is a THESIS. Scale depth and length to reach approximately ${pagesCount} pages. Use the expanded word-count targets provided in each section prompt.` : 'Keep the overall report within a 50-page limit; be detailed but not redundant.'}
- Use bullet points (-) liberally for features, skills, steps, findings, advantages, limitations.
- Where information is comparative or structured (products vs competitors, skills vs proficiency, KPIs, weekly tasks, timelines, pricing tiers), present it as a Markdown table. Add at least one relevant table per chapter.
- Assume 1.5 line spacing and that EACH CHAPTER starts on a NEW PAGE in the final document — write self-contained chapter content accordingly.
- Keep the overall report within a 50-page limit; be detailed but not redundant.`;
 
     // NEW DETAILED 4-CHAPTER STRUCTURE (as per user requirements)
     const chapterPrompts: Record<string, { prompt: string; label: string }> = {
       'front': {
         label: 'Front Matter',
         prompt: `${baseContext}
 
 Generate the FRONT MATTER for an internship report (1500-2000 words total):
 
 # CERTIFICATE
 (Write a formal certificate - 80-100 words with institutional formatting, signatures placeholders for Principal, HOD, and Guide)
 
 # DECLARATION
 (Write student declaration - 100-120 words with formal legal language stating authenticity)
 
 # ACKNOWLEDGEMENT
 (Write acknowledgement - 150-180 words thanking institution, guide, company supervisors, colleagues, family)
 
# ABSTRACT
(Write abstract - 200-250 words summarizing the internship experience, objectives, methodology, findings)

# EXECUTIVE SUMMARY
(Write executive summary - 300-400 words providing a comprehensive overview of the entire internship report. Include: purpose of the internship, company background briefly, key responsibilities handled, major skills acquired, significant findings, and overall conclusions. This should give readers a complete snapshot of the report without reading the full document. Write in third person, formal academic tone.)

# TABLE OF CONTENTS
(Create a simple, clean table of contents WITHOUT page numbers in this exact format:

Certificate
Declaration
Acknowledgement
Abstract
Executive Summary

CHAPTER I: INTRODUCTION
   Background of the Study
   Meaning and Concepts
   Importance in the Industry
   Objectives of the Study
   Scope of the Study
   Need and Significance
   Methodology
   Limitations

CHAPTER II: DESCRIPTION OF THE ORGANISATION
   Company Profile
   History
   Vision and Mission
   Organizational Structure
   Products and Services
   Market Presence
   Role of Marketing

CHAPTER III: EXPERIENTIAL LEARNING
   Internship Overview
   Department Worked
   Daily Activities and Tasks
   Skills and Knowledge Acquired
   Challenges Faced

CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION
   Outcomes of Internship
   Findings
   Operational Impact
   Key Learnings
   Suggestions and Recommendations
   Conclusion

BIBLIOGRAPHY

ANNEXURES)
 
 # LIST OF FIGURES
 (Placeholder list)
 
 # LIST OF TABLES
 (Placeholder list)
 
 # LIST OF ABBREVIATIONS
 (Include 10-15 relevant abbreviations used in the report)
 
 Write clear, professional content with formal academic English. Keep it concise.`
       },
       '1': {
         label: 'Chapter I: Introduction',
         prompt: `${baseContext}
 
Generate CHAPTER I: INTRODUCTION (2500-3500 words total, 5-8 pages equivalent).
 
CRITICAL INSTRUCTION: This chapter focuses ONLY on the internship TOPIC and FIELD OF STUDY. DO NOT mention any company name in this chapter. Focus purely on the subject matter, industry concepts, and academic aspects.

This chapter introduces the topic "${internshipTitle}", provides background information about the topic/field, and outlines the objectives and scope of the study.
 
 # CHAPTER I: INTRODUCTION
 
## 1.1 Background of the Study
(Write 400-500 words - Elaborate extensively on the industry context, historical development of the field related to ${topicSpecialization}, current market scenario, relevance of this study area, importance of internships in bridging academic and professional gaps. DO NOT mention any company name. Focus on the general industry and topic.)
 
## 1.2 Meaning of ${topicSpecialization}
(Write 350-450 words - Define and explain the core concept of ${topicSpecialization}, theoretical framework, key terminologies, evolution of the concept, its application in modern business context. Include definitions from various scholars. NO company references.)
 
## 1.3 Importance of ${topicSpecialization} in the Industry
(Write 350-450 words - Discuss why ${topicSpecialization} is crucial for the industry in general, industry statistics, competitive advantages it provides, current trends and future outlook. Elaborate with examples and data. NO company references - discuss the industry as a whole.)
 
## 1.4 Objectives of the Study
(Write a brief introductory paragraph followed by objectives in bullet format. Format as:
"The objectives of the study are:"
• To study [specific aspect related to ${topicSpecialization}]
• To analyse [specific aspect related to the internship topic]
• To experience [practical learning aspect during the internship]
• To understand [relevant business/industry aspect]
• To evaluate [assessment aspect related to the topic]
• To identify [discovery aspect]
Each objective should be a single clear sentence starting with "To". NO company name in objectives.)
 
## 1.5 Scope of the Study
(Write 250-350 words - Clearly define what is included and excluded, time period of ${internshipDuration}, functional areas covered related to ${topicSpecialization}, limitations of scope. NO company name - focus on the topic scope.)
 
## 1.6 Need and Significance of the Study
(Write 300-400 words - Justify the importance for academia, industry, and personal development. Explain the gap this study fills, contribution to existing knowledge about ${topicSpecialization}, practical relevance. NO company references.)
 
## 1.7 Research Methodology
(Write 250-350 words - Describe research design, data collection methods (primary/secondary), sampling techniques, tools used, observation and analysis techniques. Be comprehensive about the approach. NO company name.)
 
## 1.8 Limitations of the Study
(Write 200-300 words - Honestly discuss constraints faced during the study, time limitations, resource constraints, scope limitations, how they were managed. NO company references.)
 
CRITICAL RULES:
- DO NOT mention any company name anywhere in this chapter
- DO NOT include "(In-Depth)", "(In Deep)", or any similar markers
- Write naturally flowing academic prose
- No asterisks or bold formatting
- Focus purely on the topic/field of study`
       },
       '2': {
         label: 'Chapter II: Description of the Organisation',
         prompt: `${baseContext}
 
 Generate CHAPTER II: DESCRIPTION OF THE ORGANISATION (3000-4000 words total, 8-12 pages equivalent):
 
 This chapter provides a detailed description of ${companyName}, including its history, vision, mission, organizational structure, and the products and services it offers.
 
 # CHAPTER II: DESCRIPTION OF THE ORGANISATION
 
## 2.1 Company Profile
(Write 400-500 words - Comprehensive overview of ${companyName}, founding year, founders, headquarters at ${companyLocation}, nature of business, scale of operations, employee strength, annual turnover if available, key milestones. Provide rich company details.)
 
## 2.2 History of the Organisation
(Write 350-450 words - Detailed chronological development of the company, major events, expansion phases, acquisitions if any, evolution over the years, key turning points. Present as a narrative journey.)
 
## 2.3 Vision and Mission
(Write 300-400 words - State and elaborate on the company's vision statement, mission statement, core values, explain how these guide company operations, alignment with industry goals.)
 
## 2.4 Organizational Structure
(Write 350-450 words - Describe the hierarchy, departments, key positions, reporting structure, describe an organizational chart structure, management levels, decision-making process. Explain how the organization is structured.)
 
## 2.5 Products and Services
(Write 400-500 words - Detailed description of all major products/services offered by ${companyName}, unique selling propositions, product categories, service portfolio, pricing strategy overview, target customer segments. Be specific about offerings.)
 
## 2.6 Market Presence
(Write 300-400 words - Geographical presence, market share, distribution network, customer base, brand positioning, competitive standing in ${companyLocation} and beyond. Discuss market reach and positioning.)
 
## 2.7 Role of ${topicSpecialization} in the Organisation
(Write 400-500 words - Explain how ${topicSpecialization} functions within ${companyName}, its strategic importance, integration with other functions, investment in this area, specific initiatives and campaigns. Connect the topic to organizational strategy.)
 
IMPORTANT: DO NOT include "(In-Depth)", "(In Deep)", or any similar markers in the output. Write naturally flowing academic prose. No asterisks or bold formatting.`
       },
       '3': {
         label: 'Chapter III: Experiential Learning',
         prompt: `${baseContext}
 
 Generate CHAPTER III: EXPERIENTIAL LEARNING (2500-3500 words total, 6-10 pages equivalent):
 
 This chapter describes the intern's practical experience while working at ${companyName}, including tasks undertaken, skills acquired, challenges faced, and lessons learned during ${internshipDuration}.
 
 # CHAPTER III: EXPERIENTIAL LEARNING
 
## 3.1 Internship Overview
(Write 350-450 words - Comprehensive overview of the internship at ${companyName}, ${companyLocation}, role assigned, reporting structure, team members, department placement, initial orientation and training received. Set the context for the experience.)
 
## 3.2 Department Worked
(Write 300-400 words - Detailed description of the specific department/team, its functions, role in the organization, team composition, department objectives, KPIs monitored. Explain the departmental context.)
 
## 3.3 Daily Activities and Tasks Undertaken
(Write 500-600 words - Day-by-day or week-by-week breakdown of activities during ${internshipDuration}, specific tasks assigned, projects contributed to, responsibilities handled, tools and systems used. Provide detailed account of work performed.)
 
## 3.4 Skills and Knowledge Acquired
(Write 450-550 words - Comprehensive discussion of 8-10 technical and soft skills developed:
 - Technical skills related to ${topicSpecialization}
 - Software and tools proficiency
 - Industry-specific knowledge
 - Communication and presentation skills
 - Teamwork and collaboration
 - Problem-solving abilities
 - Time management
 - Professional conduct and workplace ethics)
 
## 3.5 Challenges Faced
(Write 350-450 words - Honest discussion of difficulties encountered, learning curve challenges, adaptation issues, how these were overcome, support received, lessons learned from each challenge. Be reflective and genuine.)
 
IMPORTANT: DO NOT include "(In-Depth)", "(In Deep)", or any similar markers in the output. Write naturally flowing academic prose. No asterisks or bold formatting.`
       },
       '4': {
         label: 'Chapter IV: Internship Outcomes and Conclusion',
         prompt: `${baseContext}
 
 Generate CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (2500-3500 words total, 6-10 pages equivalent):
 
 This chapter presents the outcomes of the internship, including findings related to ${topicSpecialization}. It includes a conclusion summarizing key points and recommendations for improvement.
 
 # CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION
 
## 4.1 Outcomes of Internship
(Write 350-450 words - Comprehensive summary of what was achieved during the internship, deliverables completed, contributions made to ${companyName}, tangible and intangible outcomes. Highlight achievements.)
 
## 4.2 Findings Related to ${topicSpecialization}
(Write 400-500 words - Present 5-7 major findings from the study, observations about how ${topicSpecialization} operates at ${companyName}, data-backed insights where possible, comparison with industry standards. Be analytical and insightful.)
 
## 4.3 Operational Impact on Business Performance
(Write 350-450 words - Analyze how ${topicSpecialization} impacts business results at ${companyName}, metrics observed, efficiency improvements, customer impact, revenue/cost implications. Connect marketing to business outcomes.)
 
## 4.4 Key Learnings
(Write 300-400 words - Consolidate the most important lessons from the internship, professional growth, personal development, knowledge gained, perspective changes. Be reflective about the learning journey.)
 
## 4.5 Suggestions and Recommendations
(Write 350-450 words - Provide 5-6 actionable recommendations for ${companyName} based on observations, suggest improvements, propose new initiatives, recommendations for future interns. Be constructive and practical.)
 
## 4.6 Conclusion
(Write 350-450 words - Comprehensive summary of the entire internship experience, achievement of stated objectives, personal and professional growth, future career aspirations, acknowledgment of the opportunity. End on a positive note.)
 
IMPORTANT: DO NOT include "(In-Depth)", "(In Deep)", or any similar markers in the output. Write naturally flowing academic prose. No asterisks or bold formatting.`
       },
       '5': {
         label: 'Bibliography & Annexures',
         prompt: `${baseContext}
 
 Generate BIBLIOGRAPHY AND ANNEXURES (800-1200 words total):
 
 # BIBLIOGRAPHY
 
 ## References
(Include 20-25 properly formatted references in APA style. Format each reference on its own line with proper indentation:
 - 6-8 academic journal articles relevant to ${topicSpecialization}
 - 4-5 books/textbooks on the subject
 - 3-4 industry reports and white papers
 - 2-3 brochures/catalogues/company documents
 - 5-6 reputable websites and online resources
 All references should be relevant to the internship topic and industry. Include publications from 2020-2026.)
 
 ---
 
 # ANNEXURES
 
 ## Annexure A: Internship Offer Letter
 (Placeholder for offer letter)
 
 ## Annexure B: Sample Work Documents
 (Placeholder for work samples)
 
 ## Annexure C: Photographs from Internship
 (Placeholder for photos)
 
 ## Annexure D: Weekly/Daily Report Samples
 (Placeholder for progress reports)
 
 ## Annexure E: Internship Completion Certificate
 (Placeholder for certificate)
 
 ## Annexure F: Supervisor Feedback Form
 (Placeholder for supervisor evaluation)
 
 ## Annexure G: Interview Transcripts/Survey Questionnaires (if applicable)
 (Placeholder for research instruments)
 
 ---
 
 **Student Declaration:**
 I, ${studentName} (Register No: ${registerNumber}), hereby declare that this internship project report titled "${internshipTitle}" is based on my genuine work experience at ${companyName}, ${companyLocation}. All data, findings, and information presented are authentic and have been prepared under the guidance of ${guideName}.
 
 I further declare that this report has not been submitted to any other institution for the award of any degree or diploma.
 
 Date: ${academicYear}
 Place: ${companyLocation}
 
 Signature of Student: _______________
 
Write clear, professional content with formal academic English. No markers like "(In-Depth)" in output.`
       }
     };
 
     // Part-specific prompts for generating chapters in smaller sections (for timeout fallback)
     const partPrompts: Record<string, Record<string, { prompt: string; label: string }>> = {
       'front': {
         'part1_certificate': {
           label: 'Front Matter (Certificate, Declaration, Acknowledgement)',
           prompt: `${baseContext}\n\nGenerate ONLY these sections (400-500 words total):\n\n# CERTIFICATE\n(Write 80-100 words)\n\n# DECLARATION\n(Write 100-120 words)\n\n# ACKNOWLEDGEMENT\n(Write 150-180 words)\n\nWrite clear, professional content.`
         },
         'part2_abstract': {
           label: 'Front Matter (Abstract, TOC, Lists)',
            prompt: `${baseContext}\n\nGenerate ONLY these sections (500-600 words total):\n\n# ABSTRACT\n(Write 200-250 words)\n\n# TABLE OF CONTENTS\n(Create a simple, clean table WITHOUT page numbers - just list: Certificate, Declaration, Acknowledgement, Abstract, CHAPTER I: INTRODUCTION with subsections, CHAPTER II: DESCRIPTION OF THE ORGANISATION with subsections, CHAPTER III: EXPERIENTIAL LEARNING with subsections, CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION with subsections, BIBLIOGRAPHY, ANNEXURES)\n\n# LIST OF FIGURES\n# LIST OF TABLES\n# LIST OF ABBREVIATIONS\n\nWrite clear, professional content.`
         }
       },
       '1': {
         'part1_background': {
           label: 'Chapter I (Background, Meaning)',
            prompt: `${baseContext}\n\n# CHAPTER I: INTRODUCTION (Part 1) - 800-1000 words total\n\n## 1.1 Background of the Study\n(Write 400-500 words on industry context for ${topicSpecialization}. Elaborate extensively.)\n\n## 1.2 Meaning of ${topicSpecialization}\n(Write 350-450 words on definition and theoretical framework. Include scholarly definitions.)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_importance': {
           label: 'Chapter I (Importance, Objectives)',
            prompt: `${baseContext}\n\n# CHAPTER I: INTRODUCTION (Part 2) - 700-900 words total\n\n## 1.3 Importance of ${topicSpecialization} in the Industry\n(Write 350-450 words elaborating on industry significance)\n\n## 1.4 Objectives of the Study\n(Write a brief intro then list objectives as bullet points starting with "To study...", "To analyse...", "To experience...", "To understand...", "To evaluate...", "To identify...")\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_scope': {
           label: 'Chapter I (Scope, Need, Methodology, Limitations)',
            prompt: `${baseContext}\n\n# CHAPTER I: INTRODUCTION (Part 3) - 900-1100 words total\n\n## 1.5 Scope of the Study\n(Write 250-350 words on boundaries and coverage)\n\n## 1.6 Need and Significance of the Study\n(Write 300-400 words justifying importance)\n\n## 1.7 Research Methodology\n(Write 250-350 words on research approach and data collection)\n\n## 1.8 Limitations of the Study\n(Write 200-300 words on constraints faced)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '2': {
         'part1_company': {
           label: 'Chapter II (Profile, History, Vision)',
            prompt: `${baseContext}\n\n# CHAPTER II: DESCRIPTION OF THE ORGANISATION (Part 1) - 1000-1200 words total\n\n## 2.1 Company Profile\n(Write 400-500 words on ${companyName} comprehensive overview)\n\n## 2.2 History of the Organisation\n(Write 350-450 words on chronological development)\n\n## 2.3 Vision and Mission\n(Write 300-400 words on company vision, mission, values)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_structure': {
           label: 'Chapter II (Structure, Products, Market)',
            prompt: `${baseContext}\n\n# CHAPTER II: DESCRIPTION OF THE ORGANISATION (Part 2) - 1100-1400 words total\n\n## 2.4 Organizational Structure\n(Write 350-450 words on hierarchy and departments)\n\n## 2.5 Products and Services\n(Write 400-500 words on detailed offerings)\n\n## 2.6 Market Presence\n(Write 300-400 words on geographical presence and positioning)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_role': {
           label: 'Chapter II (Role of Topic in Organisation)',
            prompt: `${baseContext}\n\n# CHAPTER II: DESCRIPTION OF THE ORGANISATION (Part 3) - 400-500 words total\n\n## 2.7 Role of ${topicSpecialization} in the Organisation\n(Write 400-500 words on strategic importance and initiatives)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '3': {
         'part1_overview': {
           label: 'Chapter III (Overview, Department)',
            prompt: `${baseContext}\n\n# CHAPTER III: EXPERIENTIAL LEARNING (Part 1) - 700-900 words total\n\n## 3.1 Internship Overview\n(Write 350-450 words on comprehensive internship overview)\n\n## 3.2 Department Worked\n(Write 300-400 words on department details and functions)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_activities': {
           label: 'Chapter III (Activities, Skills)',
            prompt: `${baseContext}\n\n# CHAPTER III: EXPERIENTIAL LEARNING (Part 2) - 1000-1200 words total\n\n## 3.3 Daily Activities and Tasks Undertaken\n(Write 500-600 words for ${internshipDuration} with detailed account)\n\n## 3.4 Skills and Knowledge Acquired\n(Write 450-550 words on 8-10 technical and soft skills developed)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_challenges': {
           label: 'Chapter III (Challenges)',
            prompt: `${baseContext}\n\n# CHAPTER III: EXPERIENTIAL LEARNING (Part 3) - 350-450 words total\n\n## 3.5 Challenges Faced\n(Write 350-450 words on difficulties encountered and how they were overcome)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '4': {
         'part1_outcomes': {
           label: 'Chapter IV (Outcomes, Findings)',
            prompt: `${baseContext}\n\n# CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (Part 1) - 800-1000 words total\n\n## 4.1 Outcomes of Internship\n(Write 350-450 words on achievements and deliverables)\n\n## 4.2 Findings Related to ${topicSpecialization}\n(Write 400-500 words presenting 5-7 major findings)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part2_impact': {
           label: 'Chapter IV (Impact, Learnings)',
            prompt: `${baseContext}\n\n# CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (Part 2) - 700-900 words total\n\n## 4.3 Operational Impact on Business Performance\n(Write 350-450 words analyzing business impact)\n\n## 4.4 Key Learnings\n(Write 300-400 words on most important lessons)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         },
         'part3_conclusion': {
           label: 'Chapter IV (Suggestions, Conclusion)',
            prompt: `${baseContext}\n\n# CHAPTER IV: INTERNSHIP OUTCOMES AND CONCLUSION (Part 3) - 700-900 words total\n\n## 4.5 Suggestions and Recommendations\n(Write 350-450 words with 5-6 actionable recommendations)\n\n## 4.6 Conclusion\n(Write 350-450 words summarizing experience and future aspirations)\n\nWrite clear, professional content. NO "(In-Depth)" markers in output.`
         }
       },
       '5': {
         'part1_references': {
           label: 'Bibliography',
           prompt: `${baseContext}\n\n# BIBLIOGRAPHY - 600-800 words total\n\n## References\n(Include 20-25 APA style references relevant to ${topicSpecialization}:\n- 6-8 journal articles\n- 4-5 books\n- 3-4 industry reports\n- 2-3 brochures/company documents\n- 5-6 websites)\n\nWrite clear, properly formatted references.`
         },
         'part2_annexures': {
           label: 'Annexures & Declaration',
           prompt: `${baseContext}\n\n# ANNEXURES\n\n## Annexure A: Internship Offer Letter (placeholder)\n## Annexure B: Sample Work Documents (placeholder)\n## Annexure C: Photographs from Internship (placeholder)\n## Annexure D: Weekly Report Samples (placeholder)\n## Annexure E: Internship Completion Certificate (placeholder)\n## Annexure F: Supervisor Feedback Form (placeholder)\n## Annexure G: Interview Transcripts/Survey Questionnaires (placeholder)\n\n---\n\n**Student Declaration:**\nI, ${studentName} (Register No: ${registerNumber}), hereby declare that this internship report titled "${internshipTitle}" is based on my genuine work at ${companyName}, ${companyLocation}. Prepared under guidance of ${guideName}.\n\nDate: ${academicYear}\nPlace: ${companyLocation}\n\nSignature of Student: _______________`
         }
       }
      };

      const thesisPartPrompts: Record<string, Record<string, { label: string; prompt: string }>> = {};

      // ===== PROJECT / THESIS specific structures =====
      if (reportKind !== 'internship') {
        const isThesis = reportKind === 'thesis';
        const docLabel = isThesis ? 'THESIS / DISSERTATION' : 'PROJECT REPORT';
        const title = internshipTitle;
        const altBase = `Student: ${studentName}, Reg: ${registerNumber}, Course: ${course}
College: ${collegeName}, University: ${university}, Guide: ${guideName}
${isThesis ? 'Research Title' : 'Project Title'}: ${title}
${companyName ? `Organisation / Case Study: ${companyName}` : 'No company involved — this is an academic study.'}
Academic Year: ${academicYear}
Topic focus: ${topicSpecialization}
Student-provided details: ${topicDetails}
Target: ${pagesCount} pages total (MAXIMUM ${maxPagesLabel} overall)

THIS IS A ${docLabel}. It is NOT an internship report.
- NEVER write about an internship, intern duties, internship duration, daily tasks at a company, supervisor feedback, or "experiential learning".
- Write as an academic ${isThesis ? 'research thesis' : 'project study'} on "${title}".

GLOBAL FORMATTING REQUIREMENTS:
- Explain every concept in DEPTH: 1-2 detailed paragraphs, then bullet points, then a closing paragraph.
- Heading hierarchy: # H1 (chapter title), ## H2, ### H3, #### H4.
- Add at least one relevant Markdown table per chapter.
- ${isThesis ? `Scale chapter depth to approximately ${pagesCount} pages total. Use the expanded word-count targets in each section.` : 'Each chapter starts on a NEW PAGE; keep total within 50 pages.'}
- No asterisks, no "(In-Depth)" markers, formal academic English.`;

       const P = (label: string, prompt: string) => ({ label, prompt: `${altBase}\n\n${prompt}` });

        chapterPrompts['front'] = P(
          'Front Matter',
          isThesis
            ? `Generate the FRONT MATTER for a ${docLabel} titled "${title}" (${scaled(1500, 2000)} words):

# CERTIFICATE
(Formal certificate from the guide/department certifying this thesis — ${scaledSingle(90)} words, signature placeholders for Guide, HOD, Principal, External Examiner)

# DECLARATION
(Student declaration of original research work — ${scaledSingle(110)} words)

# ACKNOWLEDGEMENT
(${scaled(150, 180)} words thanking guide, department, institution, respondents, family)

# ABSTRACT
(${scaled(200, 250)} words: problem, research questions and hypotheses, methodology, key findings, conclusion)

# SYNOPSIS
(${scaled(300, 400)} words overview of the whole thesis)

# TABLE OF CONTENTS
(Clean list without page numbers matching this structure:
CHAPTER I: INTRODUCTION
CHAPTER II: REVIEW OF LITERATURE
CHAPTER III: RESEARCH METHODOLOGY
CHAPTER IV: DATA ANALYSIS AND INTERPRETATION
CHAPTER V: FINDINGS, SUGGESTIONS AND CONCLUSION
BIBLIOGRAPHY
ANNEXURES)

# LIST OF FIGURES
# LIST OF TABLES
# LIST OF ABBREVIATIONS
(10-15 relevant abbreviations)`
            : `Generate the FRONT MATTER for a ${docLabel} titled "${title}" (1500-2000 words):

# CERTIFICATE
(Formal certificate from the guide/department certifying this project work — 80-100 words, signature placeholders for Guide, HOD, Principal, External Examiner)

# DECLARATION
(Student declaration of original project work — 100-120 words)

# ACKNOWLEDGEMENT
(150-180 words thanking guide, department, institution, respondents, family)

# ABSTRACT
(200-250 words: problem, objectives, methodology, key findings, conclusion)

# EXECUTIVE SUMMARY
(300-400 words overview of the whole project)

# TABLE OF CONTENTS
(Clean list without page numbers matching this structure:
CHAPTER I: INTRODUCTION
CHAPTER II: PROFILE / THEORETICAL BACKGROUND
CHAPTER III: RESEARCH DESIGN AND METHODOLOGY
CHAPTER IV: DATA ANALYSIS AND INTERPRETATION
CHAPTER V: FINDINGS, SUGGESTIONS AND CONCLUSION
BIBLIOGRAPHY
ANNEXURES)

# LIST OF FIGURES
# LIST OF TABLES
# LIST OF ABBREVIATIONS
(10-15 relevant abbreviations)`
        );

        chapterPrompts['1'] = P(
          'Chapter I: Introduction',
          isThesis
            ? `Generate CHAPTER I: INTRODUCTION (${scaled(2500, 3500)} words) for the THESIS "${title}".

# CHAPTER I: INTRODUCTION

## 1.1 Background of the Study
## 1.2 Theoretical Concepts related to ${topicSpecialization}
## 1.3 Statement of the Problem
## 1.4 Research Questions and Hypotheses
## 1.5 Scope of the Study
## 1.6 Significance / Need of the Study
## 1.7 Limitations of the Study
## 1.8 Chapter Scheme

(Write ${scaled(300, 500)} words per section. No internship content.)`
            : `Generate CHAPTER I: INTRODUCTION (2500-3500 words) for the PROJECT REPORT "${title}".

# CHAPTER I: INTRODUCTION

## 1.1 Background of the Study
## 1.2 Theoretical Concepts related to ${topicSpecialization}
## 1.3 Statement of the Problem
## 1.4 Objectives of the Study
## 1.5 Scope of the Study
## 1.6 Significance / Need of the Study
## 1.7 Limitations of the Study
## 1.8 Chapter Scheme

(Write 300-500 words per section. No internship content.)`
        );

       chapterPrompts['2'] = P(
          isThesis ? 'Chapter II: Review of Literature' : 'Chapter II: Theoretical Background / Profile',
          isThesis
            ? `Generate CHAPTER II: REVIEW OF LITERATURE (${scaled(2500, 3500)} words) for "${title}".

# CHAPTER II: REVIEW OF LITERATURE

## 2.1 Introduction to the Review
## 2.2 Conceptual Framework
## 2.3 Review of National Studies (summarise ${Math.round(8 * thesisScale)}-${Math.round(10 * thesisScale)} studies, author + year + findings)
## 2.4 Review of International Studies (summarise ${Math.round(8 * thesisScale)}-${Math.round(10 * thesisScale)} studies)
## 2.5 Research Gap Identified
## 2.6 Summary

(Include a Markdown table summarising Author / Year / Objective / Findings. Write ${scaled(300, 500)} words per section.)`
            : `Generate CHAPTER II: THEORETICAL BACKGROUND AND PROFILE (2500-3500 words) for "${title}".

# CHAPTER II: THEORETICAL BACKGROUND AND PROFILE

## 2.1 Theoretical Framework of ${topicSpecialization}
## 2.2 Industry Overview
## 2.3 ${companyName ? `Profile of ${companyName} (history, vision, mission, structure, products)` : 'Profile of the Study Area / Sector'}
## 2.4 Review of Related Literature (6-8 studies with author and year)
## 2.5 Research Gap
## 2.6 Summary`
        );

       chapterPrompts['3'] = P(
          'Chapter III: Research Design and Methodology',
          isThesis
            ? `Generate CHAPTER III: RESEARCH DESIGN AND METHODOLOGY (${scaled(2000, 3000)} words) for "${title}".

# CHAPTER III: RESEARCH DESIGN AND METHODOLOGY

## 3.1 Research Design
## 3.2 Hypotheses
## 3.3 Sources of Data (primary and secondary)
## 3.4 Sampling Design (population, sample size, technique)
## 3.5 Tools of Data Collection (questionnaire/interview schedule design)
## 3.6 Statistical Tools Used (percentage analysis, chi-square, correlation, regression as appropriate)
## 3.7 Period of Study
## 3.8 Limitations of the Methodology

(Write ${scaled(250, 400)} words per section.)`
            : `Generate CHAPTER III: RESEARCH DESIGN AND METHODOLOGY (2000-3000 words) for "${title}".

# CHAPTER III: RESEARCH DESIGN AND METHODOLOGY

## 3.1 Research Design
## 3.2 Objectives Restated
## 3.3 Sources of Data (primary and secondary)
## 3.4 Sampling Design (population, sample size, technique)
## 3.5 Tools of Data Collection (questionnaire/interview schedule design)
## 3.6 Statistical Tools Used (percentage analysis, chi-square, correlation, regression as appropriate)
## 3.7 Period of Study
## 3.8 Limitations of the Methodology`
        );

        chapterPrompts['4'] = P(
          'Chapter IV: Data Analysis and Interpretation',
          isThesis
            ? `Generate CHAPTER IV: DATA ANALYSIS AND INTERPRETATION (${scaled(2500, 3500)} words) for "${title}".

Present ${Math.round(8 * thesisScale)}-${Math.round(12 * thesisScale)} analysed items. For each: a Markdown table of illustrative data (respondents / frequency / percentage), followed by interpretation paragraphs.

## 4.1 Demographic Profile of Respondents
## 4.2 Analysis related to ${topicSpecialization}
## 4.3 Hypothesis Testing (state hypothesis, test applied, statistic, decision)
## 4.4 Summary of Analysis

(Clearly label every table as Table 4.x with a title. Data may be realistic illustrative data.)`
            : `Generate CHAPTER IV: DATA ANALYSIS AND INTERPRETATION (2500-3500 words) for "${title}".

Present 8-12 analysed items. For each: a Markdown table of illustrative data (respondents / frequency / percentage), followed by interpretation paragraphs.

## 4.1 Demographic Profile of Respondents
## 4.2 Analysis related to ${topicSpecialization}
## 4.3 Comparative Analysis
## 4.4 Summary of Analysis

(Clearly label every table as Table 4.x with a title. Data may be realistic illustrative data.)`
        );

        chapterPrompts['5'] = P(
          'Chapter V: Findings, Suggestions & Conclusion + Bibliography',
          isThesis
            ? `Generate CHAPTER V plus BIBLIOGRAPHY and ANNEXURES (${scaled(2000, 2500)} words) for "${title}".

# CHAPTER V: FINDINGS, SUGGESTIONS AND CONCLUSION

## 5.1 Major Findings (${Math.round(10 * thesisScale)}-${Math.round(12 * thesisScale)} numbered findings)
## 5.2 Suggestions and Recommendations (${Math.round(8 * thesisScale)}-${Math.round(10 * thesisScale)} actionable points)
## 5.3 Scope for Further Research
## 5.4 Conclusion

# BIBLIOGRAPHY
(${Math.round(25 * thesisScale)}-${Math.round(30 * thesisScale)} APA references: journals, books, reports, websites, published 2018-2026)

# ANNEXURES
## Annexure A: Questionnaire / Interview Schedule (write a full ${Math.round(20 * thesisScale)}-question instrument)
## Annexure B: Statistical Output Tables (placeholder)
## Annexure C: Plagiarism / Similarity Report (placeholder)`
            : `Generate CHAPTER V plus BIBLIOGRAPHY and ANNEXURES (2000-2500 words) for "${title}".

# CHAPTER V: FINDINGS, SUGGESTIONS AND CONCLUSION

## 5.1 Major Findings (10-12 numbered findings)
## 5.2 Suggestions and Recommendations (8-10 actionable points)
## 5.3 Scope for Further Research
## 5.4 Conclusion

# BIBLIOGRAPHY
(25-30 APA references: journals, books, reports, websites, published 2018-2026)

# ANNEXURES
## Annexure A: Questionnaire / Interview Schedule (write a full 20-question instrument)
## Annexure B: Statistical Output Tables (placeholder)
## Annexure C: Plagiarism / Similarity Report (placeholder)

**Declaration:** I, ${studentName} (Reg. No: ${registerNumber}), declare that this ${isThesis ? 'thesis' : 'project report'} titled "${title}" is my original work carried out under the guidance of ${guideName}.

Date: ${academicYear}
Signature of Candidate: _______________`
        );
      }

      if (isThesis) {
        thesisPartPrompts['front'] = {
          'part1': {
            label: 'Front Matter Part 1',
            prompt: `${altBase}\n\nGenerate the FIRST HALF of the FRONT MATTER for the thesis "${title}" (${scaled(700, 1000)} words):\n\n# CERTIFICATE\n(Formal certificate from guide/department — ${scaledSingle(90)} words)\n\n# DECLARATION\n(Student declaration of original research — ${scaledSingle(110)} words)\n\n# ACKNOWLEDGEMENT\n(${scaled(150, 180)} words thanking guide, department, institution, respondents, family)`
          },
          'part2': {
            label: 'Front Matter Part 2',
            prompt: `${altBase}\n\nGenerate the SECOND HALF of the FRONT MATTER for the thesis "${title}" (${scaled(800, 1200)} words):\n\n# ABSTRACT\n(${scaled(200, 250)} words: problem, research questions and hypotheses, methodology, key findings, conclusion)\n\n# SYNOPSIS\n(${scaled(300, 400)} words overview of the whole thesis)\n\n# TABLE OF CONTENTS\n(Clean list without page numbers: CHAPTER I–V, BIBLIOGRAPHY, ANNEXURES)\n\n# LIST OF FIGURES\n# LIST OF TABLES\n# LIST OF ABBREVIATIONS`
          }
        };

        thesisPartPrompts['1'] = {
          'part1': {
            label: 'Chapter I Part 1',
            prompt: `${altBase}\n\nGenerate the FIRST HALF of CHAPTER I: INTRODUCTION for the thesis "${title}" (${scaled(1200, 1800)} words):\n\n## 1.1 Background of the Study\n## 1.2 Theoretical Concepts related to ${topicSpecialization}\n## 1.3 Statement of the Problem\n\n(Write ${scaled(400, 600)} words per section. No internship content.)`
          },
          'part2': {
            label: 'Chapter I Part 2',
            prompt: `${altBase}\n\nGenerate the SECOND HALF of CHAPTER I: INTRODUCTION for the thesis "${title}" (${scaled(1300, 1700)} words):\n\n## 1.4 Research Questions and Hypotheses\n## 1.5 Scope of the Study\n## 1.6 Significance / Need of the Study\n## 1.7 Limitations of the Study\n## 1.8 Chapter Scheme\n\n(Write ${scaled(250, 400)} words per section. No internship content.)`
          }
        };

        thesisPartPrompts['2'] = {
          'part1': {
            label: 'Chapter II Part 1',
            prompt: `${altBase}\n\nGenerate the FIRST HALF of CHAPTER II: REVIEW OF LITERATURE for "${title}" (${scaled(1200, 1800)} words):\n\n## 2.1 Introduction to the Review\n## 2.2 Conceptual Framework\n## 2.3 Review of National Studies (summarise ${Math.round(4 * thesisScale)}-${Math.round(5 * thesisScale)} studies, author + year + findings)\n\n(Include a Markdown table: Author / Year / Objective / Findings. Write ${scaled(350, 600)} words per section.)`
          },
          'part2': {
            label: 'Chapter II Part 2',
            prompt: `${altBase}\n\nGenerate the SECOND HALF of CHAPTER II: REVIEW OF LITERATURE for "${title}" (${scaled(1300, 1700)} words):\n\n## 2.4 Review of International Studies (summarise ${Math.round(4 * thesisScale)}-${Math.round(5 * thesisScale)} studies)\n## 2.5 Research Gap Identified\n## 2.6 Summary\n\n(Include a Markdown table: Author / Year / Objective / Findings. Write ${scaled(400, 600)} words per section.)`
          }
        };

        thesisPartPrompts['3'] = {
          'part1': {
            label: 'Chapter III Part 1',
            prompt: `${altBase}\n\nGenerate the FIRST HALF of CHAPTER III: RESEARCH DESIGN AND METHODOLOGY for "${title}" (${scaled(1000, 1500)} words):\n\n## 3.1 Research Design\n## 3.2 Hypotheses\n## 3.3 Sources of Data (primary and secondary)\n## 3.4 Sampling Design (population, sample size, technique)\n\n(Write ${scaled(250, 400)} words per section.)`
          },
          'part2': {
            label: 'Chapter III Part 2',
            prompt: `${altBase}\n\nGenerate the SECOND HALF of CHAPTER III: RESEARCH DESIGN AND METHODOLOGY for "${title}" (${scaled(1000, 1500)} words):\n\n## 3.5 Tools of Data Collection (questionnaire/interview schedule design)\n## 3.6 Statistical Tools Used (percentage analysis, chi-square, correlation, regression as appropriate)\n## 3.7 Period of Study\n## 3.8 Limitations of the Methodology\n\n(Write ${scaled(250, 400)} words per section.)`
          }
        };

        thesisPartPrompts['4'] = {
          'part1': {
            label: 'Chapter IV Part 1',
            prompt: `${altBase}\n\nGenerate the FIRST HALF of CHAPTER IV: DATA ANALYSIS AND INTERPRETATION for "${title}" (${scaled(1200, 1800)} words):\n\n## 4.1 Demographic Profile of Respondents\n## 4.2 Analysis related to ${topicSpecialization} — Items 1 to ${Math.round(4 * thesisScale)}\n\nFor each item: a Markdown table of illustrative data (respondents / frequency / percentage), followed by interpretation paragraphs. Clearly label every table as Table 4.x with a title.`
          },
          'part2': {
            label: 'Chapter IV Part 2',
            prompt: `${altBase}\n\nGenerate the SECOND HALF of CHAPTER IV: DATA ANALYSIS AND INTERPRETATION for "${title}" (${scaled(1300, 1700)} words):\n\n## 4.2 Analysis related to ${topicSpecialization} — Items ${Math.round(4 * thesisScale) + 1} to ${Math.round(8 * thesisScale)}\n## 4.3 Hypothesis Testing (state hypothesis, test applied, statistic, decision)\n## 4.4 Summary of Analysis\n\nFor each item: a Markdown table of illustrative data, followed by interpretation paragraphs. Clearly label every table as Table 4.x with a title.`
          }
        };

        thesisPartPrompts['5'] = {
          'part1': {
            label: 'Chapter V Part 1',
            prompt: `${altBase}\n\nGenerate CHAPTER V: FINDINGS, SUGGESTIONS AND CONCLUSION for "${title}" (${scaled(1000, 1500)} words):\n\n## 5.1 Major Findings (${Math.round(10 * thesisScale)}-${Math.round(12 * thesisScale)} numbered findings)\n## 5.2 Suggestions and Recommendations (${Math.round(8 * thesisScale)}-${Math.round(10 * thesisScale)} actionable points)\n## 5.3 Scope for Further Research\n## 5.4 Conclusion\n\n(Write ${scaled(250, 400)} words per section.)`
          },
          'part2': {
            label: 'Chapter V Part 2',
            prompt: `${altBase}\n\nGenerate BIBLIOGRAPHY and ANNEXURES for "${title}" (${scaled(1000, 1500)} words):\n\n# BIBLIOGRAPHY\n(${Math.round(25 * thesisScale)}-${Math.round(30 * thesisScale)} APA references: journals, books, reports, websites, published 2018-2026)\n\n# ANNEXURES\n## Annexure A: Questionnaire / Interview Schedule (write a full ${Math.round(20 * thesisScale)}-question instrument)\n## Annexure B: Statistical Output Tables (placeholder)\n## Annexure C: Plagiarism / Similarity Report (placeholder)`
          }
        };
      }

     // Determine which prompt to use
     let chapterPrompt: string;
     let chapterLabel: string;
     
      const activePartPrompts = reportKind === 'thesis' ? thesisPartPrompts : partPrompts;
      if (chapter && part && activePartPrompts[chapter]?.[part]) {
        chapterPrompt = activePartPrompts[chapter][part].prompt;
        chapterLabel = activePartPrompts[chapter][part].label;
        console.log(`Generating part: ${part} of ${chapter}...`);
      } else if (chapter && chapterPrompts[chapter]) {
        chapterPrompt = chapterPrompts[chapter].prompt;
        chapterLabel = chapterPrompts[chapter].label;
      } else {
        chapterPrompt = chapterPrompts['front'].prompt;
        chapterLabel = "Front Matter";
      }
     
     console.log(`Generating ${chapterLabel}...`);
     
     // 120-second timeout
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 120000);
     
     let generatedContent = "";
     
     try {
        const response = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                 content: `You are an expert academic writer creating an internship project report for an Indian university student. Write clear, professional content with formal academic language.
 
 CRITICAL FORMATTING RULES:
 1. Each section MUST be comprehensive and deeply elaborated with multiple paragraphs. Write MORE content than requested - aim for the upper end of word counts.
 2. Use ## for section headers only - NO asterisks, bold, or italic formatting
 3. DO NOT include "(In-Depth)", "(In Deep)", "In-Depth:", or any similar markers in the output
 4. For "Objectives of the Study" section, format as: brief intro sentence followed by bullet points starting with "To study...", "To analyse...", "To experience...", etc.
 5. Table of contents should be simple - just section names without page numbers
 6. Write naturally flowing academic prose without any instruction markers
 7. Include real-world examples, statistics, and industry references to make content richer
 8. Each paragraph should be at least 4-5 sentences long for depth and substance
 9. Use transitional phrases between paragraphs for smooth flow`
              },
              {
                role: "user",
                content: chapterPrompt + (body.preferences?.includeAppendix === false ? "\nDo not add appendices." : "") + (Array.isArray(body.preferences?.customToc) ? "\nUse these report section titles and items: " + JSON.stringify(body.preferences.customToc).slice(0, 6000) : "")
              }
            ],
            max_tokens: 8000,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
 
       clearTimeout(timeoutId);
 
        if (!response.ok) {
          const errorText = await response.text();
          console.error("DeepSeek API error:", response.status, errorText);
          if (response.status === 402 || /insufficient/i.test(errorText)) {
            return new Response(
              JSON.stringify({ error: "Report writing is temporarily unavailable. Please try again later.", code: "ai_unavailable" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw new Error(`DeepSeek API error: ${response.status}`);
        }
 
       const data = await response.json();
       generatedContent = data.choices[0]?.message?.content || "";

        // Clean up any markers or formatting artifacts from the output
        generatedContent = generatedContent.replace(/\(In-Depth\)/gi, '');
        generatedContent = generatedContent.replace(/\(In Deep\)/gi, '');
        generatedContent = generatedContent.replace(/In-Depth:/gi, '');
        generatedContent = generatedContent.replace(/In Deep:/gi, '');
        generatedContent = generatedContent.replace(/\*\*/g, '');
        generatedContent = generatedContent.replace(/\*/g, '');

        console.log(`API call completed successfully for ${chapterLabel}, content length: ${generatedContent.length}`);
     } catch (fetchError: unknown) {
       clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(`AI API call timed out after 120 seconds`);
          throw new Error('AI generation timed out. Please try again.');
        }
       throw fetchError;
     }
 
     if (!generatedContent) {
       throw new Error("No content generated");
     }
 
     // Claim only after the provider succeeds; unavailable writing never spends an allowance.
     const { data: creditRes, error: creditErr } = await supabase.rpc('claim_report_generation', { _report_id: reportId });
     if (creditErr || !creditRes?.ok) return new Response(JSON.stringify({ error: 'Generation limit reached. Upgrade or top up to continue.', reason: creditRes?.reason }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
     if (creditRes.free && reportKind === 'internship' && chapter === '5') return new Response(JSON.stringify({ error: 'Bibliography requires Pro.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

     if (chapter) {
       console.log(`Chapter ${chapter} generated successfully for user:`, userId);
       return new Response(
         JSON.stringify({
           content: generatedContent,
           chapter: chapter,
           label: chapterLabel,
         }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { data: report, error: reportError } = await supabase.from('reports').update({ report_content: generatedContent, report_kind: reportKind, status: 'completed' }).eq('id', reportId).eq('user_id', userId).select('id').single();

     if (reportError) {
       console.error("Report save error:", reportError);
       throw new Error("Failed to save report");
     }
 
     console.log("Report generated and saved successfully for user:", userId);
 
     return new Response(
       JSON.stringify({
         content: generatedContent,
         reportId: report.id,
         generationsUsed: newCount,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Generate report error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate report" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });