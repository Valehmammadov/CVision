/**
 * Browser-side CV text extraction (PDF via pdfjs-dist, DOCX via mammoth).
 * Throws ExtractionError with a recruiter-friendly message on failure.
 */
import { MIN_EXTRACTED_CHARS, UPLOAD_LIMITS } from "@/config/screening";

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

const MAX_PDF_PAGES = 30;

function extensionOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function startsWithBytes(buf: Uint8Array, bytes: number[], offset = 0) {
  return bytes.every((b, i) => buf[offset + i] === b);
}

/** "%PDF-" may appear within the first 1 KB per the PDF spec. */
function looksLikePdf(buf: Uint8Array) {
  const head = new TextDecoder("latin1").decode(buf.slice(0, 1024));
  return head.includes("%PDF-");
}

/** DOCX files are ZIP archives ("PK\x03\x04"). */
function looksLikeZip(buf: Uint8Array) {
  return startsWithBytes(buf, [0x50, 0x4b, 0x03, 0x04]);
}

/** Old binary .doc files (OLE container) renamed to .docx. */
function looksLikeOldDoc(buf: Uint8Array) {
  return startsWithBytes(buf, [0xd0, 0xcf, 0x11, 0xe0]);
}

export function normalizeText(raw: string) {
  return raw
    .replace(/ /g, " ")
    .replace(/[•●▪‣⁃]/g, "•")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * pdf.js is loaded as a static file from /public/pdfjs instead of being bundled:
 * re-bundling pdfjs-dist v5 with Webpack breaks in dev mode
 * ("Object.defineProperty called on non-object"). The files in public/pdfjs are copies of
 * node_modules/pdfjs-dist/build/pdf.min.mjs and pdf.worker.min.mjs (keep versions in sync).
 */
type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

function loadPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    const libUrl = "/pdfjs/pdf.min.mjs";
    pdfjsPromise = (import(/* webpackIgnore: true */ /* turbopackIgnore: true */ libUrl) as Promise<PdfJs>)
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        return lib;
      })
      .catch((err) => {
        pdfjsPromise = null;
        console.error("Failed to load pdf.js:", err);
        throw new ExtractionError("The PDF reader could not be loaded. Please refresh the page and try again.");
      });
  }
  return pdfjsPromise;
}

async function extractPdf(data: Uint8Array): Promise<ExtractedCv> {
  const pdfjs = await loadPdfJs();

  let doc;
  try {
    doc = await pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: true }).promise;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "PasswordException")
      throw new ExtractionError("This PDF is password-protected. Please upload an unprotected copy.");
    if (name === "InvalidPDFException")
      throw new ExtractionError("This PDF appears to be corrupted and could not be opened.");
    throw new ExtractionError("This PDF could not be opened. It may be damaged or use an unsupported format.");
  }

  try {
    const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
    const parts: string[] = [];
    const links: string[] = [];
    for (let p = 1; p <= pages; p++) {
      const page = await doc.getPage(p);
      // Hyperlinks (e.g. a "GitHub" label linking to github.com/user) live in link annotations.
      try {
        for (const a of await page.getAnnotations()) {
          if (a?.subtype === "Link" && typeof a.url === "string") links.push(a.url);
        }
      } catch {
        /* annotations are optional */
      }
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        pageText += item.str;
        pageText += item.hasEOL ? "\n" : item.str.endsWith(" ") ? "" : " ";
      }
      parts.push(pageText);
      page.cleanup();
    }
    const text = normalizeText(parts.join("\n"));
    if (text.replace(/\s/g, "").length < MIN_EXTRACTED_CHARS) {
      throw new ExtractionError(
        "No readable text was found. This looks like a scanned or image-based PDF — OCR is not supported in this MVP. Please upload a text-based PDF (e.g. exported from Word or Google Docs)."
      );
    }
    return { text, links };
  } finally {
    void doc.destroy();
  }
}

async function extractDocx(buffer: ArrayBuffer): Promise<ExtractedCv> {
  const mammoth = (await import("mammoth")).default;
  let result;
  const links: string[] = [];
  try {
    result = await mammoth.extractRawText({ arrayBuffer: buffer });
    // Raw text drops hyperlinks, so read hrefs from the HTML conversion as well.
    try {
      const html = await mammoth.convertToHtml({ arrayBuffer: buffer });
      for (const m of html.value.matchAll(/href="([^"]+)"/g)) links.push(m[1].replace(/&amp;/g, "&"));
    } catch {
      /* links are optional */
    }
  } catch {
    throw new ExtractionError(
      "This DOCX file could not be read. It may be corrupted or not a valid Word document."
    );
  }
  const text = normalizeText(result.value);
  if (text.replace(/\s/g, "").length < MIN_EXTRACTED_CHARS) {
    throw new ExtractionError("This document contains no readable text (it may be empty or contain only images).");
  }
  return { text, links };
}

export interface ExtractedCv {
  text: string;
  /** Hyperlink targets embedded in the document. */
  links: string[];
}

/** Extracts plain text (and embedded hyperlinks) from a PDF or DOCX file. */
export async function extractCvText(file: File): Promise<ExtractedCv> {
  const ext = extensionOf(file.name);
  if (!UPLOAD_LIMITS.acceptedExtensions.includes(ext)) {
    throw new ExtractionError("Unsupported file type. Please upload PDF or DOCX files.");
  }
  if (file.size === 0) throw new ExtractionError("The file is empty.");
  if (file.size > UPLOAD_LIMITS.maxFileSizeMB * 1024 * 1024) {
    throw new ExtractionError(`The file is larger than the ${UPLOAD_LIMITS.maxFileSizeMB} MB limit.`);
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (ext === ".pdf") {
    if (!looksLikePdf(bytes)) {
      throw new ExtractionError(
        "This file has a .pdf extension but isn't a valid PDF. It may be corrupted or renamed."
      );
    }
    return extractPdf(bytes);
  }

  if (looksLikeOldDoc(bytes)) {
    throw new ExtractionError(
      "This looks like an older .doc Word file renamed to .docx. Please re-save it as .docx or PDF."
    );
  }
  if (!looksLikeZip(bytes)) {
    throw new ExtractionError(
      "This file has a .docx extension but isn't a valid Word document. It may be corrupted or renamed."
    );
  }
  return extractDocx(buffer);
}
