import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callDeepSeek(apiKey: string, messages: any[]) {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("DeepSeek error:", response.status, t);
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 401 || response.status === 402) {
      throw new Error("AUTH_OR_PAYMENT");
    }
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, role, questionCount, answers, questions } = await req.json();
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    // Server-side credit enforcement: charge one credit per session, on question generation.
    if (action === "generate_questions") {
      const { data: creditRes, error: creditErr } = await userClient.rpc("consume_tool_credit", {
        _tool_key: "live-hr-interview",
        _meta: { source: "live-hr-interview", role },
      });
      if (creditErr) {
        return new Response(JSON.stringify({ error: "Credit check failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!creditRes?.ok) {
        return new Response(JSON.stringify({ error: "Limit reached", reason: creditRes?.reason ?? "limit_reached" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    let messages: any[];

    if (action === "generate_questions") {
      const count = Math.min(questionCount || 25, 30);
      messages = [
        {
          role: "system",
          content:
            'You are Priya Sharma, a senior Indian HR Manager at a top company. You conduct professional, warm but evaluative interviews. Respond with ONLY a JSON object in this exact shape: {"greeting": "<warm 1-sentence greeting from HR Priya>", "questions": ["q1", "q2", ...]}. No markdown, no extra text.',
        },
        {
          role: "user",
          content: `Generate exactly ${count} interview questions for a "${role}" candidate. Mix: 5 introduction/HR, 8 technical/role-specific, 6 behavioral/situational, 4 problem-solving, 2 closing/salary/why-us. Each question 1-2 sentences, conversational, like a real Indian HR speaking. Return JSON only.`,
        },
      ];
    } else if (action === "final_verdict") {
      const qaPairs = questions
        .map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "(no answer)"}`)
        .join("\n\n");
      messages = [
        {
          role: "system",
          content:
            'You are Priya Sharma, senior Indian HR Manager. Evaluate strictly but fairly. Respond with ONLY a JSON object in this exact shape: {"decision": "SELECTED" | "REJECTED", "score": <0-100 number>, "spokenVerdict": "<2-3 sentence verdict HR speaks aloud, warm but honest>", "strengths": ["..."], "improvements": ["..."], "finalRemarks": "<1-2 sentence closing>"}. No markdown, no extra text.',
        },
        {
          role: "user",
          content: `Role: ${role}\n\nFull interview transcript:\n\n${qaPairs}\n\nGive final hiring decision now as JSON only.`,
        },
      ];
    } else {
      throw new Error("Invalid action");
    }

    const result = await callDeepSeek(DEEPSEEK_API_KEY, messages);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-hr-interview error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (msg === "AUTH_OR_PAYMENT") {
      return new Response(
        JSON.stringify({ error: "DeepSeek API key invalid or out of credits. Please check your DeepSeek account." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
