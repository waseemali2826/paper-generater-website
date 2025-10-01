import React, { useEffect, useMemo, useState } from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Link } from "react-router-dom";
import { FileText, ListChecks, MessageSquare, Clock } from "lucide-react";
import {
  examTypeLabels,
  fetchLastAttemptByType,
  type ExamTypeSlug as ExamType,
} from "@/lib/results";

function formatWhen(ts?: number): string {
  if (!ts) return "No attempts";
  try {
    // Use user's locale but force 12-hour time with AM/PM
    return new Date(ts).toLocaleString(undefined, {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "No attempts";
  }
}

export default function Results() {
  const [lasts, setLasts] = useState<Record<ExamType, number | undefined>>({
    mcqs: undefined,
    qna: undefined,
    exam: undefined,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [a, b, c] = await Promise.all([
        fetchLastAttemptByType("mcqs"),
        fetchLastAttemptByType("qna"),
        fetchLastAttemptByType("exam"),
      ]);
      if (cancelled) return;
      setLasts({
        mcqs: a?.generatedDateTime || (a?.createdAt as any)?.toMillis?.(),
        qna: b?.generatedDateTime || (b?.createdAt as any)?.toMillis?.(),
        exam: c?.generatedDateTime || (c?.createdAt as any)?.toMillis?.(),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: {
    to: string;
    icon: React.ReactNode;
    label: string;
    type: ExamType;
  }[] = useMemo(
    () => [
      {
        to: "/results/mcqs",
        icon: <ListChecks className="h-7 w-7 sm:h-8 sm:w-8" />,
        label: examTypeLabels.mcqs,
        type: "mcqs",
      },
      {
        to: "/results/qna",
        icon: <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8" />,
        label: examTypeLabels.qna,
        type: "qna",
      },
      {
        to: "/results/exam",
        icon: <FileText className="h-7 w-7 sm:h-8 sm:w-8" />,
        label: examTypeLabels.exam,
        type: "exam",
      },
    ],
    [],
  );

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
                  Result History
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  View your latest attempts for each exam tool.
                </p>
              </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
                {cards.map((c) => (
                  <Link
                    key={c.type}
                    to={c.to}
                    className="group w-full h-full rounded-xl border bg-white p-3.5 sm:p-4 card-yellow-shadow hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/60 transition shadow-sm"
                  >
                    <div className="flex flex-col items-center text-center h-full">
                      <div className="rounded-full bg-primary/10 p-2.5 sm:p-3 mb-2 text-primary group-hover:bg-primary/15">
                        {c.icon}
                      </div>
                      <div className="text-base font-semibold">{c.label}</div>
                      <div className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatWhen(lasts[c.type])}</span>
                      </div>
                      <div className="mt-auto pt-3 text-xs text-primary font-medium">
                        View Results →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
