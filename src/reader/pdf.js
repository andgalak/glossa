import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { paragraphsFromPages } from "./parse.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export { paragraphsFromPages };

// Extract reading paragraphs from a text-based PDF, entirely in the browser.
// Only the extracted text ever leaves the device. Returns string[] of paragraphs.
export async function extractParagraphs(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    pages.push(content.items);
  }
  return paragraphsFromPages(pages);
}
