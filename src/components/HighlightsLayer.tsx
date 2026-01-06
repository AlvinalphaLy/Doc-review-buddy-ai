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

export function HighlightsLayer({
  highlights,
  pageText,
  scale,
  selectedFindingId,
  onHighlightClick,
}: HighlightsLayerProps) {
  const [flashingId, setFlashingId] = useState<string | null>(null);

  // Flash highlight when selected
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
    // If we have pre-computed rects, use them
    return highlights.map((highlight) => {
      if (highlight.rects.length > 0) {
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

      // Generate placeholder rects if none exist
      // In a real app, these would be computed from PDF.js text items
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
      {processedHighlights.map((highlight) =>
        highlight.scaledRects.map((rect, rectIndex) => (
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
            title={`Click to view finding details`}
          />
        ))
      )}
    </div>
  );
}
