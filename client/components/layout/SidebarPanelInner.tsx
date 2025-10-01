import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  FileText,
  ListChecks,
  MessageSquare,
  User,
  LifeBuoy,
  BookOpen,
  History,
} from "lucide-react";

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm ${
        active
          ? "bg-primary text-primary-foreground hover:text-primary-foreground"
          : "transition-colors hover:bg-primary/10"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function SidebarPanelInner() {
  const { pathname } = useLocation();
  return (
    <>
      <div className="mb-3 px-1 text-xs font-semibold text-muted-foreground">
        Navigation
      </div>
      <nav className="flex flex-col gap-1">
        <NavItem
          to="/get-started"
          icon={LayoutGrid}
          label="Dashboard"
          active={pathname === "/get-started"}
        />

        <div className="mt-3 mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          Exams
        </div>
        <NavItem
          to="/mcqs"
          icon={ListChecks}
          label="Generate MCQs"
          active={pathname === "/mcqs"}
        />
        <NavItem
          to="/qna"
          icon={MessageSquare}
          label="Generate Q&A"
          active={pathname === "/qna"}
        />
        <NavItem
          to="/app"
          icon={FileText}
          label="Generate Exam"
          active={pathname === "/app"}
        />
        <NavItem
          to="/syllabus"
          icon={BookOpen}
          label="Syllabus"
          active={pathname === "/syllabus"}
        />
        <NavItem
          to="/results"
          icon={History}
          label="Result History"
          active={pathname.startsWith("/results")}
        />

        <div className="mt-3 mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          My account
        </div>
        <NavItem
          to="/subscription"
          icon={LayoutGrid}
          label="Manage Subscription"
          active={pathname === "/subscription"}
        />
        <NavItem
          to="/profile"
          icon={User}
          label="My Profile"
          active={pathname === "/profile"}
        />
        <NavItem
          to="/support"
          icon={LifeBuoy}
          label="Support"
          active={pathname === "/support"}
        />
      </nav>
    </>
  );
}
