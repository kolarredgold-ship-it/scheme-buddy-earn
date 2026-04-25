import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const roles = [
  "Software Developer",
  "Full Stack Developer",
  "Data Analyst",
  "AI Engineer",
  "Accountant",
  "HR Executive",
  "Digital Marketing",
  // BE/BTech Specializations
  "BE/BTech - Computer Science (CSE)",
  "BE/BTech - Electronics & Communication (ECE)",
  "BE/BTech - Mechanical Engineering",
  "BE/BTech - Civil Engineering",
  "BE/BTech - Electrical Engineering (EEE)",
  "BE/BTech - Information Technology (IT)",
  "BE/BTech - Chemical Engineering",
  "BE/BTech - Biotechnology",
  // ME/MTech Specializations
  "ME/MTech - Computer Science (CSE)",
  "ME/MTech - Electronics & Communication (ECE)",
  "ME/MTech - Mechanical Engineering",
  "ME/MTech - Civil Engineering",
  "ME/MTech - Artificial Intelligence & ML",
  "ME/MTech - Data Science",
  "ME/MTech - VLSI Design",
  "ME/MTech - Structural Engineering",
];

const categories = ["Basic", "Intermediate", "Advanced", "Scenario-Based", "HR & Behavioral"];

const roleTopics: Record<string, string> = {
  "Software Developer": "Programming (Java, Python, C++), Data Structures & Algorithms, OOP, DBMS, System Design",
  "Full Stack Developer": "Frontend (HTML, CSS, JS, React), Backend (Node.js, APIs), Database, Authentication, Deployment",
  "Data Analyst": "Excel, SQL, Power BI/Tableau, Data cleaning, statistics, Business case analysis",
  "AI Engineer": "Machine Learning, Deep Learning, NLP, Python, TensorFlow/PyTorch, Model deployment & real-world AI use cases",
  "Accountant": "Financial accounting, GST (India), Tally/ERP, auditing, Balance sheet, taxation",
  "HR Executive": "Recruitment, payroll, Employee engagement, Labor laws (India), Conflict management",
  "Digital Marketing": "SEO, SEM, Social media marketing, Google Ads, analytics, Campaign strategy & ROI",
  // Course Based
  "BCom": "Financial Accounting, Cost Accounting, Business Law, Economics, Taxation, Auditing, Banking, Corporate Accounting, Business Statistics, Financial Management",
  "BBA": "Principles of Management, Marketing Management, Financial Management, Human Resource Management, Business Law, Organizational Behavior, Entrepreneurship, Business Communication",
  "BCA": "Programming in C/C++/Java, Data Structures, DBMS, Operating Systems, Computer Networks, Web Technologies, Software Engineering, Mathematics, Python",
  "MCA": "Advanced Java, .NET, Data Structures & Algorithms, DBMS, Software Engineering, Web Technologies, Cloud Computing, AI/ML, Operating Systems, Computer Networks",
  "MBA": "Marketing Management, Financial Management, Human Resource Management, Operations Management, Strategic Management, Business Analytics, Entrepreneurship, International Business, Leadership",
  // Programming Languages
  "C": "C fundamentals, Pointers, Memory management, Arrays, Strings, Structures, File I/O, Dynamic memory allocation, Preprocessor directives, Linked lists in C",
  "C++": "OOP concepts, Classes & Objects, Inheritance, Polymorphism, Templates, STL, Exception handling, Smart pointers, Move semantics, Design patterns in C++",
  "Java": "OOP, Collections framework, Multithreading, Exception handling, JDBC, Servlets, Spring Boot, JVM internals, Streams API, Design patterns, Microservices",
  "Python": "Data types, List comprehensions, Decorators, Generators, OOP, File handling, Django/Flask, NumPy/Pandas, Exception handling, Multithreading, Virtual environments",
  "JavaScript": "ES6+, Closures, Promises, Async/Await, DOM manipulation, Event loop, Prototypes, Modules, Error handling, TypeScript basics, Node.js fundamentals",
  "SQL": "SELECT queries, JOINs, Subqueries, Aggregation, Indexing, Normalization, Stored procedures, Triggers, Views, Window functions, Query optimization, Transactions",
  "React": "Components, Props & State, Hooks (useState, useEffect, useContext), React Router, Redux/Context API, Performance optimization, Custom hooks, Server-side rendering, Testing",
  "Node.js": "Event loop, Express.js, REST APIs, Middleware, Authentication (JWT), Database integration, File system, Streams, Error handling, WebSockets, Deployment",
  // BE/BTech
  "BE/BTech - Computer Science (CSE)": "Data Structures, Algorithms, OOP, DBMS, OS, Computer Networks, Compiler Design, Software Engineering, Web Technologies, Cloud Computing",
  "BE/BTech - Electronics & Communication (ECE)": "Analog & Digital Electronics, Signal Processing, Communication Systems, Microprocessors, VLSI, Embedded Systems, Control Systems, Electromagnetics",
  "BE/BTech - Mechanical Engineering": "Thermodynamics, Fluid Mechanics, Strength of Materials, Manufacturing, Machine Design, Heat Transfer, IC Engines, CAD/CAM, Robotics",
  "BE/BTech - Civil Engineering": "Structural Analysis, RCC Design, Geotechnical Engineering, Fluid Mechanics, Surveying, Transportation Engineering, Environmental Engineering, Construction Management",
  "BE/BTech - Electrical Engineering (EEE)": "Circuit Theory, Power Systems, Electrical Machines, Control Systems, Power Electronics, Signals & Systems, Microprocessors, Renewable Energy",
  "BE/BTech - Information Technology (IT)": "Programming, Data Structures, DBMS, Web Development, Computer Networks, Cybersecurity, Cloud Computing, Software Testing, DevOps",
  "BE/BTech - Chemical Engineering": "Chemical Process Calculations, Thermodynamics, Fluid Mechanics, Heat Transfer, Mass Transfer, Chemical Reaction Engineering, Process Control, Plant Design",
  "BE/BTech - Biotechnology": "Molecular Biology, Genetics, Biochemistry, Microbiology, Bioprocess Engineering, Genetic Engineering, Immunology, Bioinformatics, Fermentation Technology",
  // ME/MTech
  "ME/MTech - Computer Science (CSE)": "Advanced Algorithms, Distributed Systems, Machine Learning, Advanced DBMS, Cloud Architecture, Research Methodology, High Performance Computing, Blockchain",
  "ME/MTech - Electronics & Communication (ECE)": "Advanced Signal Processing, Wireless Communication, Antenna Design, Advanced VLSI, IoT, Radar Systems, Optical Communication, Satellite Communication",
  "ME/MTech - Mechanical Engineering": "Advanced Thermodynamics, CFD, FEM, Advanced Manufacturing, Mechatronics, Vibration Analysis, Composite Materials, Industrial Automation",
  "ME/MTech - Civil Engineering": "Advanced Structural Design, Earthquake Engineering, Advanced Geotechnical, Water Resources Engineering, Finite Element Methods, Smart Materials, Green Building",
  "ME/MTech - Artificial Intelligence & ML": "Deep Learning, NLP, Computer Vision, Reinforcement Learning, GANs, Transformer Models, MLOps, AI Ethics, Neural Architecture Search, Edge AI",
  "ME/MTech - Data Science": "Statistical Learning, Big Data Analytics, Data Mining, Time Series Analysis, Bayesian Methods, Feature Engineering, AutoML, Data Visualization, A/B Testing",
  "ME/MTech - VLSI Design": "CMOS Design, Digital IC Design, Analog IC Design, Physical Design, Verification, FPGA, Low Power Design, SoC Architecture, Testing & DFT",
  "ME/MTech - Structural Engineering": "Advanced RCC, Prestressed Concrete, Steel Structures, Bridge Engineering, Earthquake Resistant Design, Wind Engineering, Structural Dynamics, Finite Element Analysis",
};

const difficultyMap: Record<string, string> = {
  "Basic": "easy",
  "Intermediate": "medium",
  "Advanced": "hard",
  "Scenario-Based": "hard",
  "HR & Behavioral": "medium",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { role, category } = await req.json();

    // If specific role+category provided, generate just that batch
    const rolesToProcess = role ? [role] : roles;
    const categoriesToProcess = category ? [category] : categories;

    const results: string[] = [];

    for (const r of rolesToProcess) {
      for (const c of categoriesToProcess) {
        // Top up to 200 questions per (role, category)
        const TARGET = 200;
        const { count: existingCount } = await supabase
          .from("interview_questions")
          .select("id", { count: "exact", head: true })
          .eq("role", r)
          .eq("category", c);

        let currentCount = existingCount || 0;
        if (currentCount >= TARGET) {
          results.push(`${r} - ${c}: Already has ${currentCount}/${TARGET} questions`);
          continue;
        }

        const isCourse = ["BCom", "BBA", "BCA", "MCA", "MBA"].includes(r);
        const isProgramming = ["C", "C++", "Java", "Python", "JavaScript", "SQL", "React", "Node.js"].includes(r);
        const isEngineering = r.startsWith("BE/BTech") || r.startsWith("ME/MTech");
        
        const contextLabel = isCourse ? `course: ${r}` : isProgramming ? `programming language: ${r}` : isEngineering ? `engineering specialization: ${r}` : `job role: ${r}`;
        const questionType = isProgramming ? "coding and technical interview" : isCourse ? "academic viva and placement interview" : isEngineering ? "academic and technical interview" : "interview";

        let totalInserted = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = 8; // safety: ~40/batch * 8 = 320 max per call

        while (currentCount < TARGET && attempts < MAX_ATTEMPTS) {
          attempts++;
          const needed = TARGET - currentCount;
          const batchSize = Math.min(40, needed);

          const prompt = `Act as a senior industry expert and interviewer.
Generate exactly ${batchSize} UNIQUE ${questionType} questions and answers for the ${contextLabel}
Category: ${c}
Topics to cover: ${roleTopics[r] || r}

Requirements:
- Realistic, commonly asked in 2025 interviews/exams
- DO NOT repeat common/basic questions; vary topics, scenarios, and angles
- Gradually increase difficulty within the batch
- 2-5 lines per answer, clear, concise, practical
- Include examples where possible
- Avoid textbook definitions
- Generate fresh, varied questions (batch #${attempts})

Return a JSON array of objects with keys "question" and "answer". Example:
[{"question":"What is...","answer":"It is..."}]
Return ONLY the JSON array, no markdown, no extra text.`;

          const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                { role: "system", content: "You are an expert interviewer. Return ONLY valid JSON array. No markdown." },
                { role: "user", content: prompt },
              ],
              temperature: 0.8,
              max_tokens: 8000,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error(`DeepSeek error for ${r}-${c}:`, errText);
            break;
          }

          const data = await response.json();
          const raw = data.choices?.[0]?.message?.content || "";

          let parsed;
          try {
            const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
            parsed = JSON.parse(jsonMatch[1].trim());
          } catch {
            console.error(`JSON parse error for ${r}-${c} attempt ${attempts}`);
            continue;
          }

          if (!Array.isArray(parsed)) continue;

          const difficulty = difficultyMap[c] || "medium";
          const rows = parsed
            .filter((item: any) => item.question && item.answer)
            .map((item: any) => ({
              role: r,
              category: c,
              question: item.question,
              answer: item.answer,
              difficulty,
            }));

          if (rows.length === 0) continue;

          const { error: insertError } = await supabase
            .from("interview_questions")
            .insert(rows);

          if (insertError) {
            console.error(`Insert error for ${r}-${c}:`, insertError.message);
            break;
          }

          totalInserted += rows.length;
          currentCount += rows.length;
        }

        results.push(`${r} - ${c}: Inserted ${totalInserted} (total now ${currentCount}/${TARGET})`);
      }
    }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
