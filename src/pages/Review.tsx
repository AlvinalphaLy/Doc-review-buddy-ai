import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileSearch, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/PdfViewer";
import { FindingsPanel } from "@/components/FindingsPanel";
import { RiskDashboard } from "@/components/RiskDashboard";
import { ProgressBar } from "@/components/ProgressBar";
import { ExportButtons } from "@/components/ExportButtons";
import { useReviewStore } from "@/lib/store";
import {
  mockFindings,
  mockSummary,
  simulateProcessing,
} from "@/lib/mock-data";
import type { Highlight, ProcessingStage } from "@/types/review";

export default function Review() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    document,
    pdfUrl,
    findings,
    summary,
    progress,
    selectedFindingId,
    filterSeverity,
    searchQuery,
    setFindings,
    setHighlights,
    setSummary,
    setProgress,
    setSelectedFindingId,
    setFilterSeverity,
    setSearchQuery,
    getFilteredFindings,
    reset,
  } = useReviewStore();

  const [scrollToPage, setScrollToPage] = useState<number | undefined>();
  const [isStarted, setIsStarted] = useState(false);

  // Redirect if no document loaded
  useEffect(() => {
    if (!document && !pdfUrl) {
      // In demo mode, we'll allow viewing without a document
      // navigate("/");
    }
  }, [document, pdfUrl, navigate]);

  // Start processing when page loads
  const startProcessing = useCallback(() => {
    if (isStarted) return;
    setIsStarted(true);

    simulateProcessing(
      (stage, processed, total) => {
        setProgress({
          stage: stage as ProcessingStage,
          processed,
          total,
        });
      },
      () => {
        // Processing complete
        setProgress({ stage: "complete", processed: 0, total: 0 });
        setFindings(mockFindings);
        setSummary(mockSummary);

        // Generate highlights for findings
        const highlights: Highlight[] = mockFindings.map((finding, index) => ({
          id: `h-${finding.id}`,
          findingId: finding.id,
          clauseId: finding.clauseId,
          page: finding.page,
          severity: finding.severity,
          rects: [
            {
              x: 40,
              y: 80 + (index % 4) * 120,
              width: 350,
              height: 16,
            },
            {
              x: 40,
              y: 98 + (index % 4) * 120,
              width: 280,
              height: 16,
            },
          ],
        }));
        setHighlights(highlights);
      }
    );
  }, [isStarted, setProgress, setFindings, setSummary, setHighlights]);

  // Auto-start processing
  useEffect(() => {
    const timer = setTimeout(startProcessing, 500);
    return () => clearTimeout(timer);
  }, [startProcessing]);

  // Handle finding selection
  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    const finding = findings.find((f) => f.id === findingId);
    if (finding) {
      setScrollToPage(finding.page);
    }
  };

  const handleHighlightClick = (findingId: string) => {
    setSelectedFindingId(findingId);
  };

  const filteredFindings = getFilteredFindings();
  const highlights = useReviewStore((s) => s.highlights);
  const isProcessing = progress.stage !== "idle" && progress.stage !== "complete";

  // Demo mode: show a placeholder if no PDF
  const showDemo = !pdfUrl;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card shrink-0">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileSearch className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-sm">
                  {document?.name || "Sample Contract.pdf"}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {document?.pageCount || 3} pages •{" "}
                  {progress.stage === "complete" ? "Analysis complete" : "Processing..."}
                </p>
              </div>
            </div>
          </div>

          <ExportButtons
            findings={findings}
            summary={summary}
            documentName={document?.name?.replace(/\.[^/.]+$/, "")}
            disabled={isProcessing}
          />
        </div>
      </header>

      {/* Progress bar */}
      {isProcessing && (
        <div className="container py-4 shrink-0">
          <ProgressBar
            stage={progress.stage}
            processed={progress.processed}
            total={progress.total}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 min-w-0 border-r">
          {showDemo ? (
            <DemoViewer
              highlights={highlights}
              selectedFindingId={selectedFindingId}
              onHighlightClick={handleHighlightClick}
            />
          ) : (
            <PdfViewer
              url={pdfUrl}
              highlights={highlights}
              selectedFindingId={selectedFindingId}
              onHighlightClick={handleHighlightClick}
              scrollToPage={scrollToPage}
            />
          )}
        </div>

        {/* Right panel */}
        <div className="w-[420px] shrink-0 flex flex-col bg-card overflow-hidden">
          {/* Risk dashboard */}
          <div className="p-4 border-b shrink-0">
            <RiskDashboard summary={summary} isLoading={isProcessing} />
          </div>

          {/* Findings panel */}
          <div className="flex-1 min-h-0">
            <FindingsPanel
              findings={filteredFindings}
              selectedId={selectedFindingId}
              filterSeverity={filterSeverity}
              searchQuery={searchQuery}
              onSelectFinding={handleSelectFinding}
              onFilterChange={setFilterSeverity}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo viewer when no PDF is loaded
function DemoViewer({
  highlights,
  selectedFindingId,
  onHighlightClick,
}: {
  highlights: Highlight[];
  selectedFindingId: string | null;
  onHighlightClick: (id: string) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <span className="text-sm text-muted-foreground">Demo Document</span>
        <span className="text-sm text-muted-foreground">Page 1 of 3</span>
      </div>
      <div className="flex-1 overflow-auto bg-muted/50 p-6">
        <div className="max-w-[700px] mx-auto space-y-6">
          {[1, 2, 3].map((page) => {
            const pageHighlights = highlights.filter((h) => h.page === page);
            return (
              <div
                key={page}
                className="bg-card rounded-lg shadow-lg p-8 relative min-h-[800px]"
              >
                <div className="absolute top-4 right-4 text-xs text-muted-foreground">
                  Page {page}
                </div>
                <h3 className="text-lg font-semibold mb-4">
                  {page === 1 && "SERVICE AGREEMENT"}
                  {page === 2 && "TERMS AND CONDITIONS"}
                  {page === 3 && "GOVERNING LAW & TERMINATION"}
                </h3>
                
                {/* Demo content with highlights */}
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  {page === 1 && (
                    <>
                      <p>This Service Agreement ("Agreement") is entered into as of the Effective Date by and between Provider and Client.</p>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-high-bg/50 border-l-2 border-risk-high">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f1")}>
                            The Provider shall be liable for all damages, costs, and expenses arising from the performance or non-performance of services under this Agreement, without limitation or cap.
                          </p>
                        </div>
                      </div>
                      <p>Client agrees to pay all fees as specified in the attached Schedule A.</p>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-high-bg/50 border-l-2 border-risk-high">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f3")}>
                            Client agrees to indemnify and hold harmless Provider from any and all claims, damages, losses, and expenses, including attorney's fees, arising from any cause whatsoever.
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-medium-bg/50 border-l-2 border-risk-medium">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f7")}>
                            All intellectual property developed in connection with this Agreement shall be owned by Provider, including any modifications or derivatives.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {page === 2 && (
                    <>
                      <p>The following terms and conditions apply to all services provided under this Agreement.</p>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-medium-bg/50 border-l-2 border-risk-medium">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f2")}>
                            This Agreement shall automatically renew for successive one-year periods unless either party provides written notice of non-renewal.
                          </p>
                        </div>
                      </div>
                      <p>Services will be delivered in accordance with industry standards.</p>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-high-bg/50 border-l-2 border-risk-high">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f5")}>
                            Provider may collect and process data as necessary for the performance of services. No specific data protection measures are required.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  {page === 3 && (
                    <>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-low-bg/50 border-l-2 border-risk-low">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f4")}>
                            This Agreement shall be governed by the laws of the State of Delaware, without regard to conflicts of law principles.
                          </p>
                        </div>
                      </div>
                      <p>Any disputes arising under this Agreement shall be resolved through binding arbitration.</p>
                      <div className="relative">
                        <div className="p-3 rounded bg-risk-medium-bg/50 border-l-2 border-risk-medium">
                          <p className="text-foreground cursor-pointer" onClick={() => onHighlightClick("f6")}>
                            Either party may terminate this Agreement upon written notice to the other party. The specific terms and conditions of termination shall be determined at that time.
                          </p>
                        </div>
                      </div>
                      <p>This Agreement constitutes the entire agreement between the parties.</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
