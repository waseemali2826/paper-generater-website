import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const goHome = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    // if already on home, scroll to top
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
      // after navigation, scroll to top (delay to allow mount)
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
    }
    setOpen(false);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-input">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-black"
        >
          <span className="inline-flex h-8 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            PG
          </span>
          <span>PaperGen</span>
        </Link>

        <nav className="hidden md:flex items-center gap-3">
          <a
            href="#home"
            onClick={goHome}
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
          >
            Home
          </a>
          <a
            href="#pricing"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
          >
            FAQ
          </a>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-primary/10"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={`transition-transform duration-300 ${open ? "rotate-90 scale-95" : ""}`}
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden bg-white border-t border-input overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${open ? "max-h-96 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-3">
          <a
            href="#home"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
            onClick={(e) => {
              goHome(e);
              setOpen(false);
            }}
          >
            Home
          </a>
          <a
            href="#pricing"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
            onClick={() => setOpen(false)}
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="px-3 py-2 rounded-md hover:bg-primary/10 text-black"
            onClick={() => setOpen(false)}
          >
            FAQ
          </a>
          <div className="pt-2">
            <Button asChild>
              <Link to="/login" onClick={() => setOpen(false)}>
                Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
