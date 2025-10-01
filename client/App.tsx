import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import React, { useEffect, useState } from "react";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

import Index from "./pages/Index";
import GetStarted from "./pages/GetStarted";
import MCQs from "./pages/MCQs";
import QnA from "./pages/QnA";
import Syllabus from "./pages/Syllabus";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Onboarding from "./pages/Onboarding";
import Results from "./pages/Results";
import ResultDetail from "./pages/ResultDetail";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ProfileLockProvider } from "@/hooks/useProfileLock";

const queryClient = new QueryClient();

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh] bg-background">{children}</div>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const current = auth.currentUser;
  if (!current) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireProfileCompleted({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isLogin = location.pathname === "/login";
  if (isLanding) {
    return (
      <Routes location={location}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <Landing />
            </PageWrapper>
          }
        />
        <Route
          path="*"
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          }
        />
      </Routes>
    );
  }

  return (
    <ProfileLockProvider>
      <AppLayout>
        <Routes location={location}>
          <Route
            path="/login"
            element={
              <PageWrapper>
                <Login />
              </PageWrapper>
            }
          />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <Index />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/get-started"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <GetStarted />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/mcqs"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <MCQs />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/qna"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <QnA />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/syllabus"
            element={
              <PageWrapper>
                <Syllabus />
              </PageWrapper>
            }
          />
          <Route
            path="/subscription"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <Subscription />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <PageWrapper>
                  <Profile />
                </PageWrapper>
              </RequireAuth>
            }
          />
          <Route
            path="/my-profile"
            element={
              <RequireAuth>
                <PageWrapper>
                  <Profile />
                </PageWrapper>
              </RequireAuth>
            }
          />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <Onboarding />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/support"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <Support />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/results"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <Results />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/results/:type"
            element={
              <RequireAuth>
                <RequireProfileCompleted>
                  <PageWrapper>
                    <ResultDetail />
                  </PageWrapper>
                </RequireProfileCompleted>
              </RequireAuth>
            }
          />
          <Route
            path="/pricing"
            element={<Navigate to="/#pricing" replace />}
          />
          <Route
            path="*"
            element={
              <PageWrapper>
                <NotFound />
              </PageWrapper>
            }
          />
        </Routes>
      </AppLayout>
    </ProfileLockProvider>
  );
}

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <ScrollToTopOnRouteChange />
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
