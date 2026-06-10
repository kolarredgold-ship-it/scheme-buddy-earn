import { useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Download, Sparkles, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "email" | "tel" | "date" | "number";
  required?: boolean;
  placeholder?: string;
};

type ToolConfig = {
  slug: string;
  title: string;
  emoji: string;
  desc: string;
  fields: Field[];
  fileBase: string;
};

const TOOLS: Record<string, ToolConfig> = {
  resume: {
    slug: "resume",
    title: "AI Resume Builder",
    emoji: "📝",
    desc: "Fill the form — AI builds a polished one-page resume you can download as DOCX.",
    fileBase: "Resume",
    fields: [
      { name: "name", label: "Full Name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "address", label: "Address (City, State)", required: true },
      { name: "course", label: "Course / Degree", required: true, placeholder: "B.Tech CSE" },
      { name: "college", label: "College Name", required: true },
      { name: "year", label: "Year of Study / Passing", required: true, placeholder: "2025" },
      { name: "skills", label: "Key Skills (comma separated)", type: "textarea", required: true, placeholder: "Python, React, SQL, Communication" },
      { name: "projects", label: "Projects (brief)", type: "textarea", required: true, placeholder: "1. Library Management System ..." },
      { name: "experience", label: "Internships / Experience (optional)", type: "textarea" },
      { name: "objective", label: "Career Objective hint (optional)" },
      { name: "languages", label: "Languages Known", placeholder: "English, Hindi, Kannada" },
      { name: "hobbies", label: "Hobbies (optional)" },
    ],
  },
  "cover-letter": {
    slug: "cover-letter",
    title: "AI Cover Letter Generator",
    emoji: "✉️",
    desc: "Generate a job-winning cover letter customised for the role and company.",
    fileBase: "Cover_Letter",
    fields: [
      { name: "name", label: "Your Full Name", required: true },
      { name: "email", label: "Your Email", type: "email", required: true },
      { name: "phone", label: "Your Phone", type: "tel", required: true },
      { name: "course", label: "Your Course", required: true },
      { name: "college", label: "Your College", required: true },
      { name: "skills", label: "Top Strengths / Skills", type: "textarea", required: true },
      { name: "role", label: "Role Applying For", required: true, placeholder: "Software Engineer Intern" },
      { name: "company", label: "Company Name", required: true },
      { name: "reason", label: "Why this company/role (optional)", type: "textarea" },
    ],
  },
  sop: {
    slug: "sop",
    title: "Statement of Purpose (SOP)",
    emoji: "🎓",
    desc: "Generate a 700-900 word SOP for higher studies applications.",
    fileBase: "Statement_of_Purpose",
    fields: [
      { name: "name", label: "Your Full Name", required: true },
      { name: "target_course", label: "Course Applying For", required: true, placeholder: "MS in Computer Science" },
      { name: "target_university", label: "University / Country", required: true },
      { name: "course", label: "Current Education", required: true },
      { name: "college", label: "Current College", required: true },
      { name: "background", label: "Academic Background", type: "textarea", required: true },
      { name: "projects", label: "Projects / Research", type: "textarea", required: true },
      { name: "experience", label: "Internships / Work Experience (optional)", type: "textarea" },
      { name: "goal", label: "Career Goal", type: "textarea", required: true },
      { name: "reason", label: "Why this program?", type: "textarea", required: true },
    ],
  },
  "study-notes": {
    slug: "study-notes",
    title: "AI Study Notes Maker",
    emoji: "📚",
    desc: "Paste any topic / raw notes — get clean revision notes + likely exam questions.",
    fileBase: "Study_Notes",
    fields: [
      { name: "topic", label: "Subject / Topic", required: true, placeholder: "DBMS - Normalization" },
      { name: "level", label: "Class / Level", required: true, placeholder: "B.Tech 3rd year" },
      { name: "material", label: "Paste any raw text / topic outline", type: "textarea", required: true, placeholder: "Paste topic outline, chapter text, or just the topic name..." },
    ],
  },
  roadmap: {
    slug: "roadmap",
    title: "6-Month Career Roadmap",
    emoji: "🗺️",
    desc: "Personalized month-by-month plan to become job ready for your target role.",
    fileBase: "Career_Roadmap",
    fields: [
      { name: "name", label: "Your Name", required: true },
      { name: "course", label: "Current Education", required: true },
      { name: "college", label: "College", required: true },
      { name: "skills", label: "Current Skills", type: "textarea", required: true },
      { name: "target_role", label: "Target Role / Job", required: true, placeholder: "Full Stack Developer" },
      { name: "hours", label: "Daily Hours Available", placeholder: "2-3", type: "number" },
      { name: "style", label: "Preferred Learning Style (optional)", placeholder: "videos + projects" },
    ],
  },
  "leave-letter": {
    slug: "leave-letter",
    title: "Leave Application Letter",
    emoji: "📨",
    desc: "Instantly draft a formal leave letter for college, school or office.",
    fileBase: "Leave_Application",
    fields: [
      { name: "name", label: "Your Name", required: true },
      { name: "course", label: "Course / Designation", required: true },
      { name: "college", label: "College / Company", required: true },
      { name: "recipient", label: "To (Principal / HOD / Manager)", required: true, placeholder: "The Principal, ABC College" },
      { name: "reason", label: "Reason for leave", type: "textarea", required: true },
      { name: "from_date", label: "From Date", type: "date", required: true },
      { name: "to_date", label: "To Date", type: "date", required: true },
      { name: "days", label: "Number of days", type: "number", required: true },
    ],
  },
  lor: {
    slug: "lor",
    title: "Letter of Recommendation (LOR)",
    emoji: "📜",
    desc: "Professor- or manager-style LOR for higher studies or jobs.",
    fileBase: "LOR",
    fields: [
      { name: "student_name", label: "Student / Candidate Name", required: true },
      { name: "recommender_name", label: "Recommender Name", required: true },
      { name: "recommender_title", label: "Recommender Title / Role", required: true, placeholder: "Professor, CSE Dept." },
      { name: "institution", label: "Institution / Company", required: true },
      { name: "relationship", label: "Relationship & Duration", required: true, placeholder: "Taught for 2 years" },
      { name: "strengths", label: "Key Strengths / Qualities", type: "textarea", required: true },
      { name: "achievements", label: "Notable Achievements / Projects", type: "textarea", required: true },
      { name: "purpose", label: "Applying for (Course / Job / University)", required: true },
    ],
  },
  "project-report": {
    slug: "project-report",
    title: "Mini Project Report",
    emoji: "📘",
    desc: "Academic-format project report with abstract, modules and conclusion.",
    fileBase: "Project_Report",
    fields: [
      { name: "name", label: "Student Name", required: true },
      { name: "course", label: "Course", required: true },
      { name: "college", label: "College / University", required: true },
      { name: "guide", label: "Guide / Mentor Name" },
      { name: "title", label: "Project Title", required: true },
      { name: "domain", label: "Domain / Subject", required: true, placeholder: "Web Development / IoT" },
      { name: "tech", label: "Tech Stack / Tools", required: true },
      { name: "objective", label: "Objective", type: "textarea", required: true },
      { name: "features", label: "Key Features / Modules", type: "textarea", required: true },
    ],
  },
  "email-writer": {
    slug: "email-writer",
    title: "Professional Email Writer",
    emoji: "📧",
    desc: "Polished email to professors, HRs or recruiters.",
    fileBase: "Email",
    fields: [
      { name: "sender", label: "Your Name", required: true },
      { name: "recipient", label: "Recipient (Name / Role)", required: true, placeholder: "HR, Infosys" },
      { name: "purpose", label: "Purpose of Email", required: true, placeholder: "Internship request" },
      { name: "context", label: "Key Context / Background", type: "textarea", required: true },
      { name: "tone", label: "Tone (formal / friendly)", placeholder: "formal" },
    ],
  },
  "viva-questions": {
    slug: "viva-questions",
    title: "Viva / Interview Questions",
    emoji: "🎙️",
    desc: "20+ likely viva questions with concise model answers.",
    fileBase: "Viva_Questions",
    fields: [
      { name: "topic", label: "Topic / Project Title", required: true },
      { name: "subject", label: "Subject", required: true, placeholder: "DBMS / OS / Project Viva" },
      { name: "level", label: "Class / Level", required: true, placeholder: "B.Tech final year" },
      { name: "context", label: "Project / Topic Brief (optional)", type: "textarea" },
    ],
  },
  "ppt-outline": {
    slug: "ppt-outline",
    title: "Presentation (PPT) Outline",
    emoji: "📊",
    desc: "Slide-by-slide outline with titles, bullet points and speaker notes.",
    fileBase: "Presentation_Outline",
    fields: [
      { name: "topic", label: "Presentation Topic", required: true },
      { name: "audience", label: "Audience", required: true, placeholder: "College students" },
      { name: "slides", label: "Number of slides", type: "number", placeholder: "10" },
      { name: "duration", label: "Duration (mins)", type: "number", placeholder: "10" },
      { name: "objective", label: "Objective / Key message", type: "textarea", required: true },
    ],
  },
  "scholarship-essay": {
    slug: "scholarship-essay",
    title: "Scholarship Essay",
    emoji: "🏆",
    desc: "Compelling 500-700 word scholarship essay.",
    fileBase: "Scholarship_Essay",
    fields: [
      { name: "name", label: "Your Name", required: true },
      { name: "scholarship", label: "Scholarship Name", required: true },
      { name: "course", label: "Course / Field", required: true },
      { name: "background", label: "Background & Family situation", type: "textarea", required: true },
      { name: "achievements", label: "Achievements", type: "textarea", required: true },
      { name: "goal", label: "Career Goal / Why you deserve it", type: "textarea", required: true },
      { name: "financial", label: "Financial need (brief)", type: "textarea" },
    ],
  },
  "linkedin-bio": {
    slug: "linkedin-bio",
    title: "LinkedIn Bio & Headline",
    emoji: "💼",
    desc: "Magnetic LinkedIn About section + 3 headline variations.",
    fileBase: "LinkedIn_Bio",
    fields: [
      { name: "name", label: "Your Name", required: true },
      { name: "role", label: "Current Role / Status", required: true, placeholder: "B.Tech CSE student" },
      { name: "skills", label: "Top Skills", type: "textarea", required: true },
      { name: "achievements", label: "Achievements / Projects", type: "textarea", required: true },
      { name: "goal", label: "Career Goal", required: true },
      { name: "tone", label: "Tone (professional / friendly)", placeholder: "professional" },
    ],
  },
  "business-plan": {
    slug: "business-plan",
    title: "Startup / Business Plan",
    emoji: "📈",
    desc: "Lean business plan with problem, solution, market and revenue model.",
    fileBase: "Business_Plan",
    fields: [
      { name: "founder", label: "Founder Name", required: true },
      { name: "idea", label: "Startup Idea (1-line)", required: true },
      { name: "problem", label: "Problem", type: "textarea", required: true },
      { name: "solution", label: "Solution", type: "textarea", required: true },
      { name: "audience", label: "Target Customers", required: true },
      { name: "revenue", label: "Revenue Model (optional)", placeholder: "subscription / ads" },
      { name: "budget", label: "Starting Budget (optional)" },
    ],
  },
  assignment: {
    slug: "assignment",
    title: "Assignment Helper",
    emoji: "📑",
    desc: "Well-structured college assignment answer with sections.",
    fileBase: "Assignment",
    fields: [
      { name: "name", label: "Your Name", required: true },
      { name: "course", label: "Course / Class", required: true },
      { name: "subject", label: "Subject", required: true },
      { name: "topic", label: "Assignment Topic / Question", type: "textarea", required: true },
      { name: "words", label: "Approx Word Count", type: "number", placeholder: "800" },
    ],
  },
  essay: {
    slug: "essay",
    title: "Essay Writer",
    emoji: "✍️",
    desc: "Structured essay on any topic with intro, body and conclusion.",
    fileBase: "Essay",
    fields: [
      { name: "topic", label: "Essay Topic", required: true },
      { name: "type", label: "Type", placeholder: "argumentative / descriptive" },
      { name: "level", label: "Level (school/college)", required: true, placeholder: "college" },
      { name: "words", label: "Approx Word Count", type: "number", placeholder: "600" },
      { name: "points", label: "Key points to cover (optional)", type: "textarea" },
    ],
  },
  speech: {
    slug: "speech",
    title: "Speech Writer",
    emoji: "🎤",
    desc: "Powerful speech for events, debates and college functions.",
    fileBase: "Speech",
    fields: [
      { name: "name", label: "Speaker Name", required: true },
      { name: "occasion", label: "Occasion / Event", required: true, placeholder: "Republic Day" },
      { name: "audience", label: "Audience", required: true, placeholder: "College students" },
      { name: "topic", label: "Speech Topic", required: true },
      { name: "duration", label: "Duration (minutes)", type: "number", placeholder: "5" },
      { name: "tone", label: "Tone (motivational / formal / funny)", placeholder: "motivational" },
    ],
  },
};

const StudentTool = () => {
  const { slug = "" } = useParams();
  const tool = TOOLS[slug];
  const [form, setForm] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const missing = useMemo(() => {
    if (!tool) return [];
    return tool.fields.filter((f) => f.required && !form[f.name]?.trim()).map((f) => f.label);
  }, [tool, form]);

  if (!tool) return <Navigate to="/ai-tools" replace />;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    if (missing.length) {
      toast.error(`Please fill: ${missing.join(", ")}`);
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("student-ai-tool", {
        body: { tool: tool.slug, data: form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOutput(data?.content || "");
      toast.success("Generated! Scroll down to download.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buildDoc = () => {
    const lines = output.split(/\n/);
    const children: Paragraph[] = [];
    const isHeading = (l: string) => /^[A-Z][A-Z0-9 &/().,-]{3,}$/.test(l.trim());
    const isSubHeading = (l: string) => /^\d+(\.\d+)*\s+\S/.test(l.trim());
    const isBullet = (l: string) => /^[-•*]\s+/.test(l.trim());

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: tool.title, bold: true, size: 32, color: "1E3A8A" }),
        ],
      }),
    );

    for (const raw of lines) {
      const line = raw.replace(/\s+$/g, "");
      if (!line.trim()) {
        children.push(new Paragraph({ children: [new TextRun(" ")] }));
        continue;
      }
      if (isHeading(line)) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120, line: 360 },
            children: [new TextRun({ text: line.trim(), bold: true, size: 26 })],
          }),
        );
      } else if (isSubHeading(line)) {
        children.push(
          new Paragraph({
            spacing: { before: 160, after: 80, line: 340 },
            children: [new TextRun({ text: line.trim(), bold: true, size: 24 })],
          }),
        );
      } else if (isBullet(line)) {
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { line: 340 },
            children: [new TextRun({ text: line.replace(/^[-•*]\s+/, ""), size: 22 })],
          }),
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { line: 360, after: 100 },
            children: [new TextRun({ text: line, size: 22 })],
          }),
        );
      }
    }

    return new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 22 } } },
      },
      numbering: {
        config: [
          {
            reference: "bullets",
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
          children,
        },
      ],
    });
  };

  const buildResumeDoc = () => {
    const accent = "1E3A8A";
    const lines = output.split(/\n/).map((l) => l.replace(/\s+$/g, ""));
    const isHeading = (l: string) => /^[A-Z][A-Z0-9 &/().,-]{2,}$/.test(l.trim());
    const isBullet = (l: string) => /^[-•*]\s+/.test(l.trim());

    const fullName = (form.name || "Your Name").trim();
    const contactBits = [form.email, form.phone, form.address].filter(Boolean).join("  •  ");

    const children: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: fullName.toUpperCase(), bold: true, size: 44, color: accent })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: contactBits, size: 20, color: "555555" })],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: accent, space: 1 } },
        spacing: { after: 120 },
        children: [new TextRun("")],
      }),
    ];

    // Skip the AI-generated HEADER section (we render our own header).
    let skipHeader = true;

    for (const raw of lines) {
      const line = raw;
      const trimmed = line.trim();

      if (isHeading(line)) {
        if (/^HEADER\b/.test(trimmed)) {
          skipHeader = true;
          continue;
        }
        skipHeader = false;
        children.push(
          new Paragraph({
            spacing: { before: 220, after: 60, line: 320 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent, space: 2 } },
            children: [new TextRun({ text: trimmed, bold: true, size: 24, color: accent })],
          }),
        );
        continue;
      }

      if (skipHeader) continue;
      if (!trimmed) {
        children.push(new Paragraph({ children: [new TextRun(" ")], spacing: { after: 60 } }));
        continue;
      }

      if (isBullet(line)) {
        children.push(
          new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { line: 300, after: 40 },
            children: [new TextRun({ text: line.replace(/^[-•*]\s+/, ""), size: 22 })],
          }),
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { line: 320, after: 60 },
            children: [new TextRun({ text: trimmed, size: 22 })],
          }),
        );
      }
    }

    return new Document({
      styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
      numbering: {
        config: [
          {
            reference: "bullets",
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 540, hanging: 270 } } },
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: { page: { margin: { top: 900, right: 1000, bottom: 900, left: 1000 } } },
          children,
        },
      ],
    });
  };

  const downloadDocx = async () => {
    if (!output) return;
    try {
      const doc = tool.slug === "resume" ? buildResumeDoc() : buildDoc();
      const blob = await Packer.toBlob(doc);
      const fname = `${tool.fileBase}_${(form.name || "Student").replace(/\s+/g, "_")}.docx`;
      saveAs(blob, fname);
      toast.success("Downloaded!");
    } catch (e) {
      toast.error("Download failed");
    }
  };

  const downloadTxt = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${tool.fileBase}_${(form.name || "Student").replace(/\s+/g, "_")}.txt`);
  };

  const downloadPptx = async () => {
    if (!output) return;
    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.title = form.topic || tool.title;

      const PRIMARY = "1E3A8A";
      const ACCENT = "F59E0B";
      const TEXT = "1F2937";
      const MUTED = "6B7280";
      const BG = "F8FAFC";

      const text = output.replace(/\r/g, "");
      const blocks = text.split(/\n(?=SLIDE\s+\d+\s*[:.\-])/i).map((b) => b.trim()).filter(Boolean);

      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: PRIMARY };
      titleSlide.addShape("rect", { x: 0, y: 6.7, w: 13.33, h: 0.8, fill: { color: ACCENT } });
      titleSlide.addText(form.topic || tool.title, {
        x: 0.7, y: 2.4, w: 12, h: 1.8,
        fontSize: 48, bold: true, color: "FFFFFF", fontFace: "Calibri",
      });
      titleSlide.addText(form.audience ? `For: ${form.audience}` : "Presentation", {
        x: 0.7, y: 4.2, w: 12, h: 0.6,
        fontSize: 20, color: "CADCFC", fontFace: "Calibri",
      });

      for (const block of blocks) {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (!lines.length) continue;

        const titleLine = lines[0].replace(/^SLIDE\s+\d+\s*[:.\-]\s*/i, "");
        const bullets: string[] = [];
        let notes = "";
        for (const l of lines.slice(1)) {
          if (/^speaker\s*notes\s*[:\-]/i.test(l)) {
            notes = l.replace(/^speaker\s*notes\s*[:\-]\s*/i, "");
          } else if (/^[-•*]\s+/.test(l)) {
            bullets.push(l.replace(/^[-•*]\s+/, ""));
          } else if (notes) {
            notes += " " + l;
          } else {
            bullets.push(l);
          }
        }

        const slide = pptx.addSlide();
        slide.background = { color: BG };
        slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.9, fill: { color: PRIMARY } });
        slide.addShape("rect", { x: 0, y: 0.9, w: 13.33, h: 0.08, fill: { color: ACCENT } });
        slide.addText(titleLine, {
          x: 0.5, y: 0.1, w: 12.3, h: 0.7,
          fontSize: 28, bold: true, color: "FFFFFF", fontFace: "Calibri",
          valign: "middle",
        });

        if (bullets.length) {
          slide.addText(
            bullets.map((b) => ({ text: b, options: { bullet: { code: "25CF" }, color: TEXT } })),
            {
              x: 0.7, y: 1.4, w: 11.9, h: 5.4,
              fontSize: 22, fontFace: "Calibri", color: TEXT,
              paraSpaceAfter: 10, valign: "top",
            },
          );
        }

        slide.addText("Techrola • Students AI Tools", {
          x: 0.5, y: 7.05, w: 12.3, h: 0.3,
          fontSize: 10, color: MUTED, fontFace: "Calibri", align: "right",
        });

        if (notes) slide.addNotes(notes);
      }

      const fname = `${tool.fileBase}_${(form.topic || "Presentation").replace(/\s+/g, "_")}.pptx`;
      await pptx.writeFile({ fileName: fname });
      toast.success("Downloaded PPTX!");
    } catch (e) {
      console.error(e);
      toast.error("PPTX download failed");
    }
  };



  const copyOut = async () => {
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  return (
    <Layout>
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-10 pb-24 max-w-4xl">
        <Link to="/ai-tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Students AI Tools
        </Link>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> AI Powered
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            <span className="mr-2">{tool.emoji}</span>{tool.title}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">{tool.desc}</p>
        </div>

        <Card className="p-4 md:p-6 space-y-4">
          {tool.fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name} className="text-sm">
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  rows={4}
                  placeholder={f.placeholder}
                  value={form[f.name] || ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              ) : (
                <Input
                  id={f.name}
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={form[f.name] || ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              )}
            </div>
          ))}

          <Button onClick={generate} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Generate with AI
              </>
            )}
          </Button>
        </Card>

        {output && (
          <Card className="p-4 md:p-6 mt-6 space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={copyOut}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadTxt}>
                <Download className="h-4 w-4 mr-1" /> .TXT
              </Button>
              {tool.slug === "ppt-outline" && (
                <Button size="sm" onClick={downloadPptx}>
                  <Download className="h-4 w-4 mr-1" /> Download PPTX
                </Button>
              )}
              <Button size="sm" variant={tool.slug === "ppt-outline" ? "outline" : "default"} onClick={downloadDocx}>
                <Download className="h-4 w-4 mr-1" /> DOCX
              </Button>

            </div>
            <div className="rounded-lg border bg-muted/30 p-4 max-h-[600px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed text-foreground">
                {output}
              </pre>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Note: AI-generated. Please review and personalize before submitting.
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentTool;
