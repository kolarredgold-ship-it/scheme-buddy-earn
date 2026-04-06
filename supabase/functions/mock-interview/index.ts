import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, role, topic, difficulty, questionCount, question, answer, questions, answers, category, subcategory, round, userId } = await req.json();

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    let systemPrompt: string;
    let userPrompt: string;

    if (action === "generate_questions") {
      systemPrompt = "You are an expert interviewer. Return ONLY valid JSON array. No markdown, no extra text.";
      userPrompt = `Generate ${questionCount || 5} interview questions for a ${difficulty || 'intermediate'} level candidate applying for a "${role}" position. Focus area: "${topic}".

Return a JSON array of objects with keys: "id" (number), "question" (string), "category" (string like "Technical", "Behavioral", "Situational", "Problem Solving"), "tip" (a brief hint to help the candidate, 1 sentence).

Example: [{"id":1,"question":"...","category":"Technical","tip":"..."}]
Return ONLY the JSON array.`;
    } else if (action === "evaluate_answer") {
      systemPrompt = "You are an expert interview coach. Return ONLY valid JSON. No markdown.";
      userPrompt = `Evaluate this interview answer:

Question: ${question}
Candidate's Answer: ${answer}

Rate the answer and provide feedback. Return JSON with keys:
- "score" (number 1-10)
- "rating" (string: "Excellent", "Good", "Average", "Needs Improvement", "Poor")
- "strengths" (array of 2-3 strength points)
- "improvements" (array of 2-3 areas to improve)
- "sampleAnswer" (a model answer in 100-150 words)

Return ONLY valid JSON.`;
    } else if (action === "evaluate_all") {
      systemPrompt = "You are an expert interview coach. Return ONLY valid JSON. No markdown.";
      const qaPairs = questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "(No answer provided)"}`).join("\n\n");
      userPrompt = `Evaluate this complete mock interview for a "${role}" position (${topic}):

${qaPairs}

Return JSON with keys:
- "overallScore" (number 1-100)
- "overallRating" (string: "Excellent", "Good", "Average", "Needs Improvement")
- "summary" (2-3 sentence overall feedback)
- "topStrengths" (array of 3 key strengths)
- "topImprovements" (array of 3 key areas to improve)
- "hireRecommendation" (string: "Strong Hire", "Hire", "Maybe", "No Hire")
- "tips" (array of 3 actionable tips for next interview)

Return ONLY valid JSON.`;
    } else if (action === "generate-questions") {
      systemPrompt = "You are an interview preparation expert. Return ONLY valid JSON.";
      userPrompt = `Generate 10 interview questions for ${subcategory || topic} (category: ${category || 'general'}).
For each question, provide a clear, concise answer.
Assign difficulty: easy, medium, or hard.
Return ONLY valid JSON array: [{"question":"...","answer":"...","difficulty":"easy|medium|hard"}]`;
    } else if (action === "ask-question") {
      const reqTopic = topic || "general";
      systemPrompt = "You are a professional interviewer.";
      userPrompt = `You are conducting a job interview for the role/topic: ${reqTopic}.
This is round ${round || 1}. Ask ONE clear, professional interview question.
Return ONLY the question text, nothing else.`;
This is round ${round}. Ask ONE clear, professional interview question.
Return ONLY the question text, nothing else.`;
    } else if (action === "evaluate") {
      systemPrompt = "You are an expert interview evaluator. Return ONLY valid JSON.";
      userPrompt = `Evaluate this interview answer.
Topic: ${topic}
Question: ${question}
Candidate's Answer: ${answer}

Provide:
1. Score (1-10)
2. Feedback (2-3 sentences)
3. Improvement suggestions (2-3 bullet points)

Return ONLY valid JSON: {"score":7,"feedback":"...","suggestions":"..."}`;
    } else {
      throw new Error("Invalid action");
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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek error:", response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      parsed = raw;
    }

    // Format response based on action type
    let responseData;
    if (action === "generate-questions") {
      const qs = (Array.isArray(parsed) ? parsed : []).map((q: any, i: number) => ({ ...q, id: `gen-${i}` }));
      responseData = { questions: qs };
    } else if (action === "ask-question") {
      responseData = { question: typeof parsed === 'string' ? parsed.trim() : (raw || "Tell me about yourself.") };
    } else if (action === "evaluate") {
      responseData = typeof parsed === 'object' && !Array.isArray(parsed) 
        ? parsed 
        : { score: 5, feedback: raw, suggestions: "Try to be more specific." };
    } else {
      responseData = { result: parsed };
    }

    return new Response(JSON.stringify(responseData), {
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
