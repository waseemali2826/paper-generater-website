import * as React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import MultiStepForm from "@/components/forms/MultiStepForm";

export default function Onboarding() {
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
                  Welcome
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Complete your details to get started.
                </p>
              </div>
            </section>

            <div className="mx-auto mt-6 max-w-5xl">
              <MultiStepForm className="bg-white/70" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
