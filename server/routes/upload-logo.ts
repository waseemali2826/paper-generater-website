import type { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

function sanitize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const rawInstitute = String(
      (req.body?.instituteName as string) || "institute",
    );
    const inst = sanitize(rawInstitute || "institute");
    const dest = path.join(process.cwd(), "data", "logos", inst);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const email = sanitize(String((req.body?.email as string) || "user"));
    const rawInstitute = String(
      (req.body?.instituteName as string) || "institute",
    );
    const inst = sanitize(rawInstitute || "institute");
    const ext = path.extname(file.originalname || "");
    const name = `${email}__${inst}${ext || ".png"}`;
    cb(null, name);
  },
});

export const uploadLogo = multer({ storage }).single("logo");

export const handleUploadLogo: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: true, message: "No file uploaded" });
    return;
  }
  const relDir = path
    .relative(process.cwd(), req.file.destination)
    .split(path.sep)
    .join("/");
  const relPath = `/${relDir}/${req.file.filename}`;
  const url = relPath.replace(/\\/g, "/");
  res.json({ ok: true, path: relPath, url });
};
