import type { RequestHandler } from "express";
import multer from "multer";
import { createHash } from "node:crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

const DEFAULT_API = "https://api-va5v.onrender.com/generate-questions" as const;

const CACHE_TTL_MS = 15 * 60_000;
const cache = new Map<string, { ts: number; json?: any; text?: string }>();

// Middleware stack: multer first to parse multipart with single PDF file named "pdf" (we also accept "file")
export const uploadPdf = upload.fields([
  { name: "pdf", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

export const handleGenerate: RequestHandler = async (req, res) => {
  try {
    const body = req.body as Record<string, string>;

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const file: Express.Multer.File | undefined =
      files?.pdf?.[0] || files?.file?.[0];

    if (!file) {
      return res
        .status(400)
        .json({ error: "Missing PDF file. Use 'pdf' field." });
    }

    const query = (body?.query ?? body?.q ?? "").toString();

    const key = createHash("sha256")
      .update(file.buffer)
      .update("|")
      .update(query)
      .digest("hex");
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      if (cached.json !== undefined) {
        return res.status(200).json(cached.json);
      }
      return res.status(200).json({ result: cached.text ?? "" });
    }
    const form = new FormData();
    const uint8 = new Uint8Array(file.buffer);
    const blob = new Blob([uint8], {
      type: file.mimetype || "application/pdf",
    });
    // Append only once to avoid duplicating payload size
    form.append("pdf", blob, file.originalname || "document.pdf");
    if (query) form.append("query", query);

    // Build list of upstreams to try: env -> default -> Netlify proxy on same host
    const upstreams: string[] = [];
    const envBase = process.env.PREDICT_ENDPOINT;
    const normalize = (base: string) => {
      try {
        const u = new URL(base);
        const path = u.pathname.replace(/\/+$/, "");
        if (!/\/generate-questions$/.test(path))
          u.pathname = `${path}/generate-questions`;
        if (query) u.searchParams.set("query", query);
        return u.toString();
      } catch {
        const b = String(base).replace(/\/+$/, "");
        const url = new URL(`${b}/generate-questions`);
        if (query) url.searchParams.set("query", query);
        return url.toString();
      }
    };
    if (envBase && envBase.trim()) upstreams.push(normalize(envBase));
    upstreams.push(normalize(DEFAULT_API));

    // Same-host Netlify proxy fallback
    const host = String(
      req.headers["x-forwarded-host"] || req.headers.host || "",
    );
    const proto = String(req.headers["x-forwarded-proto"] || "https");
    if (host)
      upstreams.push(
        `${proto}://${host}/api/proxy${query ? `?query=${encodeURIComponent(query)}` : ""}`,
      );

    let finalResp: Response | null = null;
    for (const target of upstreams) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        const resp = await fetch(target, {
          method: "POST",
          body: form,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));
        if (resp && resp.ok) {
          finalResp = resp;
          break;
        }
        // If not ok, continue trying next
      } catch {
        // network error -> try next
      }
    }

    if (!finalResp) {
      return res
        .status(502)
        .json({ error: true, message: "All upstreams failed" });
    }

    const contentType = finalResp.headers.get("content-type") || "";

    if (!finalResp.ok) {
      const errText = await finalResp.text().catch(() => finalResp.statusText);
      return res
        .status(finalResp.status)
        .json({ error: true, message: errText || "Upstream error" });
    }

    if (contentType.includes("application/json")) {
      const json = await finalResp.json();
      cache.set(key, { ts: Date.now(), json });
      return res.status(200).json(json);
    }

    // Fallback: return text result under a consistent shape
    const text = await finalResp.text();
    cache.set(key, { ts: Date.now(), text });
    return res.status(200).json({ result: text });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: true, message: "Upstream timeout" });
    }
    return res
      .status(500)
      .json({ error: true, message: err?.message || "Internal Server Error" });
  }
};
