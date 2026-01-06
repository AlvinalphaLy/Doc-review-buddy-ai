import { useMemo } from "react";
import { AlertTriangle, AlertCircle, Info, TrendingUp } from "lucide-react";
import type { RiskSummary } from "@/types/review";
import { cn } from "@/lib/utils";

interface RiskDashboardProps {
  summary: RiskSummary | null;
  isLoading?: boolean;
}

export function RiskDashboard({ summary, isLoading }: RiskDashboardProps) {
  const statusConfig = useMemo(() => {
    if (!summary) return null;
    
    switch (summary.status) {
      case "Low":
        return {
          color: "text-risk-low",
          bg: "bg-risk-low-bg",
          stroke: "stroke-risk-low",
          label: "Low Risk",
          icon: Info,
        };
      case "Moderate":
        return {
          color: "text-risk-medium",
          bg: "bg-risk-medium-bg",
          stroke: "stroke-risk-medium",
          label: "Moderate Risk",
          icon: AlertCircle,
        };
      case "High":
        return {
          color: "text-risk-high",
          bg: "bg-risk-high-bg",
          stroke: "stroke-risk-high",
          label: "High Risk",
          icon: AlertTriangle,
        };
    }
  }, [summary]);

  if (isLoading || !summary) {
    return (
      <div className="bg-card rounded-xl border p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const Icon = statusConfig?.icon || Info;

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Header with score */}
      <div className={cn("p-6", statusConfig?.bg)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground/80 mb-1">
              Risk Assessment
            </p>
            <div className="flex items-center gap-2">
              <Icon className={cn("w-5 h-5", statusConfig?.color)} />
              <span className={cn("text-lg font-semibold", statusConfig?.color)}>
                {statusConfig?.label}
              </span>
            </div>
          </div>

          {/* Circular score */}
          <div className="risk-score-ring">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(summary.overallScore / 100) * 220} 220`}
                className={statusConfig?.stroke}
              />
            </svg>
            <span className={cn("score-text", statusConfig?.color)}>
              {summary.overallScore}
            </span>
          </div>
        </div>
      </div>

      {/* Findings count */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Findings</span>
          <span className="font-semibold">{summary.totalFindings}</span>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-risk-high" />
            <span className="text-xs text-muted-foreground">
              {summary.findingsBySeverity.high} High
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-risk-medium" />
            <span className="text-xs text-muted-foreground">
              {summary.findingsBySeverity.medium} Medium
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-risk-low" />
            <span className="text-xs text-muted-foreground">
              {summary.findingsBySeverity.low} Low
            </span>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Category Breakdown</span>
        </div>
        <div className="space-y-3">
          {summary.breakdown.slice(0, 5).map((category) => (
            <div key={category.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{category.category}</span>
                <span className="font-medium">{category.score}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", {
                    "bg-risk-high": category.score >= 70,
                    "bg-risk-medium": category.score >= 40 && category.score < 70,
                    "bg-risk-low": category.score < 40,
                  })}
                  style={{ width: `${category.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
