import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, File, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileAccepted: (file: File) => void;
  isProcessing?: boolean;
}

const acceptedTypes = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

export function UploadDropzone({ onFileAccepted, isProcessing }: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled: isProcessing,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "dropzone flex flex-col items-center justify-center text-center cursor-pointer",
          isDragActive && "active",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="mb-6">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          
          {isDragActive ? (
            <p className="text-lg font-medium text-primary">Drop your document here</p>
          ) : (
            <>
              <p className="text-lg font-medium text-foreground mb-2">
                Drag & drop your document
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <File className="w-4 h-4" />
            <span>DOCX</span>
          </div>
          <div className="flex items-center gap-1.5">
            <File className="w-4 h-4" />
            <span>TXT</span>
          </div>
          <span className="text-border">•</span>
          <span>Max 20MB</span>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-risk-high-bg border border-risk-high/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-risk-high shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-risk-high">File not accepted</p>
            <p className="text-sm text-muted-foreground mt-1">
              {fileRejections[0].errors[0].message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
