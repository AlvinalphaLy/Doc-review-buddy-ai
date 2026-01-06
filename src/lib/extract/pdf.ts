import type { PageTextContent, TextItem } from "@/types/review";

// We'll use pdfjs from CDN to avoid top-level await build issues
let pdfjsLib: any = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  
  // Load PDF.js from CDN
  if (typeof window !== 'undefined' && !(window as any).pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  
  return pdfjsLib;
}

export interface ExtractedPdf {
  text: string;
  pageCount: number;
  pageTexts: PageTextContent[];
}

export async function extractPdfText(file: File): Promise<ExtractedPdf> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  
  const pageTexts: PageTextContent[] = [];
  const textParts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const items: TextItem[] = textContent.items.map((item: any) => ({
      str: item.str,
      transform: item.transform,
      width: item.width,
      height: item.height,
      dir: item.dir,
    }));

    pageTexts.push({
      page: pageNum,
      items,
      width: viewport.width,
      height: viewport.height,
    });

    // Extract plain text from page
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    textParts.push(`[Page ${pageNum}]\n${pageText}`);
  }

  return {
    text: textParts.join("\n\n"),
    pageCount: pdf.numPages,
    pageTexts,
  };
}

export async function loadPdfDocument(url: string) {
  const pdfjs = await loadPdfJs();
  return pdfjs.getDocument(url).promise;
}

export async function renderPdfPage(
  pdf: any,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get canvas context");

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return { width: viewport.width, height: viewport.height };
}

export function findTextRects(
  pageText: PageTextContent,
  searchText: string,
  scale: number = 1.5
): { x: number; y: number; width: number; height: number }[] {
  const rects: { x: number; y: number; width: number; height: number }[] = [];
  const searchLower = searchText.toLowerCase().slice(0, 50);
  
  let accumulatedText = "";
  let startItemIndex = -1;
  
  for (let i = 0; i < pageText.items.length; i++) {
    const item = pageText.items[i];
    const itemTextLower = item.str.toLowerCase();
    
    if (searchLower.includes(itemTextLower) || itemTextLower.includes(searchLower.slice(0, 20))) {
      if (startItemIndex === -1) {
        startItemIndex = i;
        accumulatedText = "";
      }
      
      accumulatedText += item.str;
      
      if (accumulatedText.toLowerCase().includes(searchLower.slice(0, 20))) {
        for (let j = startItemIndex; j <= i; j++) {
          const matchItem = pageText.items[j];
          const [, , , , tx, ty] = matchItem.transform;
          
          rects.push({
            x: tx * scale,
            y: (pageText.height - ty) * scale - (matchItem.height * scale),
            width: matchItem.width * scale,
            height: matchItem.height * scale * 1.2,
          });
        }
        
        startItemIndex = -1;
        accumulatedText = "";
      }
    } else {
      startItemIndex = -1;
      accumulatedText = "";
    }
  }

  return mergeAdjacentRects(rects);
}

function mergeAdjacentRects(rects: { x: number; y: number; width: number; height: number }[]) {
  if (rects.length === 0) return [];
  
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const merged: typeof rects = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    
    if (Math.abs(current.y - last.y) < 5 && current.x - (last.x + last.width) < 10) {
      last.width = current.x + current.width - last.x;
      last.height = Math.max(last.height, current.height);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}
