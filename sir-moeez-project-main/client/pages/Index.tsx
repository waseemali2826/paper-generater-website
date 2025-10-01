import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Download, ListChecks, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ToolLock from "@/components/ToolLock";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ApiResult = string;

type AppSettings = {
  initialTimeoutMs: number;
  retryTimeoutMs: number;
  autoRetry: boolean;
  defaultQuery: string;
};

const SETTINGS_KEY = "app:settings" as const;
const DEFAULT_SETTINGS: AppSettings = {
  initialTimeoutMs: 25000,
  retryTimeoutMs: 55000,
  autoRetry: true,
  defaultQuery: "",
};

const MAX_SIZE = 15 * 1024 * 1024; // 15MB

// API endpoint selection: env override -> Netlify serverless proxy (always)
const API_URL = (() => {
  const env = import.meta.env.VITE_PREDICT_ENDPOINT as string | undefined;
  return env && env.trim() ? env : "/api/proxy";
})();

function ExternalPdfSelector({
  onLoadFile,
  onSetPrompt,
  onGenerate,
  onReset,
  loading,
  onResultTitle,
}: {
  onLoadFile: (f: File | null) => void;
  onSetPrompt: (p: string) => void;
  onGenerate: (prompt?: string) => Promise<void> | void;
  onReset: () => void;
  loading?: boolean;
  onResultTitle?: (title: string) => void;
}) {
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    as: "url",
    eager: true,
  }) as Record<string, string>;
  const entries = Object.entries(pdfModules).map(([path, url]) => ({
    path,
    url,
    name: path.split("/").pop() || "file.pdf",
  }));
  const byClass = entries.reduce<
    Record<string, { path: string; url: string; name: string }[]>
  >((acc, cur) => {
    // extract class folder name
    const m = cur.path.replace(/^\/?datafiles\//, "");
    const parts = m.split("/");
    const cls = parts[0] || "Other";
    if (!acc[cls]) acc[cls] = [];
    acc[cls].push(cur);
    return acc;
  }, {});

  const classOptions = Object.keys(byClass).sort();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [subjectOptions, setSubjectOptions] = useState<
    { path: string; url: string; name: string }[]
  >([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [selectedSubjectPath, setSelectedSubjectPath] = useState<string>("");
  const [totalMarks, setTotalMarks] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("");

  const [selectedChapterPaths, setSelectedChapterPaths] = useState<string[]>(
    [],
  );
  const [isMerging, setIsMerging] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const pdfBytesCache = useRef<Map<string, ArrayBuffer>>(new Map());

  const canReset = useMemo(
    () =>
      Boolean(
        selectedClass ||
          selectedSubjectName ||
          selectedSubjectPath ||
          selectedChapterPaths.length ||
          totalMarks != null ||
          promptText,
      ),
    [
      selectedClass,
      selectedSubjectName,
      selectedSubjectPath,
      selectedChapterPaths,
      totalMarks,
      promptText,
    ],
  );

  const chapterOptionsForSubject = useMemo(
    () =>
      (subjectOptions || [])
        .filter(
          (s) =>
            selectedSubjectName && subjectOf(s.path) === selectedSubjectName,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [subjectOptions, selectedSubjectName],
  );

  const allChapterPaths = useMemo(
    () => chapterOptionsForSubject.map((s) => s.path),
    [chapterOptionsForSubject],
  );
  const isAllSelected =
    selectedChapterPaths.length > 0 &&
    selectedChapterPaths.length === allChapterPaths.length;
  const selectedCount = selectedChapterPaths.length;

  // Step-wise enabling rules
  const canSelectSubject = !!selectedClass && !isLocked;
  const canSelectChapters = !!selectedSubjectName && !isLocked;
  const canEnterMarks = selectedChapterPaths.length > 0 && !isLocked;
  const canGenerate =
    !!selectedClass &&
    !!selectedSubjectName &&
    selectedChapterPaths.length > 0 &&
    totalMarks != null &&
    !loading &&
    !isMerging &&
    !isLocked;

  const mergeSelected = useCallback(
    async (paths: string[]) => {
      setIsMerging(true);

      try {
        if (!paths.length) {
          onLoadFile(null);
          setSelectedSubjectPath("");
          return;
        }

        // Validate paths
        if (!paths.every((p) => typeof p === "string" && p.trim().length > 0)) {
          throw new Error("Invalid PDF paths provided");
        }

        const { PDFDocument, PDFPage } = await import("pdf-lib");

        // Create a new merged PDF
        const mergedPdf = await PDFDocument.create();

        // Ensure deterministic order by chapter name
        const ordered = chapterOptionsForSubject
          .filter((c) => paths.includes(c.path))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => c.path);

        // Prefetch bytes in parallel with better error handling
        const fetchResults = await Promise.allSettled(
          ordered.map(async (p) => {
            try {
              if (pdfBytesCache.current.has(p))
                return { path: p, success: true };

              const found = entries.find((e) => e.path === p);
              if (!found) {
                console.warn(`PDF not found for path: ${p}`);
                return { path: p, success: false, error: "PDF not found" };
              }

              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

              try {
                const res = await fetch(found.url, {
                  signal: controller.signal,
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const bytes = await res.arrayBuffer();
                if (bytes.byteLength === 0) throw new Error("Empty PDF file");

                // Validate it's actually a PDF
                const header = new Uint8Array(bytes, 0, 4);
                const headerStr = Array.from(header)
                  .map((b) => String.fromCharCode(b))
                  .join("");
                if (headerStr !== "%PDF") {
                  throw new Error("Invalid PDF file format");
                }

                pdfBytesCache.current.set(p, bytes);
                return { path: p, success: true };
              } finally {
                clearTimeout(timeout);
              }
            } catch (error) {
              console.error(`Failed to load PDF ${p}:`, error);
              return {
                path: p,
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          }),
        );

        // Check for failed downloads
        const failed = fetchResults.filter(
          (r): r is PromiseRejectedResult =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && !r.value.success),
        );

        if (failed.length > 0) {
          const errorMessages = failed
            .map((f) =>
              f.status === "rejected"
                ? f.reason?.message || "Unknown error"
                : (f as any).value?.error || "Failed to load PDF",
            )
            .join("; ");

          throw new Error(
            `Failed to load ${failed.length} PDF(s): ${errorMessages}`,
          );
        }

        // Merge PDFs with progress tracking
        let mergedPageCount = 0;
        for (const p of ordered) {
          const bytes = pdfBytesCache.current.get(p);
          if (!bytes) continue;

          try {
            const src = await PDFDocument.load(bytes, {
              ignoreEncryption: true,
              throwOnInvalidObject: true,
            });

            const pageIndices = src.getPageIndices();
            if (pageIndices.length === 0) {
              console.warn(`PDF has no pages: ${p}`);
              continue;
            }

            const copiedPages = await mergedPdf.copyPages(src, pageIndices);
            copiedPages.forEach((page) => mergedPdf.addPage(page));
            mergedPageCount += copiedPages.length;
          } catch (error) {
            console.error(`Error processing PDF ${p}:`, error);
            throw new Error(
              `Failed to process PDF ${p.split("/").pop() || "unknown"}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            );
          }
        }

        if (mergedPageCount === 0) {
          throw new Error("No valid pages found in the selected PDFs");
        }

        // Generate the merged PDF
        const mergedBytes = await mergedPdf.save();
        const safeSubjectName = (selectedSubjectName || "subject")
          .replace(/[^\w\s-]/g, "") // Remove special chars
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .substring(0, 50); // Limit length

        const fname = `${safeSubjectName}_${mergedPageCount}_pages_${new Date().toISOString().slice(0, 10)}.pdf`;

        const file = new File([mergedBytes], fname, {
          type: "application/pdf",
          lastModified: Date.now(),
        });

        // Enforce 15MB limit to avoid server rejection
        if (file.size > MAX_SIZE) {
          toast({
            title: "PDF too large",
            description: "Merged chapters exceed 15MB. Select fewer chapters.",
            variant: "destructive",
          });
          onLoadFile(null);
          return;
        }

        onLoadFile(file);
      } catch (err) {
        console.error("PDF merge error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to merge PDFs";
        toast({
          title: "Merge Failed",
          description: errorMessage,
          variant: "destructive",
        });
        onLoadFile(null);
        throw err; // Re-throw to allow callers to handle the error
      } finally {
        setIsMerging(false);
      }
    },
    [chapterOptionsForSubject, entries, onLoadFile, selectedSubjectName],
  );

  const handleToggleAll = useCallback(
    async (checked: boolean) => {
      const next = checked ? allChapterPaths : [];
      setSelectedChapterPaths(next);
      await mergeSelected(next);
    },
    [allChapterPaths, mergeSelected],
  );

  const handleToggleChapter = useCallback(
    async (path: string, checked: boolean) => {
      const set = new Set(selectedChapterPaths);
      if (checked) set.add(path);
      else set.delete(path);
      const next = Array.from(set);
      setSelectedChapterPaths(next);
      await mergeSelected(next);
    },
    [selectedChapterPaths, mergeSelected],
  );

  const buildPaperSchemePrompt = (
    subjectName: string,
    cls: string,
    marks: number,
  ) => {
    // Build a prompt that asks the AI to generate a full exam paper (questions, not just scheme)
    return `Generate a complete exam-style question paper for Class ${cls} in the subject "${subjectName}" of total ${marks} marks.\n\nStructure requirements:\n1) Section A - MCQs: allocate between 10% and 20% of total marks to MCQs. Each MCQ should be 1 mark and include four options labeled a), b), c), d). Number all MCQs sequentially (Q1, Q2, ...).\n2) Section B - Short Questions: allocate between 30% and 40% of total marks. Each short question should be 4 or 5 marks. Number questions sequentially continuing from MCQs.\n3) Section C - Long Questions: allocate between 30% and 40% of total marks. Each long question should be 8 to 10 marks. Number questions sequentially continuing from Section B.\n\nContent and formatting instructions:\n- Provide actual question text for every item (do NOT output only a scheme).\n- For MCQs include clear options (a/b/c/d) and ensure only one correct option logically exists (do NOT reveal answers).\n- Short and long questions should be clear, exam-style (descriptive, conceptual or numerical as appropriate), and require the indicated length of answer.\n- Use headings exactly: "Section A - MCQs", "Section B - Short Questions", "Section C - Long Questions".\n- Use numbering like Q1, Q2, Q3 ... across the paper.\n- Ensure the marks per question and number of questions sum exactly to the total ${marks} marks. If multiple valid distributions exist, choose a balanced distribution that fits the percentage ranges and explain the distribution briefly at the top in one line.\n- Do NOT provide answers or solutions.\n- Keep layout professional and easy to read (use line breaks, headings, and spacing similar to an exam paper).\n\nOutput only the exam paper text (no metadata, no commentary).`;
  };

  function subjectOf(p: string) {
    const m = p.replace(/^\/?datafiles\//, "");
    const parts = m.split("/");
    return parts[1] || "General";
  }

  useEffect(() => {
    const arr = selectedClass ? byClass[selectedClass] || [] : [];
    setSubjectOptions(arr);
    const subs = Array.from(new Set(arr.map((e) => subjectOf(e.path)))).sort();
    setSubjects(subs);
    setSelectedSubjectName("");
    setSelectedSubjectPath("");
    setSelectedChapterPaths([]);
    setTotalMarks(null);
    onLoadFile(null);
  }, [selectedClass]);

  const handleSelectSubject = (name: string) => {
    setSelectedSubjectName(name);
    setSelectedSubjectPath("");
    setSelectedChapterPaths([]);
    onLoadFile(null);
  };

  useEffect(() => {
    (async () => {
      try {
        const toPrefetch = chapterOptionsForSubject.map((c) => c.path);
        await Promise.all(
          toPrefetch.map(async (p) => {
            if (pdfBytesCache.current.has(p)) return;
            const found = entries.find((e) => e.path === p);
            if (!found) return;
            const res = await fetch(found.url);
            const bytes = await res.arrayBuffer();
            pdfBytesCache.current.set(p, bytes);
          }),
        );
      } catch {}
    })();
  }, [chapterOptionsForSubject, entries]);

  const handleSelectChapter = async (path: string) => {
    if (!path) return;
    const found = entries.find((e) => e.path === path);
    if (!found) return;
    try {
      const res = await fetch(found.url);
      const blob = await res.blob();
      const f = new File([blob], found.name, { type: "application/pdf" });
      onLoadFile(f);
      setSelectedSubjectPath(path);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // ignore user/navigation aborts silently
      toast({ title: "Load failed", description: "Could not load PDF." });
    }
  };

  return (
    <ToolLock>
      <div className="rounded-xl card-yellow-shadow border border-muted/20 bg-white p-8 sm:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
          {/* Class */}
          <div
            className={`transition-all duration-200 ease-out ${isLocked ? "opacity-50 pointer-events-none" : ""}`}
          >
            <label className="text-sm font-medium text-muted-foreground">
              Class
            </label>
            <Select
              value={selectedClass}
              onValueChange={(v) => setSelectedClass(v)}
            >
              <SelectTrigger className="w-full" disabled={isLocked}>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div
            className={`transition-all duration-200 ease-out ${!canSelectSubject ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <label className="text-sm font-medium text-muted-foreground">
              Subject
            </label>
            <Select
              key={`subject-${selectedClass || "none"}`}
              value={selectedSubjectName}
              onValueChange={(name) => handleSelectSubject(name)}
            >
              <SelectTrigger className="w-full" disabled={!canSelectSubject}>
                <SelectValue
                  placeholder={
                    selectedClass ? "Select subject" : "Select class first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapters */}
          <div
            className={`transition-all duration-200 ease-out ${!canSelectChapters ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <label className="text-sm font-medium text-muted-foreground">
              Chapters
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between rounded-md border border-primary/60 px-3 py-2 text-base hover:border-primary hover:bg-primary/10 hover:text-black focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  disabled={!canSelectChapters || isMerging}
                >
                  <span className="inline-flex items-center gap-2">
                    <ListChecks className="h-4 w-4 opacity-80" />
                    {isMerging
                      ? "Merging..."
                      : selectedCount === 0
                        ? selectedSubjectName
                          ? "Select chapters"
                          : "Select subject first"
                        : isAllSelected
                          ? `All chapters selected (${selectedCount})`
                          : `${selectedCount} chapter${selectedCount > 1 ? "s" : ""} selected`}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 border border-input bg-white text-foreground shadow-xl">
                <DropdownMenuLabel className="flex items-center justify-between text-sm text-primary">
                  <span>Chapters</span>
                  <span className="text-xs">
                    {selectedCount}/{allChapterPaths.length} selected
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={isAllSelected}
                  onCheckedChange={(c) => handleToggleAll(Boolean(c))}
                  className="font-semibold hover:bg-primary/10 hover:text-black focus:bg-primary/20 focus:text-black"
                >
                  All chapters
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <div className="max-h-60 overflow-y-auto scrollbar-yellow pr-1">
                  <div className="py-1">
                    {chapterOptionsForSubject.map((s) => (
                      <DropdownMenuCheckboxItem
                        key={s.path}
                        checked={selectedChapterPaths.includes(s.path)}
                        onCheckedChange={(c) =>
                          handleToggleChapter(s.path, Boolean(c))
                        }
                        className="hover:bg-secondary/15 hover:text-black focus:bg-secondary/20 focus:text-black"
                      >
                        {s.name.replace(/\.pdf$/i, "")}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Marks */}
          <div
            className={`transition-all duration-200 ease-out ${!canEnterMarks ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <label className="text-sm font-medium text-muted-foreground">
              Total Marks
            </label>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="number"
                min={20}
                max={100}
                value={totalMarks ?? ""}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  const n = v === "" ? null : Number(v);
                  setTotalMarks(n);
                }}
                disabled={!canEnterMarks || !!loading || isMerging}
                className="w-28 rounded-md border border-input bg-muted/40 px-3 py-2 text-base hover:border-primary focus:border-primary focus:ring-0"
                placeholder="Enter marks"
              />
              <button
                type="button"
                onClick={() => setTotalMarks(30)}
                disabled={!canEnterMarks || !!loading || isMerging}
                aria-pressed={totalMarks === 30}
                className={`rounded-md px-4 py-2 text-base border ${totalMarks === 30 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
              >
                30
              </button>
              <button
                type="button"
                onClick={() => setTotalMarks(50)}
                disabled={!canEnterMarks || !!loading || isMerging}
                aria-pressed={totalMarks === 50}
                className={`rounded-md px-4 py-2 text-base border ${totalMarks === 50 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
              >
                50
              </button>
              <button
                type="button"
                onClick={() => setTotalMarks(100)}
                disabled={!canEnterMarks || !!loading || isMerging}
                aria-pressed={totalMarks === 100}
                className={`rounded-md px-4 py-2 text-base border ${totalMarks === 100 ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground/90 border-input hover:bg-muted/50"}`}
              >
                100
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <Button
            disabled={!canGenerate}
            onClick={async () => {
              if (!selectedClass) {
                return toast({
                  title: "Select class",
                  description: "Please select a class first.",
                });
              }
              if (!selectedSubjectName) {
                return toast({
                  title: "Select subject",
                  description: "Please select a subject.",
                });
              }
              if (selectedChapterPaths.length === 0) {
                return toast({
                  title: "Select chapters",
                  description: "Please choose one or more chapters.",
                });
              }
              if (totalMarks == null) {
                return toast({
                  title: "Enter total marks",
                  description: "Please enter a value between 20 and 100.",
                });
              }
              const subjectName = selectedSubjectName || "";
              const marks = Math.min(100, Math.max(20, Number(totalMarks)));
              if (marks !== totalMarks) setTotalMarks(marks);
              const generated = buildPaperSchemePrompt(
                subjectName,
                selectedClass || "",
                marks,
              );
              const shortTitle = `${selectedClass ? selectedClass + " • " : ""}${subjectName || "Exam"} — Exam`;
              onResultTitle?.(shortTitle.slice(0, 80));
              onSetPrompt(generated);
              setIsLocked(true);
              try {
                await onGenerate(generated);
              } finally {
                setIsLocked(false);
              }
            }}
            className="relative flex items-center gap-3 !shadow-none hover:!shadow-none"
          >
            {loading ? (
              <>
                <span className="opacity-0">Generating...</span>
                <div className="loader">
                  <div className="jimu-primary-loading"></div>
                </div>
              </>
            ) : (
              "Generate"
            )}
          </Button>

          <Button
            className="bg-primary/10 border-primary/60 text-blue-600 hover:!bg-primary/10 hover:!border-primary/60 hover:!text-blue-600 hover:!shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!canReset || loading || isLocked}
            onClick={() => {
              setSelectedClass("");
              setSelectedSubjectPath("");
              setSelectedChapterPaths([]);
              setTotalMarks(null);
              setPromptText("");
              setIsLocked(false);
              onLoadFile(null);
              onSetPrompt("");
              onReset();
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </ToolLock>
  );
}

export default function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [latestTitle, setLatestTitle] = useState<string>("");
  const lastSavedRef = useRef<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!result) return;
    if (lastSavedRef.current === result) return;
    lastSavedRef.current = result;
    (async () => {
      try {
        const [{ saveUserResult }, { getInstitute }] = await Promise.all([
          import("@/lib/results"),
          import("@/lib/account"),
        ]);
        const inst = getInstitute();
        const fallbackTitle = (query || "Exam Paper").trim();
        const title = (latestTitle || fallbackTitle || "Exam Paper").slice(
          0,
          80,
        );
        void saveUserResult({
          examType: "exam",
          title,
          resultData: result,
          downloadUrl: null,
          score: null,
          instituteName: inst?.name,
          instituteLogo: inst?.logo,
        });
      } catch {}
    })();
  }, [result, query, latestTitle]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const s = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(s);
        if (s.defaultQuery) setQuery(s.defaultQuery);
      }
    } catch {}
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const handleFile = (f: File) => {
    if (
      f.type !== "application/pdf" &&
      !f.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a valid PDF file.");
      setFile(null);
      toast({
        title: "Invalid file",
        description: "Only PDF files are supported.",
      });
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("PDF exceeds 15MB limit.");
      setFile(null);
      toast({
        title: "File too large",
        description: "Please upload a PDF up to 15MB.",
      });
      return;
    }
    setError(null);
    setFile(f);
  };

  const onReset = () => {
    setFile(null);
    setQuery("");
    setError(null);
    setResult(null);
    setLatestTitle("");
    const el = fileInputRef.current;
    if (el) el.value = "";
  };

  // Utility: promise timeout without aborting the underlying fetch
  const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
    return await new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error("timeout")), ms);
      p.then((v) => {
        clearTimeout(id);
        resolve(v);
      }).catch((e) => {
        clearTimeout(id);
        reject(e);
      });
    });
  };

  const runSubmit = async (fArg?: File | null, qArg?: string) => {
    setError(null);
    setResult(null);
    const theFile = fArg ?? file;
    const q = (qArg ?? query).trim();
    if (!theFile) {
      setError("Attach a PDF file first.");
      toast({ title: "Missing PDF", description: "Attach a PDF to continue." });
      return;
    }
    if (!q) {
      setError("Enter a query.");
      toast({ title: "Missing query", description: "Write what to generate." });
      return;
    }

    // Compute a stable cache key based on the file content and query
    const [{ makeKey, getCached, setCached, getLatest, setLatest }] =
      await Promise.all([import("@/lib/cache")]);
    const buffer = await theFile.arrayBuffer();
    const hashBuf = await crypto.subtle.digest("SHA-256", buffer);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    const fileHash = hashArr
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const cacheKey = makeKey(["v1", "exam", fileHash, q]);
    const cached = getCached(cacheKey);

    if (cached) {
      setResult(cached);
      setLoading(false);
      // background refresh
      void (async () => {
        const form = new FormData();
        form.append("pdf", theFile);
        form.append("query", q);
        try {
          const res = await withTimeout(
            fetch("/api/proxy", {
              method: "POST",
              body: form,
              headers: { Accept: "application/json" },
            }),
            10000,
          );
          if (res && res.ok) {
            const ct = res.headers.get("content-type") || "";
            const txt = ct.includes("application/json")
              ? String(
                  (await res.json().catch(async () => await res.text())) ?? "",
                )
              : await res.text();
            setResult(txt);
            setCached(cacheKey, txt);
            setLatest("exam", txt, "anon");
          }
        } catch {}
      })();
      return;
    }

    // No exact cache → show latest per-type if available
    const latest = getLatest("exam", "anon");
    if (latest) setResult(latest);

    const form = new FormData();
    form.append("pdf", theFile);
    form.append("query", q);

    try {
      setLoading(true);

      const attempt = await withTimeout(
        fetch("/api/proxy", {
          method: "POST",
          body: form,
          headers: { Accept: "application/json" },
        }),
        15000,
      ).catch(() => null as any);

      if (!attempt) {
        return; // keep showing latest if present
      }
      if (!attempt.ok) {
        return;
      }

      const contentType = attempt.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const json = await attempt
            .json()
            .catch(async () => await attempt.text());
          const text =
            typeof json === "string"
              ? json
              : (json?.questions ??
                json?.result ??
                json?.message ??
                JSON.stringify(json, null, 2));
          const out = String(text);
          setResult(out);
          setCached(cacheKey, out);
          setLatest("exam", out, "anon");
        } catch (e) {
          const txt = await attempt
            .clone()
            .text()
            .catch(() => "");
          setResult(txt);
          setCached(cacheKey, txt);
          setLatest("exam", txt, "anon");
        }
      } else {
        const text = await attempt.clone().text();
        setResult(text);
        setCached(cacheKey, text);
        setLatest("exam", text, "anon");
      }
    } catch (err: any) {
      const msg =
        err?.message === "timeout"
          ? "Request timed out. Please try again."
          : err?.message || "Request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!result) return;
    if (lastSavedRef.current === result) return;
    lastSavedRef.current = result;
    (async () => {
      try {
        const { saveResult } = await import("@/lib/results");
        await saveResult({ examType: "exam", content: result });
      } catch {}
    })();
  }, [result]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) await runSubmit();
  };

  // Helper: escape HTML to avoid XSS
  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Enhanced formatter: renumber per section, convert **bold** to <strong>, style headings, questions and options
  const formatResultHtml = (txt: string) => {
    if (!txt) return "";

    // 1) Renumber questions per section: reset to Q1 at each "Section ..." heading
    const renumbered = (() => {
      const lines = txt.split(/\r?\n/);
      let count = 0;
      let inSection = false;
      const out: string[] = [];
      const headingRe = /^\s*Section\s+[A-Z0-9\-–].*$/i;
      const qRe = /^(\s*)Q\d+\.\s*/i;
      for (const line of lines) {
        if (headingRe.test(line)) {
          inSection = true;
          count = 0;
          out.push(line);
          continue;
        }
        if (inSection && qRe.test(line)) {
          count += 1;
          out.push(line.replace(qRe, `$1Q${count}. `));
        } else {
          out.push(line);
        }
      }
      return out.join("\n");
    })();

    // 2) Escape HTML to avoid XSS
    let out = escapeHtml(renumbered);

    // 3) Convert bold **text**
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // 4) Headings: lines starting with Section or Section A/B/C -> styled h3 in theme color
    out = out.replace(
      /^\s*(Section\s+[A-Z0-9\-���].*)$/gim,
      '<h3 class="text-xl font-extrabold text-secondary mb-3">$1</h3>',
    );

    // 5) Question lines 'Q1.' -> larger bold line
    out = out.replace(
      /^\s*(Q\d+\.)\s*(.*)$/gim,
      '<p class="text-lg font-semibold mb-3"><strong>$1</strong> $2</p>',
    );

    // 6) MCQ options like 'a) text'
    out = out.replace(
      /^\s*([a-d])\)\s*(.*)$/gim,
      '<div class="ml-6 mb-2 text-base"><strong class="mr-2">$1)</strong>$2</div>',
    );

    // 7) Paragraph spacing
    out = out.replace(/\n{2,}/g, '</p><p class="mb-4">');
    out = out.replace(/\n/g, "<br />");

    if (!out.startsWith("<h3>") && !out.startsWith("<p>")) {
      out = `<p class=\"mb-4\">${out}</p>`;
    }

    return out;
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />
            </div>
          </aside>
          <div>
            <section className="relative overflow-hidden rounded-2xl px-6 pt-0 pb-12 sm:pt-0 sm:pb-14 mt-4">
              <div className="absolute inset-0 bg-background -z-10" />
              <div className="relative mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl text-primary">
                  Exam Generator
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Fast, accurate question generation tailored to your query.
                </p>
              </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl space-y-6">
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-black">
                    {error}
                  </div>
                )}

                {/* External controls: Class -> Subject -> Prompt */}
                <div className="w-full max-w-4xl mx-auto order-2">
                  <ExternalPdfSelector
                    onLoadFile={(f) => setFile(f)}
                    onSetPrompt={(p) => setQuery(p)}
                    onGenerate={async (p?: string) =>
                      await runSubmit(undefined, p)
                    }
                    onReset={onReset}
                    loading={loading}
                    onResultTitle={(title) => setLatestTitle(title)}
                  />
                </div>

                {result && (
                  <div className="order-3 mt-0 w-full max-w-4xl mx-auto">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Result</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          aria-label="Download PDF"
                          variant="secondary"
                          size="icon"
                          disabled={!result || !!loading}
                          onClick={async () => {
                            if (!result) return;
                            try {
                              const { generateExamStylePdf } = await import(
                                "@/lib/pdf"
                              );
                              const { getInstitute } = await import(
                                "@/lib/account"
                              );
                              const inst = getInstitute();

                              function makeFilenameFromPrompt(
                                q: string | undefined,
                              ) {
                                const raw = (q || "").trim();
                                if (!raw) return "exam-paper";
                                const verbs = [
                                  "make",
                                  "generate",
                                  "produce",
                                  "create",
                                  "give",
                                  "write",
                                  "please",
                                  "build",
                                  "compose",
                                  "form",
                                ];
                                let s = raw;
                                let changed = true;
                                while (changed) {
                                  changed = false;
                                  for (const v of verbs) {
                                    const re = new RegExp(
                                      "^" + v + "\\s+",
                                      "i",
                                    );
                                    if (re.test(s)) {
                                      s = s.replace(re, "").trim();
                                      changed = true;
                                    }
                                  }
                                }
                                s = s.replace(/^['"]+|['"]+$/g, "").trim();
                                let out = s.slice(0, 60).toLowerCase();
                                out = out.replace(/[^a-z0-9\s_-]/g, "");
                                out = out.trim().replace(/\s+/g, "_");
                                return out || "exam-paper";
                              }

                              const safeQuery = makeFilenameFromPrompt(query);
                              await generateExamStylePdf({
                                title: "Exam",
                                body: result,
                                filenameBase: safeQuery,
                                instituteHeader: {
                                  instituteName: inst?.name,
                                  instituteLogo: inst?.logo,
                                },
                              });
                            } catch (err) {
                              console.error(err);
                              toast({
                                title: "Download failed",
                                description: "Could not generate PDF.",
                              });
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-card/60 p-8 text-base overflow-hidden">
                      <div className="paper-view">
                        <div
                          className="paper-body prose prose-invert prose-lg leading-relaxed max-w-none break-words"
                          dangerouslySetInnerHTML={{
                            __html: formatResultHtml(result || ""),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
