import type { Finding, RiskSummary, Clause } from "@/types/review";

// Mock findings for demo purposes
export const mockFindings: Finding[] = [
  {
    id: "f1",
    clauseId: "c1",
    title: "Unlimited Liability Clause",
    description: "The contract contains an unlimited liability provision that could expose the organization to significant financial risk without any cap on damages.",
    severity: "high",
    category: "Liability",
    remediation: "Add a liability cap clause limiting total liability to the contract value or a reasonable multiple thereof.",
    policyRefs: ["Liability Policy §3.2", "Risk Management Guidelines"],
    page: 1,
    excerpt: "The Provider shall be liable for all damages, costs, and expenses arising from...",
  },
  {
    id: "f2",
    clauseId: "c2",
    title: "Automatic Renewal Without Notice",
    description: "Contract automatically renews for successive terms without requiring advance notice, potentially locking the organization into unfavorable terms.",
    severity: "medium",
    category: "Term & Renewal",
    remediation: "Negotiate for a 90-day advance notice requirement before any automatic renewal takes effect.",
    policyRefs: ["Contract Policy §2.1"],
    page: 2,
    excerpt: "This Agreement shall automatically renew for successive one-year periods unless...",
  },
  {
    id: "f3",
    clauseId: "c3",
    title: "Broad Indemnification Requirement",
    description: "The indemnification clause is overly broad, requiring indemnification for the other party's own negligence.",
    severity: "high",
    category: "Indemnification",
    remediation: "Limit indemnification to third-party claims arising from the indemnifying party's own acts or omissions.",
    policyRefs: ["Legal Guidelines §4.5", "Insurance Requirements"],
    page: 1,
    excerpt: "Client agrees to indemnify and hold harmless Provider from any and all claims...",
  },
  {
    id: "f4",
    clauseId: "c4",
    title: "Unfavorable Governing Law",
    description: "The governing law jurisdiction may be disadvantageous and increases legal costs if disputes arise.",
    severity: "low",
    category: "Dispute Resolution",
    remediation: "Request change to a neutral jurisdiction or one more favorable to your organization.",
    policyRefs: ["Legal Policy §1.3"],
    page: 3,
    excerpt: "This Agreement shall be governed by the laws of the State of Delaware...",
  },
  {
    id: "f5",
    clauseId: "c5",
    title: "Missing Data Protection Provisions",
    description: "The contract lacks adequate data protection and privacy provisions required for handling personal information.",
    severity: "high",
    category: "Data Privacy",
    remediation: "Include comprehensive data protection addendum covering GDPR, CCPA, and other applicable regulations.",
    policyRefs: ["Data Privacy Policy", "GDPR Compliance Guide"],
    page: 2,
    excerpt: "Provider may collect and process data as necessary for the performance of services...",
  },
  {
    id: "f6",
    clauseId: "c6",
    title: "Vague Termination Rights",
    description: "Termination provisions are unclear and may not provide adequate exit rights in case of service issues.",
    severity: "medium",
    category: "Termination",
    remediation: "Clarify termination for convenience and termination for cause provisions with specific timelines.",
    policyRefs: ["Contract Policy §5.2"],
    page: 3,
    excerpt: "Either party may terminate this Agreement upon written notice to the other party...",
  },
  {
    id: "f7",
    clauseId: "c7",
    title: "IP Assignment Concerns",
    description: "The intellectual property clause may inadvertently assign valuable IP rights to the vendor.",
    severity: "medium",
    category: "Intellectual Property",
    remediation: "Ensure clear retention of pre-existing IP and limit any assignment to deliverables specifically commissioned.",
    policyRefs: ["IP Policy §2.4"],
    page: 1,
    excerpt: "All intellectual property developed in connection with this Agreement shall be owned by...",
  },
];

export const mockClauses: Clause[] = mockFindings.map((f, i) => ({
  id: f.clauseId,
  text: f.excerpt,
  page: f.page,
  category: f.category,
}));

export const mockSummary: RiskSummary = {
  overallScore: 68,
  status: "Moderate",
  totalFindings: mockFindings.length,
  findingsBySeverity: {
    low: mockFindings.filter((f) => f.severity === "low").length,
    medium: mockFindings.filter((f) => f.severity === "medium").length,
    high: mockFindings.filter((f) => f.severity === "high").length,
  },
  breakdown: [
    { category: "Liability", score: 85, findingsCount: 1 },
    { category: "Indemnification", score: 80, findingsCount: 1 },
    { category: "Data Privacy", score: 75, findingsCount: 1 },
    { category: "Term & Renewal", score: 55, findingsCount: 1 },
    { category: "Termination", score: 50, findingsCount: 1 },
    { category: "Intellectual Property", score: 45, findingsCount: 1 },
    { category: "Dispute Resolution", score: 25, findingsCount: 1 },
  ],
};

export function simulateProcessing(
  onProgress: (stage: string, processed: number, total: number) => void,
  onComplete: () => void
) {
  const stages = [
    { name: "extracting", duration: 1500, total: 100 },
    { name: "segmenting", duration: 2000, total: 15 },
    { name: "analyzing", duration: 3000, total: 15 },
  ];

  let currentStage = 0;

  function processStage() {
    if (currentStage >= stages.length) {
      onComplete();
      return;
    }

    const stage = stages[currentStage];
    let processed = 0;
    const increment = stage.total / 10;
    const interval = stage.duration / 10;

    const timer = setInterval(() => {
      processed = Math.min(processed + increment, stage.total);
      onProgress(stage.name, Math.floor(processed), stage.total);

      if (processed >= stage.total) {
        clearInterval(timer);
        currentStage++;
        setTimeout(processStage, 300);
      }
    }, interval);
  }

  processStage();
}
