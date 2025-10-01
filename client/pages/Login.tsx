import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) navigate("/get-started", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHeight = document.body.style.height;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.height = previousHeight;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const em = email.trim();
    const pw = password;
    if (!em || !pw) {
      toast({
        title: "Missing fields",
        description: "Enter email and password.",
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, em, pw);
      toast({ title: "Welcome", description: "Logged in successfully." });
      navigate("/get-started", { replace: true });
    } catch (err: any) {
      const msg = err?.code
        ? String(err.code).replace("auth/", "").replace(/-/g, " ")
        : "Login failed";
      toast({ title: "Login error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-primary/10 to-transparent flex items-start justify-center px-4 pt-20 sm:pt-24">
      <div className="w-full max-w-md space-y-3">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Log in</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Continue with your email and password
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 sm:p-8 card-yellow-shadow">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="bg-white text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-white text-foreground placeholder:text-muted-foreground pr-10"
                />
                <button
                  type="button"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 inline-flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="secondary"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
