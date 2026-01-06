import { Download, FileJson, FileText, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Finding, RiskSummary } from "@/types/review";

interface ExportButtonsProps {
  findings: Finding[];
  summary: RiskSummary | null;
  documentName?: string;
  disabled?: boolean;
}

export function ExportButtons({
  findings,
  summary,
  documentName = "document",
  disabled,
}: ExportButtonsProps) {
  const exportAsJson = () => {
    const data = {
      documentName,
      exportedAt: new Date().toISOString(),
      summary,
      findings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    downloadBlob(blob, `${documentName}-review.json`);
  };

  const exportAsMarkdown = () => {
    const lines: string[] = [
      `# Document Review Report`,
      ``,
      `**Document:** ${documentName}`,
      `**Generated:** ${new Date().toLocaleDateString()}`,
      ``,
      `---`,
      ``,
      `## Risk Summary`,
      ``,
      `- **Overall Score:** ${summary?.overallScore || "N/A"}/100`,
      `- **Status:** ${summary?.status || "N/A"}`,
      `- **Total Findings:** ${summary?.totalFindings || 0}`,
      `  - High: ${summary?.findingsBySeverity.high || 0}`,
      `  - Medium: ${summary?.findingsBySeverity.medium || 0}`,
      `  - Low: ${summary?.findingsBySeverity.low || 0}`,
      ``,
      `---`,
      ``,
      `## Findings`,
      ``,
    ];

    // Group by severity
    const severities = ["high", "medium", "low"] as const;
    severities.forEach((severity) => {
      const severityFindings = findings.filter((f) => f.severity === severity);
      if (severityFindings.length === 0) return;

      lines.push(`### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity`);
      lines.push(``);

      severityFindings.forEach((finding, index) => {
        lines.push(`#### ${index + 1}. ${finding.title}`);
        lines.push(``);
        lines.push(`- **Category:** ${finding.category}`);
        lines.push(`- **Page:** ${finding.page}`);
        lines.push(``);
        lines.push(`**Description:**`);
        lines.push(finding.description);
        lines.push(``);
        if (finding.remediation) {
          lines.push(`**Remediation:**`);
          lines.push(finding.remediation);
          lines.push(``);
        }
        if (finding.excerpt) {
          lines.push(`**Clause Excerpt:**`);
          lines.push(`> ${finding.excerpt}`);
          lines.push(``);
        }
        lines.push(`---`);
        lines.push(``);
      });
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    downloadBlob(blob, `${documentName}-review.md`);
  };

  const exportAsCsv = () => {
    const headers = [
      "Title",
      "Severity",
      "Category",
      "Page",
      "Description",
      "Remediation",
    ];
    const rows = findings.map((f) => [
      `"${f.title.replace(/"/g, '""')}"`,
      f.severity,
      f.category,
      f.page.toString(),
      `"${f.description.replace(/"/g, '""')}"`,
      `"${(f.remediation || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `${documentName}-review.csv`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportAsJson}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsMarkdown}>
          <FileText className="w-4 h-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsCsv}>
          <FileType className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
