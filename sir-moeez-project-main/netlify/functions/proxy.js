import crypto from "node:crypto";

const crypto = require("crypto");

// In-memory cache (survives warm invocations)
const responseCache = new Map(); // key -> { ts, contentType, bodyString }
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function makeKey(event) {
  const ct = (event.headers?.["content-type"] || "").toLowerCase();
  const q = (() => {
    try {
      const u = new URL(event.rawUrl || "http://local");
      return u.searchParams.get("query") || "";
    } catch {
      return "";
    }
  })();
  const bodyHash = crypto
    .createHash("sha256")
    .update(event.body || "")
    .digest("hex");
  return `v1|${ct}|${q}|${bodyHash}`;
}

export const handler = async (event, context) => {
  // Netlify Function entry point: use environment variable for API key
  const TARGET_API_KEY =
    process.env.TARGET_API_KEY || process.env.PREDICT_API_KEY || null;
  if (!TARGET_API_KEY) {
    console.warn(
      "[proxy] WARNING: TARGET_API_KEY / PREDICT_API_KEY not set. Upstream requests will be unauthenticated.",
    );
  }
  const TARGETS = [
    process.env.TARGET_API_URL,
    process.env.GENERATE_API_URL,
    process.env.PREDICT_ENDPOINT,
    "https://api-va5v.onrender.com/generate-questions",
  ]
    .filter(Boolean)
    .map((s) => String(s).trim());

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 5000; // per attempt

  const cacheKey = makeKey(event);
  const getCached = () => {
    const c = responseCache.get(cacheKey);
    if (!c) return null;
    if (Date.now() - c.ts > MAX_CACHE_AGE_MS) return null;
    return c;
  };

  const saveCache = (contentType, bodyString) => {
    responseCache.set(cacheKey, { ts: Date.now(), contentType, bodyString });
  };

  const makeRequest = async (url) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const headers = {};
      if (event.headers) {
        for (const k of Object.keys(event.headers))
          headers[k] = event.headers[k];
      }
      delete headers.host;
      delete headers["content-length"];
      if (TARGET_API_KEY) headers["Authorization"] = `Bearer ${TARGET_API_KEY}`;

      const isBase64 = !!event.isBase64Encoded;
      const opts = {
        method: event.httpMethod || "POST",
        headers,
        signal: controller.signal,
        body: event.body
          ? isBase64
            ? Buffer.from(event.body, "base64")
            : event.body
          : undefined,
      };

      const res = await fetch(url, opts);
      clearTimeout(id);
      const contentType = res.headers.get("content-type") || "text/plain";
      const status = res.status;
      const bodyString = await res.text();
      return { ok: res.ok, status, contentType, bodyString };
    } catch (err) {
      clearTimeout(id);
      return { ok: false, error: String(err) };
    }
  };

  // Try each target, with retries
  let lastError = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const base of TARGETS) {
      let url = base;
      try {
        const u = new URL(base);
        const path = u.pathname.replace(/\/+$/, "");
        if (!/\/generate-questions$/.test(path))
          u.pathname = `${path}/generate-questions`;
        url = u.toString();
      } catch {
        url = String(base).replace(/\/+$/, "") + "/generate-questions";
      }

      const res = await makeRequest(url);
      if (res.ok) {
        saveCache(res.contentType, res.bodyString);
        return {
          statusCode: 200,
          headers: { "Content-Type": res.contentType },
          body: res.bodyString,
        };
      }
      lastError = res.error || `status:${res.status}`;
    }
  }

  if (lastError) {
    console.error("[proxy] All upstream attempts failed:", lastError);
  }

  // Fallback to cached last success for this key
  const cached = getCached();
  if (cached) {
    return {
      statusCode: 200,
      headers: { "Content-Type": cached.contentType },
      body: cached.bodyString,
    };
  }

  // As a final fallback, return a minimal textual response to avoid empty UI
  const fallbackText =
    "Q1. Describe the main concept discussed in the chapter.\nQ2. Explain one key application with an example.\nQ3. List two important definitions from the chapter.";
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: fallbackText,
  };
};
