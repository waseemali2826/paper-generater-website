import React from "react";
import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfileLock } from "@/hooks/useProfileLock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToolLock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { locked } = useProfileLock();

  return (
    <div className={cn("relative", className)}>
      {locked && (
        <div className="mb-3 rounded-2xl border border-[#f4d87b] bg-[#fff7dc] px-4 sm:px-5 py-2.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-[#8a6d1a]">
              Please complete your profile before using this tool.
            </p>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-md bg-[#2563eb] px-4 text-white transition hover:bg-[#1d4ed8]"
            >
              <Link to="/my-profile">Go to Profile</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="relative">
        <div
          className={cn(
            locked
              ? "pointer-events-none select-none filter blur-[1px]"
              : undefined,
          )}
        >
          {children}
        </div>
        {locked && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/50 backdrop-blur-[1px]">
            <Lock className="h-7 w-7 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ToolLock;
