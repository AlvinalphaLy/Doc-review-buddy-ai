import { Check, Loader2 } from "lucide-react";
import type { ProcessingStage } from "@/types/review";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  stage: ProcessingStage;
  processed: number;
  total: number;
  message?: string;
}

const stages: { key: ProcessingStage; label: string }[] = [
  { key: "extracting", label: "Extracting Text" },
  { key: "segmenting", label: "Segmenting Clauses" },
  { key: "analyzing", label: "Analyzing Compliance" },
];

export function ProgressBar({ stage, processed, total, message }: ProgressBarProps) {
  const currentIndex = stages.findIndex((s) => s.key === stage);
  const isComplete = stage === "complete";
  const isError = stage === "error";

  if (stage === "idle") return null;

  const progress = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="bg-card border rounded-xl p-4 animate-fade-in">
      {/* Stages */}
      <div className="flex items-center justify-between mb-4">
        {stages.map((s, index) => {
          const isActive = s.key === stage;
          const isCompleted = isComplete || currentIndex > index;
          const isPending = currentIndex < index && !isComplete;

          return (
            <div
              key={s.key}
              className={cn("progress-stage flex-1", {
                active: isActive,
                complete: isCompleted,
                pending: isPending,
              })}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    {
                      "bg-primary text-primary-foreground": isActive,
                      "bg-risk-low text-risk-low-foreground": isCompleted,
                      "bg-muted text-muted-foreground": isPending,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs hidden sm:inline">{s.label}</span>
              </div>

              {/* Connector line */}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-3 rounded-full transition-all",
                    isCompleted ? "bg-risk-low" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {!isComplete && !isError && (
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              {message || `Processing ${processed} of ${total}`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Complete message */}
      {isComplete && (
        <div className="flex items-center gap-2 text-sm text-risk-low">
          <Check className="w-4 h-4" />
          <span>Analysis complete</span>
        </div>
      )}

      {/* Error message */}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-risk-high">
          <span>An error occurred during processing</span>
        </div>
      )}
    </div>
  );
}
