import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { examTypeLabels, type ExamTypeSlug as ExamType } from "@/lib/results";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft, Trash2 } from "lucide-react";
import { generateExamStylePdf } from "@/lib/pdf";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

function useInstituteHeader() {
  const [inst, setInst] = useState<{
    instituteName?: string;
    instituteLogo?: string;
  } | null>(null);
  useEffect(() => {
    const u = auth.currentUser;
    if (!u?.uid) return;
    const ref = doc(db, "users", u.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as any | undefined;
      if (!d) {
        setInst(null);
        return;
      }
      setInst({
        instituteName: String(d.instituteName || d.name || ""),
        instituteLogo:
          typeof d.instituteLogo === "string" ? d.instituteLogo : undefined,
      });
    });
    return () => unsub();
  }, []);
  return inst ?? {};
}

export default function ResultDetail() {
  const params = useParams();
  const type = (params.type as ExamType) || "mcqs";
  const label = examTypeLabels[type] || "Results";
  const [items, setItems] = useState<
    Array<{
      id: string;
      title?: string;
      content: string;
      ts: number;
      downloadUrl?: string | null;
    }>
  >([]);
  const header = useInstituteHeader();

  useEffect(() => {
    const u = auth.currentUser;
    if (!u?.uid) {
      setItems([]);
      return;
    }
    const col = collection(db, "users", u.uid, "results");
    const qy = query(col, where("examTypeSlug", "==", type));
    const unsub = onSnapshot(qy, (snap) => {
      const next = snap.docs
        .map((d) => {
          const data = d.data() as any;
          const ts =
            (data.createdAt as any)?.toMillis?.() ||
            Number(data.generatedDateTime || 0) ||
            0;
          return {
            id: d.id,
            title: String(data.title || ""),
            content: String(data.resultData ?? data.content ?? ""),
            ts,
            downloadUrl:
              typeof data.downloadUrl === "string" ? data.downloadUrl : null,
          };
        })
        .sort((a, b) => b.ts - a.ts);
      setItems(next);
    });
    return () => unsub();
  }, [type]);

  const handleDownload = async (content: string) => {
    await generateExamStylePdf({
      title: label,
      body: content,
      filenameBase: label.toLowerCase().replace(/\s+/g, "_"),
      instituteHeader: header,
    });
  };

  const handleDelete = async (id: string) => {
    const u = auth.currentUser;
    if (!u?.uid) return;
    try {
      await deleteDoc(doc(db, "users", u.uid, "results", id));
      toast({ title: "Deleted", description: "Result removed." });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message || "Could not delete result.",
        variant: "destructive",
      });
    }
  };

  const deleteMany = async (ids: string[]) => {
    if (!ids.length) return;
    const u = auth.currentUser;
    if (!u?.uid) return;
    const batch = writeBatch(db);
    ids.forEach((rid) => batch.delete(doc(db, "users", u.uid, "results", rid)));
    await batch.commit();
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
                  {label} — Results
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your generated results for {label} with download options.
                </p>
                <div className="mt-4">
                  <Link
                    to="/results"
                    className="inline-flex items-center text-sm text-primary"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Result
                    History
                  </Link>
                </div>
              </div>
            </section>

            <section className="mx-auto mt-8 max-w-5xl space-y-3">
              {items.length === 0 && (
                <div className="rounded-xl bg-white border border-input p-6 text-center text-sm text-muted-foreground">
                  No results yet.
                </div>
              )}
              {items.map((it) => {
                const formatDate = (ts?: number) => {
                  if (!ts) return "";
                  try {
                    return new Date(ts).toLocaleString(undefined, {
                      hour12: true,
                      hour: "numeric",
                      minute: "2-digit",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                  } catch {
                    return new Date(ts).toLocaleString();
                  }
                };
                const date = formatDate(it.ts);
                const title =
                  it.title && it.title.trim().length > 0
                    ? it.title
                    : `${label}`;
                return (
                  <div
                    key={it.id}
                    className="rounded-xl bg-white border border-input p-4 sm:p-5 card-yellow-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-extrabold truncate">
                          {title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleDownload(it.content)}
                          className="inline-flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" /> Download PDF
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(it.id)}
                          className="inline-flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
