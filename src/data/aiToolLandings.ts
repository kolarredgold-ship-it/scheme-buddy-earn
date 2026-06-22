// SEO landing-page content for each AI tool.
// Slug = URL segment under /ai/:slug. `toolPath` = actual tool to open.

export interface AIToolLanding {
  slug: string;
  toolPath: string;
  title: string;          // <title>
  metaDescription: string;
  h1: string;
  tagline: string;
  icon: string;
  gradient: string;       // tailwind from-/to-
  intro: string;          // paragraph under H1
  benefits: { title: string; desc: string }[];
  howItWorks: string[];
  useCases: string[];
  faqs: { q: string; a: string }[];
  cta: string;            // CTA button label
  keywords: string;
}

export const aiToolLandings: AIToolLanding[] = [
  {
    slug: "internship-report-generator",
    toolPath: "/create-report",
    title: "AI Internship Report Generator — Free DOCX Download | Techrola",
    metaDescription:
      "Generate a professional internship report in minutes with AI. Auto-formatted DOCX download for college submissions. Free to start.",
    h1: "AI Internship Report Generator for Indian Students",
    tagline: "Submission-ready internship report in under 3 minutes.",
    icon: "📄",
    gradient: "from-blue-500 to-cyan-500",
    intro:
      "Write a polished internship report without spending a weekend on formatting. Our AI Internship Report Generator builds a complete, college-ready document with abstract, weekly work log, technologies used, learnings and conclusion — all delivered as a downloadable Microsoft Word (DOCX) file.",
    benefits: [
      { title: "College-format ready", desc: "Standard sections — Acknowledgement, Abstract, Modules, Conclusion." },
      { title: "Editable DOCX", desc: "Download a Word file you can tweak before submission." },
      { title: "Built for India", desc: "Tuned for Indian university and polytechnic report styles." },
      { title: "1 free report", desc: "Try once for free, upgrade to Pro for more." },
    ],
    howItWorks: [
      "Enter your name, college, internship company and duration.",
      "Add a few bullet points on the work you did.",
      "AI drafts the full report in seconds.",
      "Download the DOCX and submit.",
    ],
    useCases: [
      "B.Tech / B.E. / Polytechnic internship submissions",
      "MBA summer internship reports",
      "MCA / BCA industrial training reports",
      "Virtual internship documentation",
    ],
    faqs: [
      { q: "Is the report formatted to my college's template?", a: "It uses a widely-accepted university format. You can fine-tune fonts and headings in Word after download." },
      { q: "Can I edit the report?", a: "Yes. It's a standard DOCX file — open in Word, Google Docs or LibreOffice." },
      { q: "Is the first report free?", a: "Yes. Free users get 1 report. Pro users get more, with the option to top up." },
    ],
    cta: "Generate My Report",
    keywords: "internship report generator, AI internship report, DOCX internship report India",
  },
  {
    slug: "mock-interview",
    toolPath: "/mock-interview",
    title: "AI Mock Interview Practice — Instant Feedback | Techrola",
    metaDescription:
      "Practice job interviews with AI. Role-specific questions, instant feedback and 3400+ flashcards. Free mock interview rounds.",
    h1: "AI Mock Interview Practice for Freshers & Job-Seekers",
    tagline: "Real interview prep — without the awkward Zoom call.",
    icon: "🤖",
    gradient: "from-purple-500 to-pink-500",
    intro:
      "Practice technical, HR and aptitude rounds with an AI interviewer that adapts to your role and experience. Get instant, honest feedback on your answers and build confidence before the real thing.",
    benefits: [
      { title: "Role-specific questions", desc: "Choose from software, marketing, finance, design and more." },
      { title: "Instant AI feedback", desc: "See what worked, what didn't, and how to improve." },
      { title: "3,400+ flashcards", desc: "Quick-revise common questions across every major track." },
      { title: "Privacy-first", desc: "Practice solo, judgment-free, on your phone." },
    ],
    howItWorks: [
      "Pick your role and difficulty.",
      "Answer questions one at a time.",
      "Read AI feedback after every answer.",
      "Repeat until you're sharp.",
    ],
    useCases: [
      "Campus placements",
      "Off-campus drives & walk-ins",
      "HR / behavioural round prep",
      "Coding & technical interview warm-up",
    ],
    faqs: [
      { q: "Is this voice-based?", a: "The standard mock interview is text-based. For voice, try our AI Live HR Interview." },
      { q: "How realistic are the questions?", a: "They mirror real Indian hiring rounds — TCS, Infosys, Wipro, startup style and more." },
      { q: "Is it free?", a: "Yes, with daily free rounds. Pro unlocks unlimited practice." },
    ],
    cta: "Start Mock Interview",
    keywords: "AI mock interview, online interview practice, HR interview prep India",
  },
  {
    slug: "live-hr-interview",
    toolPath: "/live-hr-interview",
    title: "AI Live HR Interview Simulator — Voice + Verdict | Techrola",
    metaDescription:
      "Live, voice-based HR interview with an AI recruiter. Real-time questions, verdict and detailed feedback after the round.",
    h1: "AI Live HR Interview Simulator",
    tagline: "A real HR round — with an AI that actually listens.",
    icon: "🎯",
    gradient: "from-emerald-500 to-teal-500",
    intro:
      "Step into a live, voice-driven HR interview with an AI recruiter. Answer real recruiter questions, get a hire/no-hire verdict, and read a detailed report on tone, clarity, content and confidence.",
    benefits: [
      { title: "Voice-based round", desc: "Speak naturally, just like a real HR call." },
      { title: "Hire / no-hire verdict", desc: "Honest result based on your full transcript." },
      { title: "Detailed feedback", desc: "Strengths, weak spots and specific things to fix." },
      { title: "Re-attempt anytime", desc: "Run it again until your verdict flips." },
    ],
    howItWorks: [
      "Pick the role you're interviewing for.",
      "Allow mic access and begin the call.",
      "Answer 5–7 HR questions live.",
      "Receive verdict and feedback instantly.",
    ],
    useCases: [
      "Final-round HR prep",
      "Salary-negotiation rehearsal",
      "Improving spoken English fluency",
      "Switching jobs after a long gap",
    ],
    faqs: [
      { q: "Do I need a good mic?", a: "Any phone or laptop mic works. Use a quiet room for best transcription." },
      { q: "Is my audio stored?", a: "Audio is processed for transcript and feedback. We don't sell or share it." },
      { q: "Can freshers use this?", a: "Yes. It's tuned for both freshers and experienced candidates." },
    ],
    cta: "Start Live Interview",
    keywords: "AI HR interview, voice interview practice, live mock interview India",
  },
  {
    slug: "resume-builder",
    toolPath: "/student-tool/resume",
    title: "AI Resume Builder — Free One-Page Resume DOCX | Techrola",
    metaDescription:
      "Build a professional one-page resume with AI. ATS-friendly, downloadable as DOCX. Perfect for freshers and Indian job seekers.",
    h1: "AI Resume Builder for Freshers & Professionals",
    tagline: "A clean, one-page, ATS-friendly resume — in minutes.",
    icon: "📝",
    gradient: "from-orange-500 to-amber-500",
    intro:
      "Stop fighting Word templates. Tell our AI Resume Builder about your skills, projects and education, and get a sharp one-page resume formatted for both human recruiters and ATS bots — downloadable as DOCX.",
    benefits: [
      { title: "ATS-friendly layout", desc: "Clean structure that resume parsers actually read." },
      { title: "One-page by design", desc: "Recruiter-friendly, no wasted scrolling." },
      { title: "Editable DOCX", desc: "Polish in Word or Google Docs before sending." },
      { title: "Fresher & lateral ready", desc: "Works for first jobs and 2–8 year switches." },
    ],
    howItWorks: [
      "Enter education, skills, projects and experience.",
      "Pick a target role.",
      "AI structures and rewords your content.",
      "Download as DOCX.",
    ],
    useCases: [
      "First job applications",
      "Internship & SDE drives",
      "MBA / consulting roles",
      "Job switches after 2–5 years",
    ],
    faqs: [
      { q: "Is the resume ATS-friendly?", a: "Yes — it uses standard sections, fonts and a single-column layout most ATS systems parse cleanly." },
      { q: "Can I add a photo?", a: "We default to no-photo (recommended in India for most tech roles). You can add one in Word." },
      { q: "Will it work for experienced roles?", a: "Yes, the layout scales with your experience input." },
    ],
    cta: "Build My Resume",
    keywords: "AI resume builder India, ATS resume, one page resume DOCX",
  },
  {
    slug: "cover-letter-generator",
    toolPath: "/student-tool/cover-letter",
    title: "AI Cover Letter Generator — Tailored & Free | Techrola",
    metaDescription:
      "Generate a job-winning cover letter tailored to the role and company. Free, fast, downloadable.",
    h1: "AI Cover Letter Generator",
    tagline: "A cover letter that actually mentions the company.",
    icon: "✉️",
    gradient: "from-rose-500 to-pink-500",
    intro:
      "Generic cover letters get ignored. Paste a job description, add a few lines about yourself, and our AI Cover Letter Generator writes a personalised, role-specific letter that reads like you cared.",
    benefits: [
      { title: "Tailored per role", desc: "Mentions the company, the role and your fit." },
      { title: "Right length", desc: "Crisp 250–350 words — recruiters actually read it." },
      { title: "Indian context", desc: "Tone tuned for Indian hiring." },
      { title: "Instant download", desc: "Get the letter as text or DOCX." },
    ],
    howItWorks: [
      "Paste the job description.",
      "Add 2–3 lines about your background.",
      "AI drafts a tailored letter.",
      "Copy, edit, send.",
    ],
    useCases: [
      "LinkedIn Easy Apply attachments",
      "Email applications to startups",
      "Internship cover letters",
      "Higher-studies funding applications",
    ],
    faqs: [
      { q: "How tailored is it really?", a: "It pulls keywords from the JD and mirrors them in your letter without sounding stuffed." },
      { q: "Can I regenerate?", a: "Yes, regenerate as many times as you like." },
    ],
    cta: "Generate Cover Letter",
    keywords: "AI cover letter generator, job application letter, tailored cover letter India",
  },
  {
    slug: "sop-generator",
    toolPath: "/student-tool/sop",
    title: "AI SOP Generator — Statement of Purpose for MS/MBA | Techrola",
    metaDescription:
      "Write a powerful 700–900 word Statement of Purpose for MS, MBA and PhD applications. AI-drafted, you-personalised.",
    h1: "AI Statement of Purpose (SOP) Generator",
    tagline: "A 700–900 word SOP that admissions officers actually finish reading.",
    icon: "🎓",
    gradient: "from-indigo-500 to-blue-500",
    intro:
      "An SOP can make or break your application. Our AI SOP Generator drafts a structured, story-driven Statement of Purpose for MS, MBA, MIM or PhD applications — anchored in your background, goals and chosen program.",
    benefits: [
      { title: "Structured story", desc: "Hook, journey, why-program, why-you, future goals." },
      { title: "Right word count", desc: "Lands at 700–900 words — the global sweet spot." },
      { title: "Program-aware", desc: "Mentions specifics of your target university and course." },
      { title: "Editable draft", desc: "A strong starting point you personalise further." },
    ],
    howItWorks: [
      "Enter background, target program and goals.",
      "Add 2–3 standout projects or moments.",
      "AI drafts your full SOP.",
      "Copy, refine, submit.",
    ],
    useCases: [
      "MS applications (US, UK, Germany, Canada)",
      "MBA / MIM applications",
      "PhD research-fit essays",
      "Scholarship statements",
    ],
    faqs: [
      { q: "Is the SOP plagiarism-free?", a: "Yes — it's drafted fresh based on your inputs. Always edit before submitting." },
      { q: "Will universities detect AI?", a: "Treat the draft as a starting point. Personalise meaningfully — that's the right approach for any application." },
    ],
    cta: "Draft My SOP",
    keywords: "SOP generator, statement of purpose AI, MS SOP India",
  },
  {
    slug: "study-notes-maker",
    toolPath: "/student-tool/study-notes",
    title: "AI Study Notes Maker — Exam Revision Notes | Techrola",
    metaDescription:
      "Turn any topic into clean revision notes plus likely exam questions. Perfect for school, college and competitive exams.",
    h1: "AI Study Notes Maker",
    tagline: "Topic in. Crisp notes + likely questions out.",
    icon: "📚",
    gradient: "from-yellow-500 to-orange-500",
    intro:
      "Stop highlighting textbooks. Type any topic — Photosynthesis, OOPs, Indian Polity, anything — and our AI Study Notes Maker returns clean, exam-ready revision notes along with the questions most likely to come.",
    benefits: [
      { title: "Clean structure", desc: "Headings, bullets and diagrams-style breakdowns." },
      { title: "Likely questions", desc: "Probable 2-mark, 5-mark and 10-mark questions." },
      { title: "Any subject", desc: "Science, commerce, arts, engineering, UPSC." },
      { title: "Fast revision", desc: "Built for the night-before-exam crowd." },
    ],
    howItWorks: [
      "Type the topic or chapter name.",
      "Choose class / exam level.",
      "AI generates notes + question bank.",
      "Revise and ace.",
    ],
    useCases: [
      "Class 10 / 12 board prep",
      "College semester exams",
      "UPSC, SSC and banking prep",
      "Quick interview brush-ups",
    ],
    faqs: [
      { q: "Is it accurate?", a: "Notes are AI-generated. Cross-check critical facts with your textbook or syllabus." },
      { q: "Can I save notes?", a: "Yes — copy or download for offline revision." },
    ],
    cta: "Make Study Notes",
    keywords: "AI study notes, revision notes generator, exam preparation India",
  },
  {
    slug: "career-roadmap",
    toolPath: "/student-tool/roadmap",
    title: "AI 6-Month Career Roadmap — Personalised Plan | Techrola",
    metaDescription:
      "Get a month-by-month, personalised 6-month career roadmap to become job-ready. Skills, projects, certifications, timeline.",
    h1: "AI 6-Month Career Roadmap Builder",
    tagline: "Stop scrolling LinkedIn. Start a 6-month plan that ships.",
    icon: "🗺️",
    gradient: "from-cyan-500 to-blue-500",
    intro:
      "Tell the AI your current level and target role. Get a month-by-month, action-driven 6-month roadmap covering skills to learn, certifications to take, projects to build and a timeline to follow.",
    benefits: [
      { title: "Month-by-month plan", desc: "No vague 'learn this then that' — actual weeks and deliverables." },
      { title: "Role-specific", desc: "Data analyst, full-stack, UX, AI/ML, product, marketing." },
      { title: "Project-led", desc: "Every month ends with a portfolio-worthy build." },
      { title: "Free to start", desc: "Generate your first roadmap free." },
    ],
    howItWorks: [
      "Enter your current skills and target role.",
      "Pick study hours per week.",
      "AI builds your 6-month plan.",
      "Follow it month by month.",
    ],
    useCases: [
      "Career switchers (e.g. non-IT to IT)",
      "Final-year students prepping for placements",
      "Freshers entering the job market",
      "Re-entering after a career break",
    ],
    faqs: [
      { q: "Can I change the duration?", a: "The default is 6 months. You can adjust your weekly hours to compress or stretch it." },
      { q: "Are certifications free or paid?", a: "We recommend a mix. Free options are listed where possible." },
    ],
    cta: "Build My Roadmap",
    keywords: "career roadmap AI, 6 month career plan, job ready roadmap India",
  },
  {
    slug: "leave-letter",
    toolPath: "/student-tool/leave-letter",
    title: "AI Leave Letter Generator — School, College, Office | Techrola",
    metaDescription:
      "Write a formal leave application letter in seconds. School, college, office formats — fully customisable.",
    h1: "AI Leave Application Letter Generator",
    tagline: "Leave letter, done in 10 seconds.",
    icon: "📨",
    gradient: "from-slate-500 to-gray-500",
    intro:
      "Need to write a leave letter and don't want to think? Tell the AI your reason and duration — get a formal, correctly-formatted leave letter for school, college or office, ready to copy or download.",
    benefits: [
      { title: "Multiple formats", desc: "School, college, office and medical leave templates." },
      { title: "Correct tone", desc: "Respectful, formal and to the point." },
      { title: "Editable", desc: "Tweak names, dates and reason easily." },
      { title: "Instant", desc: "Generated in seconds, ready to copy." },
    ],
    howItWorks: [
      "Pick leave type (school / college / office).",
      "Enter dates and reason.",
      "AI drafts the formal letter.",
      "Copy, sign, submit.",
    ],
    useCases: [
      "School leave for parents",
      "College leave to HOD / Principal",
      "Office leave to manager",
      "Medical leave application",
    ],
    faqs: [
      { q: "Will it format correctly?", a: "Yes — proper greeting, body, signature line. You just add your name." },
      { q: "Can I get half-day leave letters?", a: "Yes, mention half-day in the reason field." },
    ],
    cta: "Generate Leave Letter",
    keywords: "leave letter generator, leave application AI, formal leave letter India",
  },
  {
    slug: "letter-of-recommendation",
    toolPath: "/student-tool/lor",
    title: "AI Letter of Recommendation (LOR) Generator | Techrola",
    metaDescription:
      "Draft a professor- or manager-style Letter of Recommendation for MS, MBA, PhD or job applications.",
    h1: "AI Letter of Recommendation Generator",
    tagline: "A draft LOR your professor will happily sign.",
    icon: "📜",
    gradient: "from-violet-500 to-purple-500",
    intro:
      "Most LORs are written by the student and signed by the recommender — that's the reality. Our AI LOR Generator drafts a professor- or manager-style letter you can take to your referee for review and signature.",
    benefits: [
      { title: "Recommender tone", desc: "Reads like a senior wrote it, not a student." },
      { title: "Strengths-led", desc: "Centred on 2–3 strong qualities with evidence." },
      { title: "MS / MBA / job ready", desc: "Adapts to higher studies and job applications." },
      { title: "Editable", desc: "Hand over a clean draft for review." },
    ],
    howItWorks: [
      "Enter recommender's role and relationship to you.",
      "Add 2–3 strengths and a memorable example.",
      "AI drafts the LOR.",
      "Share with your referee for sign-off.",
    ],
    useCases: [
      "MS / MBA / PhD applications",
      "Scholarship applications",
      "Job referrals",
      "Visa & immigration applications",
    ],
    faqs: [
      { q: "Is this ethical?", a: "It's standard practice for students to draft and recommenders to review/sign. Always get explicit approval from your referee." },
      { q: "How many LORs can I generate?", a: "Unlimited — useful for multi-university applications." },
    ],
    cta: "Draft My LOR",
    keywords: "LOR generator AI, letter of recommendation, professor LOR India",
  },
  {
    slug: "project-report",
    toolPath: "/student-tool/project-report",
    title: "AI Mini Project Report Generator — DOCX | Techrola",
    metaDescription:
      "Generate a full academic-format mini project report with abstract, modules, methodology and conclusion. DOCX download.",
    h1: "AI Mini Project Report Generator",
    tagline: "Final-year project report — no all-nighter required.",
    icon: "📘",
    gradient: "from-blue-500 to-indigo-500",
    intro:
      "Build a complete academic-format mini project report in minutes. Includes abstract, introduction, modules, methodology, results, conclusion and references — formatted in standard university style and downloadable as DOCX.",
    benefits: [
      { title: "Full academic format", desc: "All chapters generated, in standard order." },
      { title: "Editable DOCX", desc: "Customise in Word before submission." },
      { title: "Any branch", desc: "CSE, ECE, EEE, mechanical, civil, MBA, BBA." },
      { title: "Saves hours", desc: "Days of formatting compressed into minutes." },
    ],
    howItWorks: [
      "Enter project title, branch and 3-line summary.",
      "Add team members and guide name.",
      "AI drafts the full report.",
      "Download DOCX.",
    ],
    useCases: [
      "B.Tech / B.E. mini projects",
      "MCA / BCA project submissions",
      "MBA / BBA capstone reports",
      "Diploma project submissions",
    ],
    faqs: [
      { q: "Is the structure standard?", a: "Yes — abstract, intro, literature, modules, methodology, results, conclusion, references." },
      { q: "Can I add my own diagrams?", a: "Yes — open the DOCX in Word and insert diagrams normally." },
    ],
    cta: "Generate Project Report",
    keywords: "AI project report generator, mini project DOCX, college project report India",
  },
  {
    slug: "professional-email-writer",
    toolPath: "/student-tool/email-writer",
    title: "AI Professional Email Writer — HR, Professor, Recruiter | Techrola",
    metaDescription:
      "Write polished professional emails to professors, HRs and recruiters in seconds. Right tone, right length, every time.",
    h1: "AI Professional Email Writer",
    tagline: "Stop drafting the same email 10 times.",
    icon: "📧",
    gradient: "from-teal-500 to-cyan-500",
    intro:
      "Whether it's a follow-up to an HR, a cold email to a recruiter, or a polite nudge to a professor — our AI Professional Email Writer drafts the right email in the right tone, the right length, in seconds.",
    benefits: [
      { title: "Multiple tones", desc: "Formal, semi-formal, polite-firm, friendly." },
      { title: "Concise", desc: "Reads in under 30 seconds — recruiters love that." },
      { title: "Subject line included", desc: "A subject line that actually gets opened." },
      { title: "Copy & paste ready", desc: "Drop it into Gmail and send." },
    ],
    howItWorks: [
      "Pick the email type and recipient.",
      "Enter context in 1–2 lines.",
      "AI drafts subject + body.",
      "Copy to your email client.",
    ],
    useCases: [
      "Follow-ups after interviews",
      "Cold outreach to recruiters",
      "Internship requests to professors",
      "Polite payment / deadline reminders",
    ],
    faqs: [
      { q: "Can I save templates?", a: "Generate as many as you need and save in your notes." },
      { q: "What languages are supported?", a: "Primarily English. Hindi/Hinglish output is on the roadmap." },
    ],
    cta: "Write My Email",
    keywords: "AI email writer, professional email generator, HR follow-up email India",
  },
  {
    slug: "viva-questions",
    toolPath: "/student-tool/viva-questions",
    title: "AI Viva Questions Generator — With Model Answers | Techrola",
    metaDescription:
      "Predict 20+ viva and interview questions for any topic, with model answers. Perfect for project viva and last-minute prep.",
    h1: "AI Viva / Interview Questions Generator",
    tagline: "20+ likely viva questions — with answers.",
    icon: "🎙️",
    gradient: "from-fuchsia-500 to-pink-500",
    intro:
      "Walk into your viva knowing what's coming. Enter your project topic or subject — get 20+ likely viva questions with crisp model answers, ranked easy to tough.",
    benefits: [
      { title: "20+ questions", desc: "Covers basics, depth and curve-balls." },
      { title: "Model answers", desc: "Short, accurate, exam-quality answers." },
      { title: "Any topic", desc: "Project viva, lab viva, course-end viva." },
      { title: "Print-friendly", desc: "Take a printout into your prep session." },
    ],
    howItWorks: [
      "Enter topic / subject / project name.",
      "Pick exam or viva level.",
      "AI generates Q&A.",
      "Revise and walk in confident.",
    ],
    useCases: [
      "Final-year project viva",
      "Lab viva (DBMS, OS, networks, etc.)",
      "Job interview last-minute prep",
      "Internal end-semester viva",
    ],
    faqs: [
      { q: "Are answers always correct?", a: "AI-generated — verify domain-critical facts with your textbook." },
      { q: "Can I get harder questions?", a: "Yes, set difficulty to advanced." },
    ],
    cta: "Generate Viva Questions",
    keywords: "viva questions generator, project viva AI, interview questions with answers",
  },
  {
    slug: "ppt-outline",
    toolPath: "/student-tool/ppt-outline",
    title: "AI Presentation (PPT) Outline Generator | Techrola",
    metaDescription:
      "Slide-by-slide PowerPoint outline with titles, bullet points and speaker notes. Build any presentation in minutes.",
    h1: "AI PPT Outline Generator",
    tagline: "Slide-by-slide outline, ready to drop into PowerPoint.",
    icon: "📊",
    gradient: "from-amber-500 to-yellow-500",
    intro:
      "Pick a topic and audience. Get a full slide-by-slide PPT outline with titles, bullet points and speaker notes — copy into PowerPoint, Google Slides or Canva and you're done.",
    benefits: [
      { title: "Slide-by-slide", desc: "Title + 3–5 bullets + notes for each slide." },
      { title: "Speaker notes", desc: "What to actually say on each slide." },
      { title: "Right deck length", desc: "Optimised for your time slot (5/10/20 min)." },
      { title: "Any topic", desc: "Project, business pitch, seminar, classroom talk." },
    ],
    howItWorks: [
      "Enter topic, audience and duration.",
      "AI generates the slide outline.",
      "Copy into your slide tool.",
      "Style and present.",
    ],
    useCases: [
      "College seminars",
      "Project final review",
      "Business pitches",
      "Workshop / training decks",
    ],
    faqs: [
      { q: "Does it generate actual PPTX?", a: "Currently it generates the structured outline. You paste it into PowerPoint / Google Slides." },
      { q: "Can I get speaker notes?", a: "Yes, every slide includes 2–3 lines of speaker notes." },
    ],
    cta: "Generate PPT Outline",
    keywords: "AI PPT outline, presentation generator, slide outline AI",
  },
  {
    slug: "scholarship-essay",
    toolPath: "/student-tool/scholarship-essay",
    title: "AI Scholarship Essay Writer — Free Draft | Techrola",
    metaDescription:
      "Write a compelling scholarship essay tailored to your story. Free AI essay draft for Indian and global scholarships.",
    h1: "AI Scholarship Essay Writer",
    tagline: "An essay that makes the funder root for you.",
    icon: "🏆",
    gradient: "from-yellow-500 to-amber-500",
    intro:
      "Scholarship essays are won on story. Tell the AI your background, your goals and the scholarship — get a compelling, story-led draft that highlights why this funding matters to you.",
    benefits: [
      { title: "Story-led structure", desc: "Hook, struggle, growth, future impact." },
      { title: "Tailored", desc: "Mentions the specific scholarship and its values." },
      { title: "Right length", desc: "Hits the word count without padding." },
      { title: "Editable", desc: "A starting draft you personalise further." },
    ],
    howItWorks: [
      "Enter your background and the scholarship.",
      "Add 1–2 personal milestones.",
      "AI drafts the essay.",
      "Personalise and submit.",
    ],
    useCases: [
      "Inspire / NSP / Indian govt scholarships",
      "Chevening, Erasmus, DAAD essays",
      "University-specific merit essays",
      "Need-based scholarship statements",
    ],
    faqs: [
      { q: "Will it sound generic?", a: "Not if you give specific input. The more concrete details you add, the sharper the draft." },
      { q: "Word count?", a: "Choose 250 / 500 / 750 / 1000 words." },
    ],
    cta: "Write My Essay",
    keywords: "scholarship essay AI, scholarship essay generator India",
  },
  {
    slug: "linkedin-bio",
    toolPath: "/student-tool/linkedin-bio",
    title: "AI LinkedIn Bio & Headline Generator | Techrola",
    metaDescription:
      "Magnetic LinkedIn About section plus 3 headline options. Free AI generator for students and professionals.",
    h1: "AI LinkedIn Bio & Headline Generator",
    tagline: "A LinkedIn About section recruiters actually finish reading.",
    icon: "💼",
    gradient: "from-sky-500 to-blue-500",
    intro:
      "Most LinkedIn About sections read like resumes. Ours read like people. Get a story-led LinkedIn bio plus 3 headline options — all tuned to attract recruiters in your domain.",
    benefits: [
      { title: "Story-led bio", desc: "Hook → expertise → proof → call to action." },
      { title: "3 headline options", desc: "Pick the one that fits your vibe." },
      { title: "Keyword-optimised", desc: "Recruiters search keywords. Your bio has them." },
      { title: "Indian or global", desc: "Tone tuned for your target market." },
    ],
    howItWorks: [
      "Enter your role, expertise and target audience.",
      "Add 1–2 wins or numbers.",
      "AI drafts bio + 3 headlines.",
      "Paste into LinkedIn.",
    ],
    useCases: [
      "Job-seeking students",
      "Freelancers attracting clients",
      "Founders building in public",
      "Career switchers signalling intent",
    ],
    faqs: [
      { q: "How long is the bio?", a: "Under LinkedIn's 2,600-char limit — typically 800–1,400 chars." },
      { q: "Can I regenerate?", a: "Yes, as many times as you need." },
    ],
    cta: "Generate LinkedIn Bio",
    keywords: "LinkedIn bio generator, LinkedIn headline AI, LinkedIn about section",
  },
  {
    slug: "business-plan",
    toolPath: "/student-tool/business-plan",
    title: "AI Startup / Business Plan Generator | Techrola",
    metaDescription:
      "Generate a lean startup business plan with problem, solution, market, GTM and revenue. Great for student pitches and grants.",
    h1: "AI Startup / Business Plan Generator",
    tagline: "A lean business plan you can actually pitch.",
    icon: "📈",
    gradient: "from-green-500 to-emerald-500",
    intro:
      "Skip the 50-page templates. Get a tight, lean business plan covering problem, solution, target market, go-to-market, competition, business model and revenue projections — perfect for student startups, grant applications and college pitches.",
    benefits: [
      { title: "Lean structure", desc: "All key sections, no fluff." },
      { title: "Investor-friendly", desc: "Reads like a pitch, not a thesis." },
      { title: "India-aware", desc: "Considers Indian market and Tier-2 realities where relevant." },
      { title: "Editable", desc: "Sharpen numbers and assumptions before sending." },
    ],
    howItWorks: [
      "Enter idea in 2–3 lines.",
      "Pick industry and target user.",
      "AI drafts the lean plan.",
      "Refine and pitch.",
    ],
    useCases: [
      "Student startup pitch decks",
      "E-Cell / E-Summit competitions",
      "Govt grant applications (Startup India, etc.)",
      "Internal corporate proposals",
    ],
    faqs: [
      { q: "Are revenue projections accurate?", a: "They're directional — always validate numbers with your own research." },
      { q: "Will it write a full pitch deck?", a: "It gives you the structured content. Drop into a slide tool to design." },
    ],
    cta: "Generate Business Plan",
    keywords: "AI business plan, startup plan generator India, lean business plan",
  },
  {
    slug: "assignment-helper",
    toolPath: "/student-tool/assignment",
    title: "AI Assignment Helper — College Assignments | Techrola",
    metaDescription:
      "Well-structured college assignments with citations placeholders. Save hours, learn faster.",
    h1: "AI Assignment Helper",
    tagline: "Structured college assignments in minutes, not days.",
    icon: "📑",
    gradient: "from-red-500 to-rose-500",
    intro:
      "Tell the AI your assignment topic and word count — get a structured assignment with introduction, headings, body and conclusion, plus citation placeholders you can fill with your sources.",
    benefits: [
      { title: "Proper structure", desc: "Intro, body, conclusion, references." },
      { title: "Citation slots", desc: "Placeholders ready for your sources." },
      { title: "Word count control", desc: "500 / 1000 / 1500 / 2000 words." },
      { title: "Any subject", desc: "From management to engineering to humanities." },
    ],
    howItWorks: [
      "Enter topic, subject and word count.",
      "Pick depth (school / UG / PG).",
      "AI drafts the assignment.",
      "Add your citations and submit.",
    ],
    useCases: [
      "Distance-learning assignments (IGNOU, NMIMS, etc.)",
      "Internal assessment submissions",
      "Open-book exam prep",
      "Research-based homework",
    ],
    faqs: [
      { q: "Is this a plagiarism risk?", a: "Treat it as a starting draft. Personalise, paraphrase, add your sources, and check institutional policies on AI use." },
      { q: "Can I get bibliography?", a: "Citation placeholders are included — you fill the actual sources." },
    ],
    cta: "Get Assignment Draft",
    keywords: "AI assignment helper, college assignment generator, homework AI India",
  },
  {
    slug: "essay-writer",
    toolPath: "/student-tool/essay",
    title: "AI Essay Writer — Structured Essays on Any Topic | Techrola",
    metaDescription:
      "Structured essay on any topic with introduction, body and conclusion. School, college, competitive exams.",
    h1: "AI Essay Writer",
    tagline: "Essays with a thesis — not just paragraphs.",
    icon: "✍️",
    gradient: "from-pink-500 to-rose-500",
    intro:
      "Type any essay topic — get a structured essay with a clear thesis, body paragraphs and a tight conclusion. Tuned for school, college and competitive-exam essay writing.",
    benefits: [
      { title: "Clear thesis", desc: "Every essay has a point of view." },
      { title: "Right structure", desc: "Intro, 3 body paragraphs, conclusion." },
      { title: "Multiple tones", desc: "Argumentative, descriptive, narrative, expository." },
      { title: "Word-count aware", desc: "300 / 500 / 800 / 1200 words." },
    ],
    howItWorks: [
      "Enter topic and word count.",
      "Pick essay type.",
      "AI drafts the essay.",
      "Edit and submit.",
    ],
    useCases: [
      "School/college essay assignments",
      "UPSC / SSC / banking essay practice",
      "MBA admission essays",
      "Competition essays",
    ],
    faqs: [
      { q: "Can it write in formal exam tone?", a: "Yes — pick argumentative or expository for exam-friendly writing." },
      { q: "How long?", a: "Choose between 300 and 1200 words." },
    ],
    cta: "Write My Essay",
    keywords: "AI essay writer, essay generator India, exam essay AI",
  },
  {
    slug: "speech-writer",
    toolPath: "/student-tool/speech",
    title: "AI Speech Writer — Events, Debates, Functions | Techrola",
    metaDescription:
      "Powerful speeches for events, debates and college functions. AI-drafted with hooks, story and a strong close.",
    h1: "AI Speech Writer",
    tagline: "Speeches that don't make people check their phone.",
    icon: "🎤",
    gradient: "from-orange-500 to-red-500",
    intro:
      "Whether it's a college fest, a debate, a farewell or Independence Day — our AI Speech Writer drafts a speech with a strong hook, a story, a punchy middle and a memorable close, tuned to your time slot.",
    benefits: [
      { title: "Hook → story → close", desc: "Speech structure that holds attention." },
      { title: "Time-aware", desc: "2-min / 5-min / 10-min versions." },
      { title: "Any occasion", desc: "Welcome, farewell, debate, motivational, technical." },
      { title: "Editable", desc: "Personalise quotes, names and stories." },
    ],
    howItWorks: [
      "Pick occasion and duration.",
      "Enter audience and key message.",
      "AI drafts the speech.",
      "Practise and deliver.",
    ],
    useCases: [
      "College fests & farewells",
      "Debate competitions",
      "Independence / Republic Day",
      "Corporate town halls",
    ],
    faqs: [
      { q: "Will it sound natural when spoken?", a: "Yes — drafted in spoken-English rhythm, not essay-style." },
      { q: "Can I add a personal story?", a: "Yes, include it in your input and AI weaves it in." },
    ],
    cta: "Write My Speech",
    keywords: "AI speech writer, debate speech AI, college speech generator",
  },
];

export const findLanding = (slug: string) =>
  aiToolLandings.find((l) => l.slug === slug);
