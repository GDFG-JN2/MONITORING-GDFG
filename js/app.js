// ============================================================
// CLOUDFLARE WORKER — MONITORING GDFG
// Deploy ke: https://monitorgdfg.kemalrifael71.workers.dev/
// ============================================================

const GAS_URL = "https://script.google.com/macros/s/AKfycbxgC5QYg1PWSJ1WSgFHKNvQcXQ52Y7MWgOlhHfDx_1KfM3t0Vc8LrnWFHNVAjIfCfnG/exec";
const ALLOWED_ORIGIN = "https://gdfg-jn2.github.io";

const ALLOWED_ORIGINS = [
  "https://gdfg-jn2.github.io",
  "http://localhost",
  "http://127.0.0.1"
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o))
    ? origin
    : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

const BIG_PAYLOAD_ACTIONS = [
  'saveMekPlanningData',
  'ocrImageEmail',
  'saveGudangData',
  'saveRealisasiData',
  'saveFdosData',
  'saveMdcData',
  'saveStandarPallet',
  'saveOpnameData',
  'saveRDCData',
];

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = getCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── Route /claude → proxy ke Anthropic API ──────────────
    if (url.pathname === "/claude" && request.method === "POST") {
      try {
        const body = await request.json();
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model:      body.model      || "claude-haiku-4-5-20251001",
            max_tokens: body.max_tokens || 1000,
            system:     body.system     || "",
            messages:   body.messages   || []
          })
        });
        const data = await anthropicRes.text();
        return new Response(data, {
          status: anthropicRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json;charset=UTF-8" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Claude proxy error: " + err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Route /gemini → proxy ke Google Gemini API ───────────
    if (url.pathname === "/gemini" && request.method === "POST") {
      try {
        const body = await request.json();
        const model = body.model || "gemini-1.5-flash";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

        // Konversi format Anthropic → Gemini
        const contents = (body.messages || []).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

        const geminiBody = {
          contents,
          systemInstruction: body.system ? { parts: [{ text: body.system }] } : undefined,
          generationConfig: {
            maxOutputTokens: body.max_tokens || 1000,
            temperature: 0.7
          }
        };

        const geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody)
        });

        const data = await geminiRes.json();

        // Konversi response Gemini → format Anthropic supaya app.js tidak perlu diubah
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada respons.";
        const normalized = {
          content: [{ type: "text", text }],
          usage: data.usageMetadata || {}
        };

        return new Response(JSON.stringify(normalized), {
          status: geminiRes.ok ? 200 : geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json;charset=UTF-8" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Gemini proxy error: " + err.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Route default → GAS proxy ───────────────────────────
    try {
      let gasResponse;

      if (request.method === "POST") {
        const body = await request.json();
        const action = body.action || "";
        const payloadStr = JSON.stringify(body.payload ?? {});
        const usePOST = BIG_PAYLOAD_ACTIONS.includes(action) || payloadStr.length > 2000;

        if (usePOST) {
          gasResponse = await fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, payload: body.payload ?? {} }),
            redirect: "follow"
          });
        } else {
          const params = new URLSearchParams({ action, payload: payloadStr });
          gasResponse = await fetch(`${GAS_URL}?${params.toString()}`, {
            method: "GET",
            redirect: "follow"
          });
        }
      } else {
        gasResponse = await fetch(`${GAS_URL}${url.search}`, { redirect: "follow" });
      }

      const data = await gasResponse.text();
      return new Response(data, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json;charset=UTF-8",
          "Cache-Control": "no-store"
        }
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, message: "Worker error: " + err.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
};
