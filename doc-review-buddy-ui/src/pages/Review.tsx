import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileSearch, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfViewer } from "@/components/PdfViewer";
import { FindingsPanel } from "@/components/FindingsPanel";
import { RiskDashboard } from "@/components/RiskDashboard";
import { ProgressBar } from "@/components/ProgressBar";
import { ExportButtons } from "@/components/ExportButtons";
import { useReviewStore } from "@/lib/store";
import { runReview, getResults } from "@/lib/api";
import type { Highlight } from "@/types/review";

export default function Review() {
  const { id } = useParams<{ id: string }>();

  const {
    document,
    pdfUrl,
    findings,
    summary,
    progress,
    highlights,
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
  } = useReviewStore();

  const [scrollToPage, setScrollToPage] = useState<number | undefined>();
  const [isStarted, setIsStarted] = useState(false);

  const startProcessing = useCallback(async () => {
    if (isStarted) return;
    if (!id) return;

    setIsStarted(true);

    try {
      setProgress({ stage: "segmenting", processed: 0, total: 0 });
      await runReview(id);

      setProgress({ stage: "analyzing", processed: 0, total: 0 });
      const results = await getResults(id);

      const score = results?.risk?.score ?? results?.riskScore ?? 0;

      const mappedFindings = (results?.findings ?? []).map((f: any) => ({
        id: f.id,
        clauseId: f.clauseId,
        title: f.title,
        description: f.explanation ?? "",
        severity: f.severity, // "low" | "medium" | "high"
        category: "Contract",
        remediation: undefined,
        policyRefs: [],
        page: 1,
        excerpt: "",
      }));

      setFindings(mappedFindings);

      // ✅ Build counts required by RiskDashboard
      const counts = { high: 0, medium: 0, low: 0 };
      for (const f of mappedFindings) {
        const sev = (f.severity || "").toLowerCase();
        if (sev === "high") counts.high++;
        else if (sev === "medium") counts.medium++;
        else counts.low++;
      }

      const status = score >= 70 ? "High" : score >= 35 ? "Moderate" : "Low";

      // ✅ RiskDashboard expects breakdown to be an ARRAY
      const breakdown = [{ category: "Contract", score }];

      setSummary({
        overallScore: score,
        status,
        totalFindings: mappedFindings.length,
        findingsBySeverity: counts,
        breakdown,
      } as any);

      // ✅ Highlights: placeholder rects, but valid props
      const demoHighlights: Highlight[] = mappedFindings.map(
        (finding: any, index: number) => ({
          id: `h-${finding.id}`,
          findingId: finding.id,
          clauseId: finding.clauseId,
          page: finding.page ?? 1,
          severity: finding.severity,
          rects: [],
        })
      );

      setHighlights(demoHighlights);

      setProgress({ stage: "complete", processed: 0, total: 0 });
    } catch (error) {
      console.error("Review failed:", error);
      setProgress({ stage: "error", processed: 0, total: 0 });
    }
  }, [id, isStarted, setProgress, setFindings, setSummary, setHighlights]);

  useEffect(() => {
    startProcessing();
  }, [startProcessing]);

  useEffect(() => {
    if (!selectedFindingId) return;
    const f = findings.find((x) => x.id === selectedFindingId);
    if (f?.page) setScrollToPage(f.page);
  }, [selectedFindingId, findings]);

  const filteredFindings = getFilteredFindings();

  const isLoading =
    progress.stage !== "idle" &&
    progress.stage !== "complete" &&
    progress.stage !== "error";

  const safePdfUrl = useMemo(
    () => (typeof pdfUrl === "string" ? pdfUrl : ""),
    [pdfUrl]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>

            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-primary" />
            </div>

            <div>
              <h1 className="text-xl font-semibold">Review</h1>
              <p className="text-sm text-muted-foreground">
                {document?.name ?? "Document"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExportButtons />
          </div>
        </div>
      </header>

      <main className="container py-6">
        {isLoading && (
          <div className="mb-6">
            <ProgressBar
              stage={progress.stage}
              processed={progress.processed}
              total={progress.total}
              message={
                progress.stage === "segmenting"
                  ? "Segmenting clauses..."
                  : "Analyzing compliance..."
              }
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <div className="rounded-xl border bg-card overflow-hidden">
              {safePdfUrl ? (
                <PdfViewer
                  url={safePdfUrl} // ✅ correct prop name
                  highlights={highlights || []} // ✅ required
                  selectedFindingId={selectedFindingId}
                  onHighlightClick={(fid) => setSelectedFindingId(fid)}
                  scrollToPage={scrollToPage}
                />
              ) : (
                <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <FileText className="w-8 h-8" />
                  <p>No PDF preview available for this file type.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <RiskDashboard summary={summary} isLoading={isLoading} />

            <FindingsPanel
              findings={filteredFindings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={(fid) => setSelectedFindingId(fid)}
              filterSeverity={filterSeverity}
              onFilterSeverity={(sev) => setFilterSeverity(sev)}
              searchQuery={searchQuery}
              onSearchQuery={(q) => setSearchQuery(q)}
              isLoading={isLoading}
            />

            {progress.stage === "error" && (
              <div className="rounded-xl border bg-card p-4 text-sm text-red-500">
                Something went wrong running the review. Check the backend
                terminal for errors.
              </div>
            )}
          </div>
        </div>

        {!isStarted && (
          <div className="mt-10 flex justify-center">
            <Button onClick={startProcessing}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Start Review
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
