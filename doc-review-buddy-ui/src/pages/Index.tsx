import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSearch, Shield, Clock, Zap } from "lucide-react";
import { UploadDropzone } from "@/components/UploadDropzone";
import { extractPdfText } from "@/lib/extract/pdf";
import { createDoc, sendText } from "@/lib/api";
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

      // Create backend docId (this becomes the document id used in /review/:id)
      const { docId } = await createDoc();

      // Create document meta
      const docMeta: DocumentMeta = {
        id: docId,
        name: file.name,
        type: fileType,
        size: file.size,
        uploadedAt: new Date(),
      };

      // Create object URL for PDF viewer (PDF only)
      if (fileType === "pdf") {
        const pdfUrl = URL.createObjectURL(file);
        setPdfUrl(pdfUrl);
      } else {
        setPdfUrl(null);
      }

      // Extract text based on file type
      setProcessingStatus("Extracting text...");
      let extractedText = "";
      let pageCount = 1;

      if (fileType === "pdf") {
        const result = await extractPdfText(file, (processed, total) => {
          setProgress({ stage: "extracting", processed, total });
        });
        extractedText = result.text;
        pageCount = result.pageCount;
      } else if (fileType === "txt") {
        extractedText = await file.text();
      } else {
        // DOCX: MVP fallback (for production use mammoth.js)
        extractedText = await file.text();
      }

      docMeta.pageCount = pageCount;

      // Store locally for UI rendering
      setDocument(docMeta);
      setText(extractedText);
      setProgress({ stage: "idle", processed: 0, total: 0 });

      // Upload extracted text to backend (no R2, no cost)
      setProcessingStatus("Uploading for review...");
      await sendText(docMeta.id, extractedText);

      // Navigate to review page (Review page will call /run + /results)
      navigate(`/review/${docMeta.id}`);
      setIsProcessing(false);
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">DocReviewer</h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Document Compliance Analysis
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Accurate</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Review documents with AI precision
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload contracts, policies, or agreements. Our AI agents analyze
              clauses, identify risks, and provide actionable compliance
              insights.
            </p>
          </div>

          <UploadDropzone
            onFileAccepted={handleFileAccepted}
            isProcessing={isProcessing}
          />

          {isProcessing && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {processingStatus}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-xl border bg-card">
              <Shield className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Risk Detection</h3>
              <p className="text-sm text-muted-foreground">
                Identify risky clauses and potential compliance issues
                automatically.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <FileSearch className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Clause Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Break down documents into clauses with severity ratings.
              </p>
            </div>

            <div className="p-6 rounded-xl border bg-card">
              <Zap className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Export Reports</h3>
              <p className="text-sm text-muted-foreground">
                Generate summaries and export findings for review and auditing.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          <p>DocReviewer — AI-Powered Document Compliance Analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
