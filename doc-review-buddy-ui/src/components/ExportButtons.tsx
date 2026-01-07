import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import type { Finding, RiskSummary } from "@/types/review";

interface ExportButtonsProps {
  findings: Finding[];
  summary: RiskSummary | null;
  documentName?: string;
  disabled?: boolean;
}

function safeFileName(name: string) {
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").slice(0, 120);
}

export function ExportButtons({
  findings,
  summary,
  documentName = "document",
  disabled,
}: ExportButtonsProps) {
  const exportAsPdf = () => {
    const docTitle = `Doc Review Buddy — Risk Report`;
    const name = safeFileName(documentName || "document");
    const score = summary?.overallScore ?? 0;
    const status = summary?.status ?? "N/A";

    const pdf = new jsPDF({ unit: "pt", format: "letter" });

    const marginX = 48;
    const marginY = 56;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - marginX * 2;

    let y = marginY;

    const addWrapped = (text: string, size = 12, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);

      const lines = pdf.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > pageHeight - marginY) {
          pdf.addPage();
          y = marginY;
        }
        pdf.text(line, marginX, y);
        y += size + 4;
      }
    };

    // Header
    addWrapped(docTitle, 18, true);
    y += 6;

    // Meta
    addWrapped(`Document: ${documentName}`, 12, true);
    addWrapped(`Generated: ${new Date().toLocaleString()}`, 10, false);
    y += 8;

    // Summary
    addWrapped(`Overall Risk Score: ${score}/100`, 14, true);
    addWrapped(`Status: ${status}`, 12, false);

    const totalFindings = summary?.totalFindings ?? findings.length;
    addWrapped(`Total Findings: ${totalFindings}`, 12, false);

    const sev = summary?.findingsBySeverity;
    if (sev) {
      addWrapped(
        `High: ${sev.high}   Medium: ${sev.medium}   Low: ${sev.low}`,
        11,
        false
      );
    }
    y += 10;

    // Findings
    addWrapped("Findings", 14, true);
    y += 4;

    if (!findings.length) {
      addWrapped("No findings were generated.", 12, false);
    } else {
      findings.forEach((f, idx) => {
        addWrapped(
          `${idx + 1}. [${f.severity.toUpperCase()}] ${f.title}`,
          12,
          true
        );

        addWrapped(`Category: ${f.category}   Page: ${f.page}`, 10, false);

        if (f.description)
          addWrapped(`Description: ${f.description}`, 11, false);
        if (f.remediation)
          addWrapped(`Remediation: ${f.remediation}`, 11, false);
        if (f.excerpt) addWrapped(`Excerpt: ${f.excerpt}`, 10, false);

        y += 8;
      });
    }

    pdf.save(`${name}-review.pdf`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportAsPdf}
      disabled={disabled || !summary}
      title={!summary ? "Run a review first" : "Download PDF report"}
    >
      <Download className="w-4 h-4 mr-2" />
      Export PDF
      <FileText className="w-4 h-4 ml-2" />
    </Button>
  );
}
