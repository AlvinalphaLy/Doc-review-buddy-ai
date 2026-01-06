import { useMemo } from "react";
import {
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Finding, Severity } from "@/types/review";
import { cn } from "@/lib/utils";

interface FindingsPanelProps {
  findings: Finding[];
  selectedId: string | null;
  filterSeverity: Severity | null;
  searchQuery: string;
  onSelectFinding: (id: string) => void;
  onFilterChange: (severity: Severity | null) => void;
  onSearchChange: (query: string) => void;
}

const severityConfig = {
  high: {
    icon: AlertTriangle,
    label: "High",
    className: "severity-badge high",
  },
  medium: {
    icon: AlertCircle,
    label: "Medium",
    className: "severity-badge medium",
  },
  low: {
    icon: Info,
    label: "Low",
    className: "severity-badge low",
  },
};

export function FindingsPanel({
  findings,
  selectedId,
  filterSeverity,
  searchQuery,
  onSelectFinding,
  onFilterChange,
  onSearchChange,
}: FindingsPanelProps) {
  // Group findings by category
  const groupedFindings = useMemo(() => {
    const groups: Record<string, Finding[]> = {};
    findings.forEach((finding) => {
      if (!groups[finding.category]) {
        groups[finding.category] = [];
      }
      groups[finding.category].push(finding);
    });
    return groups;
  }, [findings]);

  const categories = Object.keys(groupedFindings);

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search findings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1.5">
            {(["high", "medium", "low"] as Severity[]).map((severity) => {
              const config = severityConfig[severity];
              const count = findings.filter((f) => f.severity === severity).length;
              return (
                <Button
                  key={severity}
                  variant={filterSeverity === severity ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() =>
                    onFilterChange(filterSeverity === severity ? null : severity)
                  }
                >
                  <span className={cn("w-2 h-2 rounded-full", {
                    "bg-risk-high": severity === "high",
                    "bg-risk-medium": severity === "medium",
                    "bg-risk-low": severity === "low",
                  })} />
                  {config.label}
                  <span className="text-muted-foreground">({count})</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Findings list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {findings.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterSeverity
                  ? "No findings match your filters"
                  : "No findings detected"}
              </p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={categories} className="space-y-2">
              {categories.map((category) => (
                <AccordionItem key={category} value={category} className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{category}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {groupedFindings[category].length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2">
                    <div className="space-y-2">
                      {groupedFindings[category].map((finding) => (
                        <FindingCard
                          key={finding.id}
                          finding={finding}
                          isSelected={selectedId === finding.id}
                          onClick={() => onSelectFinding(finding.id)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface FindingCardProps {
  finding: Finding;
  isSelected: boolean;
  onClick: () => void;
}

function FindingCard({ finding, isSelected, onClick }: FindingCardProps) {
  const config = severityConfig[finding.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn("finding-card", isSelected && "selected")}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={config.className}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">Page {finding.page}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      <h4 className="font-medium text-sm mb-1.5">{finding.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {finding.description}
      </p>

      {finding.policyRefs && finding.policyRefs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {finding.policyRefs.map((ref, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
            >
              {ref}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
