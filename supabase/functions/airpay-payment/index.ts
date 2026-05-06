import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, orderId, amount, buyerEmail, buyerPhone, buyerFirstname, buyerLastname, mode } = await req.json();

    if (!userId || !orderId || !amount || !buyerEmail || !buyerPhone || !buyerFirstname) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test/Live mode: in test mode, force ₹1 amount and use Airpay sandbox endpoints
    const isTest = mode === "test";
    const effectiveAmount = isTest ? 1 : amount;
    const oauthEndpoint = isTest
      ? "https://sandbox.airpay.co.in/airpay/pay/v4/api/oauth2/"
      : "https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2/";
    const checkoutBase = isTest
      ? "https://sandbox.airpay.co.in/pay/v4/"
      : "https://payments.airpay.co.in/pay/v4/";

    // Airpay credentials from secrets
    const merchantId = Deno.env.get("AIRPAY_MERCHANT_ID");
    const username = Deno.env.get("AIRPAY_USERNAME");
    const password = Deno.env.get("AIRPAY_PASSWORD");
    const secret = Deno.env.get("AIRPAY_SECRET");
    const secretKey = Deno.env.get("AIRPAY_SECRET_KEY");
    const clientId = Deno.env.get("AIRPAY_CLIENT_ID");
    const clientSecret = Deno.env.get("AIRPAY_CLIENT_SECRET");

    if (!merchantId || !username || !password || !secret || !secretKey) {
      return new Response(JSON.stringify({ error: "Airpay credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate private key: SHA256 of secret@username:|:password
    const encoder = new TextEncoder();
    const privateKeyData = encoder.encode(`${secret}@${username}:|:${password}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", privateKeyData);
    const privateKey = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // Prepare payment data
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

    // Generate checksum: sort keys alphabetically, concat values, append date, SHA256
    const sortedKeys = Object.keys(paymentData).sort();
    let checksumStr = "";
    for (const key of sortedKeys) {
      checksumStr += paymentData[key];
    }
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    checksumStr += dateStr;
    
    const checksumBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(checksumStr));
    const checksum = Array.from(new Uint8Array(checksumBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    // AES-256-CBC encryption
    const jsonData = JSON.stringify(paymentData);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
    
    // Import encryption key
    const keyData = encoder.encode(secretKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData.slice(0, 32),
      { name: "AES-CBC" },
      false,
      ["encrypt"]
    );

    const ivBytes = encoder.encode(ivHex);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: ivBytes },
      cryptoKey,
      encoder.encode(jsonData)
    );

    // Convert to base64 and prepend IV
    const base64Encrypted = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const encdata = ivHex + base64Encrypted;

    // Get OAuth2 token if client credentials available
    let token = "";
    if (clientId && clientSecret) {
      try {
        const oauthData = {
          client_id: clientId,
          client_secret: clientSecret,
          merchant_id: merchantId,
          grant_type: "client_credentials",
        };

        // Encrypt OAuth data
        const oauthIv = crypto.getRandomValues(new Uint8Array(16));
        const oauthIvHex = Array.from(oauthIv).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 16);
        const oauthIvBytes = encoder.encode(oauthIvHex);
        const oauthEncrypted = await crypto.subtle.encrypt(
          { name: "AES-CBC", iv: oauthIvBytes },
          cryptoKey,
          encoder.encode(JSON.stringify(oauthData))
        );
        const oauthBase64 = btoa(String.fromCharCode(...new Uint8Array(oauthEncrypted)));
        const oauthEncdata = oauthIvHex + oauthBase64;

        // OAuth checksum
        const oauthSortedKeys = Object.keys(oauthData).sort();
        let oauthChecksumStr = "";
        for (const key of oauthSortedKeys) {
          oauthChecksumStr += oauthData[key as keyof typeof oauthData];
        }
        oauthChecksumStr += dateStr;
        const oauthChecksumBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(oauthChecksumStr));
        const oauthChecksum = Array.from(new Uint8Array(oauthChecksumBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

        const oauthResponse = await fetch(oauthEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            merchant_id: merchantId,
            encdata: oauthEncdata,
            checksum: oauthChecksum,
          }),
        });
        
        if (oauthResponse.ok) {
          const oauthResult = await oauthResponse.json();
          if (oauthResult.response) {
            // Decrypt response
            const respIv = oauthResult.response.substring(0, 16);
            const respData = oauthResult.response.substring(16);
            const respIvBytes = encoder.encode(respIv);
            const respEncrypted = Uint8Array.from(atob(respData), c => c.charCodeAt(0));
            const decrypted = await crypto.subtle.decrypt(
              { name: "AES-CBC", iv: respIvBytes },
              cryptoKey,
              respEncrypted
            );
            const decoder = new TextDecoder();
            const tokenData = JSON.parse(decoder.decode(decrypted));
            if (tokenData.data?.access_token) {
              token = tokenData.data.access_token;
            }
          }
        }
      } catch (e) {
        console.error("OAuth token error:", e);
      }
    }

    // Store order in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Return payment form data for client-side form submission
    const paymentUrl = token 
      ? `${checkoutBase}?token=${token}`
      : checkoutBase;

    return new Response(JSON.stringify({
      success: true,
      paymentUrl,
      formData: {
        privatekey: privateKey,
        merchant_id: merchantId,
        encdata,
        checksum,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Airpay payment error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
