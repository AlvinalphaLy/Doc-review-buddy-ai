import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSearch, Shield, Clock, Zap } from "lucide-react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { extractPdfText } from "@/lib/extract/pdf";
import { useReviewStore } from "@/lib/store";
import type { DocumentMeta } from "@/types/review";

const Index = () => {
  const navigate = useNavigate();
  const { setDocument, setPdfUrl, setText, setProgress } = useReviewStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const handleFileAccepted = async (file: File) => {
    setIsProcessing(true);
    setProcessingStatus("Reading document...");

    try {
      const fileType = file.name.endsWith(".pdf")
        ? "pdf"
        : file.name.endsWith(".docx")
        ? "docx"
        : "txt";

      // Create document meta
      const docMeta: DocumentMeta = {
        id: crypto.randomUUID(),
        name: file.name,
        type: fileType,
        size: file.size,
        uploadedAt: new Date(),
      };

      // Create object URL for PDF viewer
      const pdfUrl = URL.createObjectURL(file);
      setPdfUrl(pdfUrl);

      // Extract text based on file type
      setProcessingStatus("Extracting text...");
      let extractedText = "";
      let pageCount = 1;

      if (fileType === "pdf") {
        const result = await extractPdfText(file);
        extractedText = result.text;
        pageCount = result.pageCount;
      } else if (fileType === "txt") {
        extractedText = await file.text();
      } else {
        // For DOCX, we'll handle it as plain text for now
        // In production, you'd use mammoth.js
        extractedText = await file.text();
      }

      docMeta.pageCount = pageCount;
      setDocument(docMeta);
      setText(extractedText);
      setProgress({ stage: "idle", processed: 0, total: 0 });

      // Navigate to review page
      navigate(`/review/${docMeta.id}`);
    } catch (error) {
      console.error("Error processing file:", error);
      setProcessingStatus("Error processing file. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FileSearch className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">DocReviewer</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Contract Analysis</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="container py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl font-bold tracking-tight mb-4 animate-fade-in-up">
            Analyze Documents for{" "}
            <span className="text-primary">Compliance Risks</span>
          </h2>
          <p className="text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Upload contracts, agreements, or policies. Get instant risk assessment,
            clause analysis, and actionable recommendations.
          </p>
        </div>

        {/* Upload area */}
        <div className="mb-16 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {isProcessing ? (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-lg font-medium">{processingStatus}</p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a moment...
              </p>
            </div>
          ) : (
            <UploadDropzone onFileAccepted={handleFileAccepted} />
          )}
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              icon: Shield,
              title: "Risk Detection",
              description:
                "Automatically identify liability clauses, unfavorable terms, and compliance gaps.",
            },
            {
              icon: Zap,
              title: "Instant Analysis",
              description:
                "Get comprehensive review results in seconds, not hours.",
            },
            {
              icon: Clock,
              title: "Actionable Insights",
              description:
                "Receive specific recommendations and policy references for each finding.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="bg-card border rounded-xl p-6 animate-fade-in-up"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>DocReviewer — AI-Powered Document Compliance Analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
