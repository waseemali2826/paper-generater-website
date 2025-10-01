import * as React from "react";
import Header from "@/components/layout/Header";
import Container from "@/components/layout/Container";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Pricing from "./Pricing";
import Footer from "@/components/layout/Footer";

export default function Landing() {
  const navigate = useNavigate();
  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("pricing");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // update hash without jumping
      history.replaceState(null, "", "#pricing");
    } else {
      // fallback: navigate to pricing section on landing
      navigate("/#pricing");
    }
  };

  // Shared duration for all counters so they finish together and faster
  const sharedDuration = 1200; // milliseconds

  const CountUp = ({
    end,
    duration = sharedDuration,
    format,
  }: {
    end: number;
    duration?: number;
    format?: "comma" | "percent";
  }) => {
    const [value, setValue] = React.useState(0);
    React.useEffect(() => {
      let raf = 0;
      const start = performance.now();
      const from = 0;
      const to = end;
      // easeOutCubic for a snappier finish
      const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
      const step = (now: number) => {
        const elapsed = now - start;
        const tRaw = Math.min(1, elapsed / duration);
        const t = easeOutCubic(tRaw);
        const current = Math.floor(from + (to - from) * t);
        setValue(current);
        if (tRaw < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }, [end, duration]);

    if (format === "percent") return <>{value}%</>;
    // default: comma formatting with + suffix
    return <>{value.toLocaleString()}+</>;
  };

  return (
    <div className="min-h-svh flex flex-col">
      <Header />

      <main className="flex-1">
        <section id="home" className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-40 bg-gradient-to-b from-primary/10 to-transparent" />
          </div>
          <Container className="py-16 md:py-24 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
              Generate <span className="text-primary">Smart Test Papers</span>{" "}
              Effortlessly
            </h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload chapters, set marks, and create professional test papers in
              seconds. Simple, fast, and built for teachers and institutes.
            </p>

            <div className="mt-5 flex items-end justify-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums h-9 sm:h-10 flex items-center justify-center whitespace-nowrap">
                  <CountUp end={1200} format="comma" />
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Teachers using PaperGen
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums h-9 sm:h-10 flex items-center justify-center whitespace-nowrap">
                  <CountUp end={35000} format="comma" />
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Papers generated
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums h-9 sm:h-10 flex items-center justify-center whitespace-nowrap">
                  <CountUp end={99} format="percent" />
                </div>
                <div className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Satisfaction rating
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/login">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-primary/10 border-primary/60"
              >
                <a href="#pricing" onClick={scrollToPricing}>
                  View pricing
                </a>
              </Button>
            </div>
          </Container>
        </section>

        <section>
          <Container className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-white border border-input px-6 py-6 card-yellow-shadow text-left">
                <div className="text-xl font-semibold mb-1">Fast</div>
                <p className="text-sm text-muted-foreground">
                  Create papers in a few clicks with clean, readable layouts.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-input px-6 py-6 card-yellow-shadow text-left">
                <div className="text-xl font-semibold mb-1">Accurate</div>
                <p className="text-sm text-muted-foreground">
                  Select chapters precisely and balance total marks with
                  presets.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-input px-6 py-6 card-yellow-shadow text-left">
                <div className="text-xl font-semibold mb-1">Ready to share</div>
                <p className="text-sm text-muted-foreground">
                  Export polished PDFs for printing or digital distribution.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section>
          <Container className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[51%]">
                <div className="col-span-2 row-span-1 rounded-lg overflow-hidden bg-white card-yellow-shadow">
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+8n1EAAAAASUVORK5CYII="
                    alt="PaperGen wide"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-1 row-span-2 rounded-lg overflow-hidden bg-white card-yellow-shadow">
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+8n1EAAAAASUVORK5CYII="
                    alt="PaperGen tall"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-white card-yellow-shadow">
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+8n1EAAAAASUVORK5CYII="
                    alt="PaperGen square 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="col-span-1 row-span-1 rounded-lg overflow-hidden bg-white card-yellow-shadow">
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+8n1EAAAAASUVORK5CYII="
                    alt="PaperGen square 2"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  Discover how we can help you to evaluate students superfast.
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  ExamGen is a complete assessment and learning management
                  solution that helps schools and coaching institutes create
                  question papers and conduct exams online in minutes.
                </p>

                <ul className="mt-6 space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>
                      Zero typing effort. We have 7,00,000+ questions.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>
                      Works perfectly on mobile devices as well as PC.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>Creating a paper hardly takes a few minutes.</span>
                  </li>
                </ul>
              </div>
            </div>
          </Container>
        </section>

        <section id="how-it-works">
          <Container className="py-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                How it works
              </h2>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Generate high-quality test papers in three simple steps — upload
                syllabus or chapters, customize marks and question types, then
                export or share with your students.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border bg-white px-6 py-6 text-left card-yellow-shadow">
                <div className="text-xl font-semibold">1. Upload syllabus</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload PDFs or select chapters from our library. PaperGen
                  parses the content and extracts topics automatically.
                </p>
              </div>
              <div className="rounded-lg border bg-white px-6 py-6 text-left card-yellow-shadow">
                <div className="text-xl font-semibold">2. Customize</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose question types (MCQ, short answer), total marks, and
                  difficulty distribution. Save these as templates for repeat
                  use.
                </p>
              </div>
              <div className="rounded-lg border bg-white px-6 py-6 text-left card-yellow-shadow">
                <div className="text-xl font-semibold">
                  3. Generate &amp; export
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  One click generation produces printable PDF papers with answer
                  keys. Share via link or download for offline printing.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section>
          <Container className="py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold">
                  Templates &amp; customization
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Use professionally designed templates or build your own.
                  Control layout, fonts, instructions, and marking schemes to
                  match your institution's standards.
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>
                      Ready-to-use exam templates (objective, subjective, mixed)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>Custom header and school branding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-primary">•</span>
                    <span>Difficulty and topic weighting controls</span>
                  </li>
                </ul>
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/app">Explore templates</Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-white px-6 py-6 card-yellow-shadow">
                <div className="text-sm text-muted-foreground">
                  Example template preview — All templates are fully editable
                  and export-ready. Use the template editor to tweak layout and
                  marks.
                </div>
              </div>
            </div>
          </Container>
        </section>

        <div id="pricing" />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}
