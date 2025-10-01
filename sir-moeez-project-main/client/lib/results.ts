import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export type ExamTypeSlug = "mcqs" | "qna" | "exam";

export const examTypeLabels: Record<ExamTypeSlug, string> = {
  mcqs: "MCQ Generator",
  qna: "Questions Generator",
  exam: "Exam Generator",
};

export const storedExamTypeLabel: Record<ExamTypeSlug, string> = {
  mcqs: "MCQ",
  qna: "QnA",
  exam: "Full Exam",
};

export type ResultDoc = {
  id: string;
  examType: ExamTypeSlug;
  title?: string;
  content: string;
  createdAt?: Timestamp | null;
  generatedDateTime?: number;
  downloadUrl?: string | null;
  score?: number | null;
  instituteName?: string;
  instituteLogo?: string;
};

function getUserId() {
  const u = auth.currentUser;
  return u?.uid || u?.email || null;
}

function resultsColRef() {
  const uid = getUserId();
  if (!uid) throw new Error("Not authenticated");
  return collection(db, "users", uid, "results");
}

export async function saveUserResult(params: {
  examType: ExamTypeSlug;
  title?: string;
  resultData: string;
  downloadUrl?: string | null;
  score?: number | null;
  instituteName?: string;
  instituteLogo?: string;
}): Promise<string | null> {
  const uid = getUserId();
  if (!uid) return null;
  const payload: any = {
    examType: storedExamTypeLabel[params.examType],
    examTypeSlug: params.examType,
    title: params.title || "",
    resultData: params.resultData,
    createdAt: serverTimestamp(),
    generatedDateTime: Date.now(),
    downloadUrl: params.downloadUrl ?? null,
    score: typeof params.score === "number" ? params.score : null,
    instituteName: params.instituteName || "",
    instituteLogo: params.instituteLogo || "",
  };
  const ref = await addDoc(resultsColRef(), payload);
  return ref.id;
}

async function fetchOrdered(limitCount?: number) {
  const uid = getUserId();
  if (!uid) return [] as ResultDoc[];
  const q = query(
    resultsColRef(),
    orderBy("createdAt", "desc"),
    ...(limitCount ? [limit(limitCount)] : []),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as any;
    const storedSlug = (data.examTypeSlug as string) || "";
    const inferredSlug: ExamTypeSlug =
      storedSlug === "mcqs" || storedSlug === "qna" || storedSlug === "exam"
        ? storedSlug
        : data.examType === "MCQ"
          ? "mcqs"
          : data.examType === "QnA"
            ? "qna"
            : "exam";
    return {
      id: d.id,
      examType: inferredSlug,
      title: String(data.title || ""),
      content: String(data.resultData ?? data.content ?? ""),
      createdAt: data.createdAt ?? null,
      generatedDateTime: Number(data.generatedDateTime || 0) || undefined,
      downloadUrl:
        typeof data.downloadUrl === "string" ? data.downloadUrl : null,
      score: typeof data.score === "number" ? data.score : null,
      instituteName:
        typeof data.instituteName === "string" ? data.instituteName : undefined,
      instituteLogo:
        typeof data.instituteLogo === "string" ? data.instituteLogo : undefined,
    } as ResultDoc;
  });
}

export async function fetchLastAttemptByType(
  examType: ExamTypeSlug,
): Promise<ResultDoc | null> {
  const all = await fetchOrdered(50);
  for (const r of all) {
    if (r.examType === examType) return r;
  }
  return null;
}

export async function fetchAllResultsByType(
  examType: ExamTypeSlug,
): Promise<ResultDoc[]> {
  const all = await fetchOrdered();
  return all.filter((r) => r.examType === examType);
}
