/** Extracts plain text from a PDF or DOCX resume, entirely in the browser. */

const MAX_BYTES = 10 * 1024 * 1024;

export async function readResumeFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error("That file is over 10 MB.");
  const name = file.name.toLowerCase();
  const data = await file.arrayBuffer();

  if (name.endsWith(".pdf") || file.type === "application/pdf") return readPdf(data);
  if (name.endsWith(".docx")) return readDocx(data);
  throw new Error("Please use a PDF or DOCX file.");
}

async function readPdf(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const task = pdfjs.getDocument({ data });
  const pdf = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Rebuild lines from text items using their y position.
    let line = "";
    let lastY: number | null = null;
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line.trim());
        line = "";
      }
      line += item.str + (item.hasEOL ? "\n" : "");
      lastY = y;
    }
    lines.push(line.trim());
    pages.push(lines.filter(Boolean).join("\n"));
  }
  await task.destroy();
  return pages.join("\n");
}

async function readDocx(data: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: data });
  return value;
}
