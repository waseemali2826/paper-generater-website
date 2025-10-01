import { Link } from "react-router-dom";
import Container from "@/components/layout/Container";

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <Container className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link
              to="/"
              className="text-xl font-extrabold tracking-tight text-black pointer-events-none cursor-default select-none"
              aria-disabled="true"
              tabIndex={-1}
            >
              PaperGen
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Simple, fast test paper generation for teachers and institutes.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#home"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  to="/app"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled={true}
                  tabIndex={-1}
                >
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">
              Resources
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#faq"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  FAQ
                </a>
              </li>
              <li>
                <Link
                  to="/app"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled={true}
                  tabIndex={-1}
                >
                  Guides
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-foreground">Company</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#home"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled="true"
                  tabIndex={-1}
                >
                  About
                </a>
              </li>
              <li>
                <Link
                  to="/app"
                  className="text-black pointer-events-none cursor-default select-none"
                  aria-disabled={true}
                  tabIndex={-1}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-input pt-6 text-center text-sm text-muted-foreground">
          <span>© 2025 PaperGen. All rights reserved.</span>
        </div>
      </Container>
    </footer>
  );
}
