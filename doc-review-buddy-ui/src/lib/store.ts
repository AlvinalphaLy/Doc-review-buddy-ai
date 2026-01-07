import { create } from "zustand";
import type {
  ReviewState,
  DocumentMeta,
  Clause,
  Finding,
  Highlight,
  RiskSummary,
  ProcessingProgress,
  Severity,
} from "@/types/review";

interface ReviewStore extends ReviewState {
  // Setters
  setDocument: (doc: DocumentMeta | null) => void;
  setPdfUrl: (url: string | null) => void;
  setText: (text: string | null) => void;
  setClauses: (clauses: Clause[]) => void;
  setFindings: (findings: Finding[]) => void;
  setHighlights: (highlights: Highlight[]) => void;
  setSummary: (summary: RiskSummary | null) => void;
  setProgress: (progress: ProcessingProgress) => void;
  setSelectedFindingId: (id: string | null) => void;
  setFilterSeverity: (severity: Severity | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Computed
  getFilteredFindings: () => Finding[];
  
  // Actions
  reset: () => void;
}

const initialState: ReviewState = {
  document: null,
  pdfUrl: null,
  text: null,
  clauses: [],
  findings: [],
  highlights: [],
  summary: null,
  progress: {
    stage: "idle",
    processed: 0,
    total: 0,
  },
  selectedFindingId: null,
  filterSeverity: null,
  searchQuery: "",
};

export const useReviewStore = create<ReviewStore>((set, get) => ({
  ...initialState,

  setDocument: (doc) => set({ document: doc }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setText: (text) => set({ text }),
  setClauses: (clauses) => set({ clauses }),
  setFindings: (findings) => set({ findings }),
  setHighlights: (highlights) => set({ highlights }),
  setSummary: (summary) => set({ summary }),
  setProgress: (progress) => set({ progress }),
  setSelectedFindingId: (id) => set({ selectedFindingId: id }),
  setFilterSeverity: (severity) => set({ filterSeverity: severity }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredFindings: () => {
    const { findings, filterSeverity, searchQuery } = get();
    let filtered = findings;

    if (filterSeverity) {
      filtered = filtered.filter((f) => f.severity === filterSeverity);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  },

  reset: () => set(initialState),
}));
