export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";

  const ALLOWED_ORIGINS = [
    "https://davetwchiu.github.io",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000"
  ];

  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8"
  };

  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: corsHeaders
    });
  }

  function buildSystemPrompt(payload) {
    const { mode, controls } = payload;

    return `
You are a careful editor. Rewrite the user's text to sound more human and less formulaic.

Rules:
- Preserve meaning.
- Do not add facts.
- Do not remove important facts.
- Reduce vague significance language, hype, stock transitions, over-symmetry, and em-dash overuse.
- Prefer plain, concrete wording where possible.
- Vary sentence rhythm naturally.
- Keep the chosen tone and level of formality.
- Return only valid JSON.

Tone mode: ${mode}

Control settings:
- plainness: ${controls?.plainness ?? 70}
- hype reduction: ${controls?.hype ?? 80}
- sentence variation: ${controls?.variation ?? 60}
- specificity: ${controls?.specificity ?? 60}
- formal tone: ${controls?.formal ?? 70}

Return strict JSON with this shape:
{
  "output": "rewritten text",
  "notes": ["short note 1", "short note 2"]
}
`.trim();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const model = typeof body.model === "string" && body.model.trim()
    ? body.model.trim()
    : "openrouter/free";
  const mode = typeof body.mode === "string" ? body.mode : "formal";
  const controls = typeof body.controls === "object" && body.controls ? body.controls : {};

  if (!text) {
    return json({ error: "Text is required" }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return json({ error: "Missing OPENROUTER_API_KEY secret." }, 500);
  }

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://YOUR_GITHUB_USERNAME.github.io",
        "X-Title": "Humaniser"
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildSystemPrompt({ mode, controls })
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    const raw = await upstream.text();

    if (!upstream.ok) {
      return json(
        {
          error: "OpenRouter request failed",
          status: upstream.status,
          details: raw
        },
        502
      );
    }

    let parsedUpstream;
    try {
      parsedUpstream = JSON.parse(raw);
    } catch {
      return json({ error: "Could not parse OpenRouter response", details: raw }, 502);
    }

    const content = parsedUpstream?.choices?.[0]?.message?.content;
    if (!content) {
      return json({ error: "No model output returned", details: parsedUpstream }, 502);
    }

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch {
      parsedContent = {
        output: content,
        notes: ["Model did not return strict JSON. Raw text used instead."]
      };
    }

    return json({
      output: typeof parsedContent.output === "string" && parsedContent.output.trim()
        ? parsedContent.output.trim()
        : text,
      notes: Array.isArray(parsedContent.notes) ? parsedContent.notes : []
    });
  } catch (err) {
    return json(
      {
        error: "Function failure",
        details: err instanceof Error ? err.message : String(err)
      },
      500
    );
  }
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin") || "";
  const ALLOWED_ORIGINS = [
    "https://YOUR_GITHUB_USERNAME.github.io",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000"
  ];

  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
