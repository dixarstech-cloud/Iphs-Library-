/*
  IPHS School Library: Gemini proxy for teachers (Cloudflare Worker).

  The Gemini key stays here, on the server, and is never sent to the app.
  Teachers prove who they are with a teacher access code. Setup steps are in PROXY_SETUP.md.

  Settings (add them in the Cloudflare dashboard, Worker, Settings, Variables and Secrets):
    GEMINI_API_KEY   secret, required. Your key from https://aistudio.google.com/apikey
    TEACHER_CODES    secret, required. One or more access codes separated by commas, for example: BLUE-HERON-42,MARY-2026
    ALLOWED_ORIGINS  text, recommended. Web addresses allowed to call this proxy, separated by commas,
                     for example: https://yourname.github.io   (no path, no trailing slash)
    ALLOWED_MODELS   text, optional. Defaults to the list below.
    PER_MINUTE       text, optional. Requests each teacher code may make per minute. Default 8.
    PER_DAY          text, optional. Requests each teacher code may make per day. Default 200.
    RATE             KV namespace binding, optional. Makes the limits exact across all Cloudflare locations.
*/

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
const MAX_BODY_BYTES = 100000, MAX_MESSAGES = 12, MAX_CHARS = 24000, MAX_TOKENS = 1024, TIMEOUT_MS = 25000;
const memory = new Map();

const list = v => String(v || "").split(",").map(s => s.trim()).filter(Boolean);
const num = (v, d) => { const n = parseInt(v, 10); return n > 0 ? n : d; };

function corsHeaders(origin, env) {
  const allowed = list(env.ALLOWED_ORIGINS), h = { "Vary": "Origin", "Cache-Control": "no-store" };
  if (!allowed.length) h["Access-Control-Allow-Origin"] = "*";
  else if (origin && allowed.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
const originAllowed = (origin, env) => { const a = list(env.ALLOWED_ORIGINS); return !a.length || !origin || a.includes(origin); };
function json(body, status, extra) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...extra } });
}
const fail = (status, message, extra) => json({ error: { message } }, status, extra);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
// Compare codes by their hashes so the check takes the same time whatever is typed.
async function codeIsValid(given, env) {
  const gh = await sha256(given); let ok = false;
  for (const code of list(env.TEACHER_CODES)) { const ch = await sha256(code); let diff = 0; for (let i = 0; i < gh.length; i++) diff |= gh.charCodeAt(i) ^ ch.charCodeAt(i); if (diff === 0) ok = true; }
  return ok;
}

async function takeTurn(env, id) {
  const perMinute = num(env.PER_MINUTE, 8), perDay = num(env.PER_DAY, 200), now = Date.now();
  const windows = [["m", 60, perMinute], ["d", 86400, perDay]];
  for (const [tag, secs, max] of windows) {
    const key = `${id}:${tag}:${Math.floor(now / 1000 / secs)}`;
    let used;
    if (env.RATE) { used = parseInt(await env.RATE.get(key), 10) || 0; }
    else { const e = memory.get(key); used = e ? e.n : 0; }
    if (used >= max) return { ok: false, retryAfter: Math.max(1, secs - (Math.floor(now / 1000) % secs)), scope: tag === "m" ? "minute" : "day" };
  }
  for (const [tag, secs] of windows) {
    const key = `${id}:${tag}:${Math.floor(now / 1000 / secs)}`;
    if (env.RATE) { const used = parseInt(await env.RATE.get(key), 10) || 0; await env.RATE.put(key, String(used + 1), { expirationTtl: secs + 60 }); }
    else { const e = memory.get(key) || { n: 0, exp: now + (secs + 60) * 1000 }; e.n++; memory.set(key, e); }
  }
  if (memory.size > 5000) for (const [k, v] of memory) if (v.exp < now) memory.delete(k);
  return { ok: true };
}

function cleanRequest(body, env) {
  if (!body || typeof body !== "object") return { error: "Send a JSON body with model and messages." };
  const models = list(env.ALLOWED_MODELS).length ? list(env.ALLOWED_MODELS) : DEFAULT_MODELS;
  const model = body.model ? String(body.model).replace(/^models\//, "") : models[0];
  if (!models.includes(model)) return { error: `Model "${model}" is not allowed here. Use one of: ${models.join(", ")}.` };
  if (!Array.isArray(body.messages) || !body.messages.length) return { error: "messages must be a list with at least one message." };
  if (body.messages.length > MAX_MESSAGES) return { error: `Send at most ${MAX_MESSAGES} messages.`, status: 413 };
  let chars = 0; const messages = [];
  for (const m of body.messages) {
    if (!m || !["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string") return { error: "Each message needs a role (system, user or assistant) and text content." };
    chars += m.content.length; messages.push({ role: m.role, content: m.content });
  }
  if (chars > MAX_CHARS) return { error: `The messages are too long. Keep them under ${MAX_CHARS} characters.`, status: 413 };
  const t = Number(body.temperature), mt = Number(body.max_tokens);
  return { payload: { model, messages, temperature: Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0.3, max_tokens: Number.isFinite(mt) && mt > 0 ? Math.min(MAX_TOKENS, Math.floor(mt)) : MAX_TOKENS, stream: false } };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), origin = request.headers.get("Origin") || "", cors = corsHeaders(origin, env);
    if (request.method === "OPTIONS") {
      if (!originAllowed(origin, env)) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400" } });
    }
    if (!originAllowed(origin, env)) return fail(403, "This website is not allowed to use the proxy.");
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({ ok: true, service: "iphs-gemini-proxy", ready: Boolean(env.GEMINI_API_KEY && list(env.TEACHER_CODES).length) }, 200, cors);
    }
    if (request.method !== "POST" || !["/", "/chat", "/v1/chat/completions"].includes(url.pathname)) return fail(404, "Not found. Send POST requests to the proxy address.", cors);
    if (!env.GEMINI_API_KEY || !list(env.TEACHER_CODES).length) return fail(500, "The proxy is not set up yet. Add GEMINI_API_KEY and TEACHER_CODES in Cloudflare.", cors);

    const auth = request.headers.get("Authorization") || "", code = auth.replace(/^Bearer\s+/i, "").trim();
    if (!code || !(await codeIsValid(code, env))) return fail(401, "The teacher access code is missing or wrong.", cors);

    const len = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (len > MAX_BODY_BYTES) return fail(413, "The request is too large.", cors);
    let text; try { text = await request.text(); } catch { return fail(400, "Could not read the request.", cors); }
    if (text.length > MAX_BODY_BYTES) return fail(413, "The request is too large.", cors);
    let body; try { body = JSON.parse(text); } catch { return fail(400, "The request is not valid JSON.", cors); }
    const clean = cleanRequest(body, env); if (clean.error) return fail(clean.status || 400, clean.error, cors);

    const turn = await takeTurn(env, (await sha256(code)).slice(0, 16));
    if (!turn.ok) return fail(429, `Too many questions for this teacher code. Try again in ${turn.retryAfter} seconds (${turn.scope} limit).`, { ...cors, "Retry-After": String(turn.retryAfter) });

    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const up = await fetch(GEMINI_URL, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GEMINI_API_KEY}` }, body: JSON.stringify(clean.payload) });
      const out = await up.text();
      if (!up.ok) {
        const status = up.status === 429 ? 429 : 502;
        return fail(status, up.status === 429 ? "Gemini is busy or its free limit is used up. Try again later." : `Gemini could not answer (status ${up.status}).`, cors);
      }
      return new Response(out, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", ...cors } });
    } catch (e) {
      return fail(504, e && e.name === "AbortError" ? "Gemini took too long to reply." : "Could not reach Gemini.", cors);
    } finally { clearTimeout(timer); }
  }
};
