import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, role, questionCount, answers, questions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let body: any;

    if (action === "generate_questions") {
      const count = Math.min(questionCount || 25, 30);
      body = {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are Priya Sharma, a senior Indian HR Manager at a top company. You conduct professional, warm but evaluative interviews. Always respond using the provided tool only.",
          },
          {
            role: "user",
            content: `Generate exactly ${count} interview questions for a "${role}" candidate. Mix: 5 introduction/HR, 8 technical/role-specific, 6 behavioral/situational, 4 problem-solving, 2 closing/salary/why-us. Keep each question 1-2 sentences, conversational, like a real Indian HR speaking.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_questions",
              description: "Return interview questions",
              parameters: {
                type: "object",
                properties: {
                  greeting: {
                    type: "string",
                    description: "Warm 1-sentence greeting from HR Priya to start the interview",
                  },
                  questions: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of interview questions",
                  },
                },
                required: ["greeting", "questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_questions" } },
      };
    } else if (action === "final_verdict") {
      const qaPairs = questions
        .map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "(no answer)"}`)
        .join("\n\n");
      body = {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are Priya Sharma, senior Indian HR Manager. Evaluate strictly but fairly. Decide SELECTED or REJECTED based on overall quality, communication, and content of answers. Use only the provided tool.",
          },
          {
            role: "user",
            content: `Role: ${role}\n\nFull interview transcript:\n\n${qaPairs}\n\nGive final hiring decision now.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_verdict",
              description: "Return final hiring verdict",
              parameters: {
                type: "object",
                properties: {
                  decision: { type: "string", enum: ["SELECTED", "REJECTED"] },
                  score: { type: "number", description: "Overall score 0-100" },
                  spokenVerdict: {
                    type: "string",
                    description:
                      "2-3 sentence verdict the HR will speak aloud to the candidate, warm but honest",
                  },
                  strengths: { type: "array", items: { type: "string" } },
                  improvements: { type: "array", items: { type: "string" } },
                  finalRemarks: {
                    type: "string",
                    description: "Short 1-2 sentence closing remark",
                  },
                },
                required: [
                  "decision",
                  "score",
                  "spokenVerdict",
                  "strengths",
                  "improvements",
                  "finalRemarks",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_verdict" } },
      };
    } else {
      throw new Error("Invalid action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-hr-interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
