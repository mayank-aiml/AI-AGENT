import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, X, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FileUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data, file) => {
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and is being processed.`,
      });
      setUploadingFiles(prev => prev.filter(name => name !== file.name));
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/documents/stats"] });
    },
    onError: (error: Error, file) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadingFiles(prev => prev.filter(name => name !== file.name));
    },
  });

  const handleFiles = (files: FileList) => {
    const allowedTypes = [".docx", ".txt", ".md"]; // Temporarily removed PDF
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach(file => {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not supported. Please upload DOCX, TXT, or MD files.`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        return;
      }

      setUploadingFiles(prev => [...prev, file.name]);
      uploadMutation.mutate(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg"
            : "border-slate-300 hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:shadow-md"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CloudUpload className={`w-6 h-6 ${isDragOver ? 'text-primary' : 'text-slate-500'} transition-colors`} />
        </div>
        <p className="text-slate-700 font-medium mb-1">Drop files here</p>
        <p className="text-sm text-slate-500 mb-2">or click to browse</p>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">📝 DOCX</span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">📄 TXT</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">📋 MD</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".docx,.txt,.md"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((filename) => (
            <div key={filename} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
              <FileText className="w-4 h-4 text-slate-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{filename}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500">Processing...</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
