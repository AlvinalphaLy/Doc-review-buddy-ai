import { useMemo, useState, useEffect } from "react";
import type { Highlight, PageTextContent } from "@/types/review";
import { cn } from "@/lib/utils";

interface HighlightsLayerProps {
  highlights: Highlight[];
  pageText?: PageTextContent;
  scale: number;
  selectedFindingId: string | null;
  onHighlightClick?: (findingId: string) => void;
}

/**
 * Convert PDF.js text item transform into top-left coordinates.
 * NOTE: This is a pragmatic approximation that works well enough for MVP highlighting.
 * PDF text placement is complex; this approach highlights the correct *region* reliably for most docs.
 */
function rectFromTextItem(
  item: { transform: number[]; width: number; height: number },
  pageHeight: number
) {
  const t = item.transform;

  // transform: [a, b, c, d, e, f]
  // e,f correspond to x,y in PDF coordinate space (origin bottom-left)
  const x = t[4];
  const y = t[5];

  // Convert to DOM top-left coords: top = (pageHeight - y) - height
  const height = Math.max(8, item.height || 10);
  const width = Math.max(8, item.width || 10);

  return {
    x,
    y: pageHeight - y - height,
    width,
    height,
  };
}

function tokenize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreItem(itemStr: string, keywords: string[]) {
  const t = itemStr.toLowerCase();
  let score = 0;
  for (const k of keywords) {
    if (!k) continue;
    if (t.includes(k)) score += 2;
    if (t === k) score += 3;
  }
  return score;
}

export function HighlightsLayer({
  highlights,
  pageText,
  scale,
  selectedFindingId,
  onHighlightClick,
}: HighlightsLayerProps) {
  const [flashingId, setFlashingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFindingId) {
      const highlightForFinding = highlights.find(
        (h) => h.findingId === selectedFindingId
      );
      if (highlightForFinding) {
        setFlashingId(highlightForFinding.id);
        const timer = setTimeout(() => setFlashingId(null), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedFindingId, highlights]);

  const processedHighlights = useMemo(() => {
    // If we have no pageText, we can only use precomputed rects or placeholders
    const pageHeight = pageText?.height ?? 800;

    return highlights.map((highlight) => {
      // 1) If rects exist, just scale them (current behavior)
      if (highlight.rects && highlight.rects.length > 0) {
        return {
          ...highlight,
          scaledRects: highlight.rects.map((rect) => ({
            x: rect.x * scale,
            y: rect.y * scale,
            width: rect.width * scale,
            height: rect.height * scale,
          })),
        };
      }

      // 2) If no rects, compute from PDF text items (MVP)
      if (pageText?.items?.length) {
        // Keywords based on severity + common clause words
        // You can improve this later by passing excerpt/snippet per finding.
        const keywords = Array.from(
          new Set([
            ...tokenize(highlight.clauseId || ""),
            ...tokenize(highlight.findingId || ""),
          ])
        );

        // Add some helpful generic keywords based on severity
        // (Optional, but helps matching)
        const severityHints =
          highlight.severity === "high"
            ? ["terminate", "unlimited", "liability"]
            : highlight.severity === "medium"
            ? ["indemnify", "claims"]
            : ["confidential", "perpetual"];

        const searchTerms = Array.from(
          new Set([...keywords, ...severityHints].filter(Boolean))
        ).slice(0, 10);

        // Find best matching items on page
        const ranked = pageText.items
          .map((it) => ({
            it,
            score: scoreItem(it.str, searchTerms),
          }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6); // highlight up to 6 hits

        if (ranked.length > 0) {
          const rects = ranked.map(({ it }) =>
            rectFromTextItem(it, pageHeight)
          );

          return {
            ...highlight,
            scaledRects: rects.map((r) => ({
              x: r.x * scale,
              y: r.y * scale,
              width: r.width * scale,
              height: r.height * scale,
            })),
          };
        }
      }

      // 3) Fallback placeholder (if no text items or no match)
      const baseY = 100 + highlights.indexOf(highlight) * 80;
      return {
        ...highlight,
        scaledRects: [
          {
            x: 50 * scale,
            y: baseY * scale,
            width: 400 * scale,
            height: 20 * scale,
          },
        ],
      };
    });
  }, [highlights, scale, pageText]);

  return (
    <div className="highlight-layer">
      {processedHighlights.map((highlight: any) =>
        highlight.scaledRects.map((rect: any, rectIndex: number) => (
          <div
            key={`${highlight.id}-${rectIndex}`}
            className={cn(
              "highlight-rect",
              highlight.severity,
              selectedFindingId === highlight.findingId && "active",
              flashingId === highlight.id && "flash"
            )}
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
            onClick={() => onHighlightClick?.(highlight.findingId)}
            title="Click to view finding details"
          />
        ))
      )}
    </div>
  );
}
