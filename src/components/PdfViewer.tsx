import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HighlightsLayer } from "./HighlightsLayer";
import type { Highlight, PageTextContent } from "@/types/review";
import { cn } from "@/lib/utils";

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  url: string;
  highlights: Highlight[];
  selectedFindingId: string | null;
  onHighlightClick?: (findingId: string) => void;
  scrollToPage?: number;
}

export function PdfViewer({
  url,
  highlights,
  selectedFindingId,
  onHighlightClick,
  scrollToPage,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [pageTexts, setPageTexts] = useState<Map<number, PageTextContent>>(new Map());
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load PDF
  useEffect(() => {
    async function loadPdf() {
      setLoading(true);
      try {
        const loadedPdf = await pdfjsLib.getDocument(url).promise;
        setPdf(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setRenderedPages(new Set());
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
      setLoading(false);
    }
    loadPdf();
  }, [url]);

  // Render page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdf || renderedPages.has(pageNum)) return;

      const canvas = canvasRefs.current.get(pageNum);
      if (!canvas) return;

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");
        if (!context) return;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        // Get text content for highlighting
        const textContent = await page.getTextContent();
        const items = textContent.items.map((item: any) => ({
          str: item.str,
          transform: item.transform,
          width: item.width,
          height: item.height,
          dir: item.dir,
        }));

        setPageTexts((prev) => {
          const next = new Map(prev);
          next.set(pageNum, {
            page: pageNum,
            items,
            width: viewport.width / scale,
            height: viewport.height / scale,
          });
          return next;
        });

        setRenderedPages((prev) => new Set(prev).add(pageNum));
      } catch (error) {
        console.error(`Error rendering page ${pageNum}:`, error);
      }
    },
    [pdf, scale, renderedPages]
  );

  // Render visible pages
  useEffect(() => {
    if (!pdf) return;

    // Render current page and adjacent pages
    const pagesToRender = [currentPage - 1, currentPage, currentPage + 1].filter(
      (p) => p >= 1 && p <= totalPages
    );

    pagesToRender.forEach(renderPage);
  }, [pdf, currentPage, totalPages, renderPage]);

  // Re-render on scale change
  useEffect(() => {
    setRenderedPages(new Set());
  }, [scale]);

  // Scroll to page when requested
  useEffect(() => {
    if (scrollToPage && scrollToPage >= 1 && scrollToPage <= totalPages) {
      setCurrentPage(scrollToPage);
      const pageContainer = pageContainerRefs.current.get(scrollToPage);
      if (pageContainer) {
        pageContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [scrollToPage, totalPages]);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  const pageHighlights = (page: number) =>
    highlights.filter((h) => h.page === page);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/50 p-6"
      >
        <div className="flex flex-col items-center gap-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageContainerRefs.current.set(pageNum, el);
              }}
              className={cn(
                "pdf-page-container rounded-lg overflow-hidden",
                pageNum === currentPage && "ring-2 ring-primary/20"
              )}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                }}
                className="pdf-canvas"
              />
              <HighlightsLayer
                highlights={pageHighlights(pageNum)}
                pageText={pageTexts.get(pageNum)}
                scale={scale}
                selectedFindingId={selectedFindingId}
                onHighlightClick={onHighlightClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
