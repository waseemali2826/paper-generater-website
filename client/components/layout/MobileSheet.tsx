import * as React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function MobileSheet() {
  const [open, setOpen] = React.useState(false);
  const path = window.location.pathname;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md border border-input bg-white p-2 card-yellow-shadow"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto scrollbar-none">
        <SheetHeader>
          <SheetTitle>Navigate</SheetTitle>
        </SheetHeader>
        <div className="mt-2 flex flex-col gap-2 p-2">
          <SheetClose asChild>
            <Link
              to="/get-started"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/get-started" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Dashboard
            </Link>
          </SheetClose>

          <div className="mt-2 mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            Exams
          </div>
          <SheetClose asChild>
            <Link
              to="/mcqs"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/mcqs" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Generate MCQs
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              to="/qna"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/qna" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Generate Q&A
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              to="/app"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/app" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Generate Exam
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link
              to="/syllabus"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/syllabus" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Syllabus
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/results"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path.startsWith("/results") ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Result History
            </Link>
          </SheetClose>

          <div className="mt-2 mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
            My account
          </div>
          <SheetClose asChild>
            <Link
              to="/subscription"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/subscription" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Manage Subscription
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/profile" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              My Profile
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/support"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${path === "/support" ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "transition-colors hover:bg-primary/10"}`}
            >
              Support
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
