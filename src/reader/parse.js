// Pure PDF-text-to-paragraphs logic, with no pdf.js / worker import, so it can
// be unit-tested in node. pdf.js (pdf.js) loads the document and feeds the raw
// text items here.

// Keep each TTS chunk short so synthesis stays fast and well within serverless
// limits (see research). Paragraphs longer than this are split at sentences.
const MAX_CHUNK = 500;
const SENTENCE_END = /([.;!?·…])\s+/;

// Turn per-page text-item arrays into reading paragraphs. Each item is a pdf.js
// text item: { str, transform:[a,b,c,d,x,y], height }.
export function paragraphsFromPages(pages) {
  let paragraphs = [];
  for (const items of pages) {
    const lines = groupLines(items);
    // Drop junk (page numbers, stray numerals) per page BEFORE the cross-page
    // merge, so a trailing page number can't swallow the next page's text.
    const pageParas = linesToParagraphs(lines).map(t => t.trim()).filter(isReadable);

    // If the previous page ended mid-sentence, continue it onto this page.
    if (
      paragraphs.length > 0 &&
      pageParas.length > 0 &&
      !endsSentence(paragraphs[paragraphs.length - 1])
    ) {
      paragraphs[paragraphs.length - 1] =
        joinLine(paragraphs[paragraphs.length - 1], pageParas.shift());
    }
    paragraphs.push(...pageParas);
  }

  // Chunk long paragraphs so each TTS request stays small.
  return paragraphs.flatMap(splitLong);
}

// A readable paragraph is more than page furniture (numbers, roman numerals).
function isReadable(t) {
  return t && !/^[\divxlcIVXLC.\-–—\s]+$/.test(t);
}

// Group raw text items into visual lines using their baseline y-coordinate.
function groupLines(items) {
  const rows = [];
  for (const it of items) {
    const str = it.str;
    if (!str) continue;
    const y = it.transform[5];
    const x = it.transform[4];
    const h = it.height || 10;
    let row = rows.find(r => Math.abs(r.y - y) <= Math.max(2, r.h * 0.5));
    if (!row) {
      row = { y, h, x0: x, parts: [] };
      rows.push(row);
    }
    row.x0 = Math.min(row.x0, x);
    row.parts.push({ x, str, w: it.width || 0 });
    row.h = Math.max(row.h, h);
  }
  // Top to bottom (PDF y grows upward), left to right within a line.
  rows.sort((a, b) => b.y - a.y);
  for (const r of rows) r.parts.sort((a, b) => a.x - b.x);
  return rows
    .map(r => ({ y: r.y, h: r.h, x0: r.x0, text: assembleLine(r.parts, r.h) }))
    .filter(l => l.text);
}

// Join a line's items left to right. pdf.js often emits each word as its own
// item with no surrounding spaces, so insert a space where there is a real
// horizontal gap and neither side already carries one.
function assembleLine(parts, h) {
  let out = "";
  let prevEnd = null;
  for (const p of parts) {
    if (out) {
      const gap = prevEnd == null ? 0 : p.x - prevEnd;
      const touching = /\s$/.test(out) || /^\s/.test(p.str);
      if (!touching && gap > h * 0.2) out += " ";
    }
    out += p.str;
    prevEnd = p.x + p.w;
  }
  return out.replace(/\s+/g, " ").trim();
}

// Turn ordered lines into paragraphs by detecting vertical gaps and indents.
function linesToParagraphs(lines) {
  if (lines.length === 0) return [];
  const heights = lines.map(l => l.h).sort((a, b) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)] || 10;
  const minX = Math.min(...lines.map(l => l.x0));

  const paras = [];
  let cur = lines[0].text;
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const line = lines[i];
    const gap = prev.y - line.y; // vertical distance between baselines
    const bigGap = gap > medianH * 1.6;
    const indented = line.x0 - minX > medianH * 1.2;

    if (bigGap || indented) {
      paras.push(cur);
      cur = line.text;
    } else {
      cur = joinLine(cur, line.text);
    }
  }
  paras.push(cur);
  return paras;
}

// Join two lines, mending words hyphenated across the break.
function joinLine(a, b) {
  if (/[-­]$/.test(a)) return a.replace(/[-­]$/, "") + b;
  return a + " " + b;
}

function endsSentence(t) {
  return /[.;!?·…"»)]\s*$/.test(t.trim());
}

// Split a long paragraph into <=MAX_CHUNK pieces at sentence boundaries.
function splitLong(para) {
  if (para.length <= MAX_CHUNK) return [para];
  const sentences = para.split(SENTENCE_END);
  const pieces = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const s = (sentences[i] || "") + (sentences[i + 1] || "");
    if (s.trim()) pieces.push(s.trim());
  }
  const chunks = [];
  let buf = "";
  for (const s of pieces) {
    if (buf && (buf + " " + s).length > MAX_CHUNK) {
      chunks.push(buf);
      buf = s;
    } else {
      buf = buf ? buf + " " + s : s;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.length ? chunks : [para];
}
