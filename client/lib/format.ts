// Shared formatter to render exam-style results consistently across tools
export function formatResultHtml(txt: string) {
  if (!txt) return "";

  const escapeHtml = (unsafe: string) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // 1) Renumber questions per section: reset to Q1 at each "Section ..." heading
  const renumbered = (() => {
    const lines = txt.split(/\r?\n/);
    let count = 0;
    let inSection = false;
    const out: string[] = [];
    const headingRe = /^\s*Section\s+[A-Z0-9\-–].*$/i;
    const qRe = /^(\s*)Q\d+\.\s*/i;
    for (const line of lines) {
      if (headingRe.test(line)) {
        inSection = true;
        count = 0;
        out.push(line);
        continue;
      }
      if (inSection && qRe.test(line)) {
        count += 1;
        out.push(line.replace(qRe, `$1Q${count}. `));
      } else {
        out.push(line);
      }
    }
    return out.join("\n");
  })();

  // 2) Escape HTML
  let out = escapeHtml(renumbered);

  // 3) Convert **bold** to <strong>
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 4) Headings -> styled h3
  out = out.replace(
    /^\s*(Section\s+[A-Z0-9\-–].*)$/gim,
    '<h3 class="text-xl font-extrabold text-secondary mb-3">$1</h3>',
  );

  // 5) Question lines 'Q1.'
  out = out.replace(
    /^\s*(Q\d+\.)\s*(.*)$/gim,
    '<p class="text-lg font-semibold mb-3"><strong>$1</strong> $2</p>',
  );

  // 6) MCQ options a) b) c) d)
  out = out.replace(
    /^\s*([a-d])\)\s*(.*)$/gim,
    '<div class="ml-6 mb-2 text-base"><strong class="mr-2">$1)</strong>$2</div>',
  );

  // 7) Paragraph spacing
  out = out.replace(/\n{2,}/g, '</p><p class="mb-4">');
  out = out.replace(/\n/g, "<br />");

  if (!out.startsWith("<h3>") && !out.startsWith("<p>")) {
    out = `<p class=\"mb-4\">${out}</p>`;
  }

  return out;
}
