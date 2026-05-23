import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, orderId, amount, buyerEmail, buyerPhone, buyerFirstname, buyerLastname, mode } =
      await req.json();

    if (!userId || !orderId || !amount || !buyerEmail || !buyerPhone || !buyerFirstname) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test mode forces ₹1 and uses Airpay sandbox checkout URL
    const isTest = mode === "test";
    const effectiveAmount = isTest ? 1 : amount;
    const checkoutUrl = isTest
      ? "https://sandbox.airpay.co.in/pay/v4/"
      : "https://payments.airpay.co.in/pay/v4/";

    const merchantId = Deno.env.get("AIRPAY_MERCHANT_ID");
    const username = Deno.env.get("AIRPAY_USERNAME");
    const password = Deno.env.get("AIRPAY_PASSWORD");
    const secret = Deno.env.get("AIRPAY_SECRET");
    const secretKey = Deno.env.get("AIRPAY_SECRET_KEY");

    if (!merchantId || !username || !password || !secret || !secretKey) {
      return new Response(JSON.stringify({ error: "Airpay credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    // privatekey = SHA-256( secret @ username :|: password ) — per Airpay docs
    const privateKeyHash = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(`${secret}@${username}:|:${password}`),
    );
    const privateKey = Array.from(new Uint8Array(privateKeyHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // pysimpltxn request body
    const paymentData: Record<string, string> = {
      orderid: orderId,
      amount: parseFloat(String(effectiveAmount)).toFixed(2),
      currency_code: "356",
      iso_currency: "inr",
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      buyer_firstname: buyerFirstname,
      buyer_lastname: buyerLastname || "",
    };

    // Checksum: sort keys A→Z, concat values, append IST date (YYYY-MM-DD), SHA-256
    const sortedKeys = Object.keys(paymentData).sort();
    let checksumStr = "";
    for (const key of sortedKeys) checksumStr += paymentData[key];

    const istParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const dateStr =
      `${istParts.find((p) => p.type === "year")!.value}-` +
      `${istParts.find((p) => p.type === "month")!.value}-` +
      `${istParts.find((p) => p.type === "day")!.value}`;
    checksumStr += dateStr;

    const checksumHash = await crypto.subtle.digest("SHA-256", encoder.encode(checksumStr));
    const checksum = Array.from(new Uint8Array(checksumHash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // AES-256-CBC encryption of JSON using secretKey; IV is 16-char hex (8 random bytes → hex)
    const jsonData = JSON.stringify(paymentData);
    const ivRandom = crypto.getRandomValues(new Uint8Array(8));
    const ivHex = Array.from(ivRandom).map((b) => b.toString(16).padStart(2, "0")).join("");

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey).slice(0, 32),
      { name: "AES-CBC" },
      false,
      ["encrypt"],
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: encoder.encode(ivHex) },
      cryptoKey,
      encoder.encode(jsonData),
    );
    const base64Encrypted = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const encdata = ivHex + base64Encrypted;

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: checkoutUrl,
        mode: isTest ? "test" : "live",
        effectiveAmount,
        formData: {
          privatekey: privateKey,
          merchant_id: merchantId,
          encdata,
          checksum,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Airpay payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
