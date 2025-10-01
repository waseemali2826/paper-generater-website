import * as React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Download } from "lucide-react";

export default function Syllabus() {
  const pdfModules = import.meta.glob("/datafiles/**/*.pdf", {
    as: "url",
    eager: true,
  }) as Record<string, string>;

  const entries = React.useMemo(
    () =>
      Object.entries(pdfModules).map(([path, url]) => ({
        path,
        url,
        name: path.split("/").pop() || "file.pdf",
      })),
    [pdfModules],
  );

  const byClass = React.useMemo(() => {
    return entries.reduce<
      Record<string, { path: string; url: string; name: string }[]>
    >((acc, cur) => {
      const m = cur.path.replace(/^\/?datafiles\//, "");
      const cls = m.split("/")[0] || "Other";
      if (!acc[cls]) acc[cls] = [];
      acc[cls].push(cur);
      return acc;
    }, {});
  }, [entries]);

  const classes = React.useMemo(() => Object.keys(byClass).sort(), [byClass]);

  const [selectedClass, setSelectedClass] = React.useState<string>("");
  const subjects = React.useMemo(() => {
    if (!selectedClass) return [] as string[];
    const s = new Set<string>();
    for (const e of byClass[selectedClass] || []) {
      const m = e.path.replace(/^\/?datafiles\//, "");
      const sub = (m.split("/")[1] || "General").trim();
      if (sub) s.add(sub);
    }
    return Array.from(s).sort();
  }, [byClass, selectedClass]);

  const [selectedSubject, setSelectedSubject] = React.useState<string>("");

  const chapters = React.useMemo(() => {
    if (!selectedClass || !selectedSubject)
      return [] as { path: string; url: string; name: string }[];
    const arr = (byClass[selectedClass] || []).filter((e) => {
      const m = e.path.replace(/^\/?datafiles\//, "");
      const sub = (m.split("/")[1] || "General").trim();
      return sub === selectedSubject;
    });
    // sort by natural chapter number if present
    return arr
      .map((e) => ({ ...e, name: (e.name || "").replace(/\.pdf$/i, "") }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
  }, [byClass, selectedClass, selectedSubject]);

  const canSelectSubject = !!selectedClass;
  const canSelectChapters = !!selectedSubject;

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
                  Syllabus
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Select class and subject to browse chapters. Click a chapter to view or download.
                </p>
              </div>
            </section>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Class
                </label>
                <Select
                  value={selectedClass}
                  onValueChange={(v) => {
                    setSelectedClass(v);
                    setSelectedSubject("");
                  }}
                >
                  <SelectTrigger className="mt-1" aria-label="Select class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`transition-opacity ${!canSelectSubject ? "opacity-50 pointer-events-none" : "opacity-100"}`}
              >
                <label className="text-sm font-medium text-muted-foreground">
                  Subject
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                  disabled={!canSelectSubject}
                >
                  <SelectTrigger className="mt-1" aria-label="Select subject">
                    <SelectValue
                      placeholder={
                        canSelectSubject
                          ? "Select subject"
                          : "Select class first"
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

              <div
                className={`transition-opacity ${!canSelectChapters ? "opacity-50 pointer-events-none" : "opacity-100"}`}
              >
                <label className="text-sm font-medium text-muted-foreground">
                  Chapters
                </label>
                <div className="mt-1 h-12 rounded-md border border-input bg-white px-3 py-2 flex items-center text-sm">
                  {canSelectChapters
                    ? `${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`
                    : "Select subject first"}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-input bg-white card-yellow-shadow">
              <div className="px-4 py-3 border-b text-sm font-semibold">
                Chapters
              </div>
              <div className="divide-y max-h-[60vh] overflow-y-auto scrollbar-yellow pr-1 pb-4">
                {canSelectChapters && chapters.length > 0 ? (
                  chapters.map((c) => (
                    <div
                      key={c.path}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="text-sm font-medium truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="elevated" size="sm">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${c.name}`}
                          >
                            <Eye /> View
                          </a>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={c.url}
                            download={`${c.name}.pdf`}
                            aria-label={`Download ${c.name}`}
                          >
                            <Download /> Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-10 text-sm text-muted-foreground text-center">
                    {selectedClass
                      ? selectedSubject
                        ? "No chapters found."
                        : "Select a subject to see chapters."
                      : "Select a class to begin."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
