export type Severity = "low" | "medium" | "high";

export type ProcessingStage = 
  | "idle" 
  | "extracting" 
  | "segmenting" 
  | "analyzing" 
  | "complete" 
  | "error";

export interface DocumentMeta {
  id: string;
  name: string;
  type: "pdf" | "docx" | "txt";
  size: number;
  uploadedAt: Date;
  pageCount?: number;
}

export interface Clause {
  id: string;
  text: string;
  page: number;
  startOffset?: number;
  endOffset?: number;
  category?: string;
}

export interface Finding {
  id: string;
  clauseId: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  remediation?: string;
  policyRefs?: string[];
  page: number;
  excerpt: string;
}

export interface Highlight {
  id: string;
  findingId: string;
  clauseId: string;
  page: number;
  rects: HighlightRect[];
  severity: Severity;
}

export interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RiskSummary {
  overallScore: number;
  status: "Low" | "Moderate" | "High";
  breakdown: CategoryBreakdown[];
  totalFindings: number;
  findingsBySeverity: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface CategoryBreakdown {
  category: string;
  score: number;
  findingsCount: number;
}

export interface ProcessingProgress {
  stage: ProcessingStage;
  processed: number;
  total: number;
  message?: string;
}

export interface ReviewState {
  document: DocumentMeta | null;
  pdfUrl: string | null;
  text: string | null;
  clauses: Clause[];
  findings: Finding[];
  highlights: Highlight[];
  summary: RiskSummary | null;
  progress: ProcessingProgress;
  selectedFindingId: string | null;
  filterSeverity: Severity | null;
  searchQuery: string;
}

export interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir: string;
}

export interface PageTextContent {
  page: number;
  items: TextItem[];
  width: number;
  height: number;
}
