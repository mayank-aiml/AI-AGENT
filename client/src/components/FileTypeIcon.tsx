import { FileText, File, Code } from "lucide-react";

interface FileTypeIconProps {
  fileType: string;
  size?: number;
  className?: string;
}

export default function FileTypeIcon({ fileType, size = 16, className = "" }: FileTypeIconProps) {
  const getFileIcon = () => {
    const baseClass = `${className}`;
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className={`${baseClass} text-red-600`} size={size} />;
      case "docx":
      case "doc":
        return <FileText className={`${baseClass} text-blue-600`} size={size} />;
      case "txt":
        return <File className={`${baseClass} text-gray-600`} size={size} />;
      case "md":
        return <Code className={`${baseClass} text-green-600`} size={size} />;
      default:
        return <FileText className={`${baseClass} text-gray-600`} size={size} />;
    }
  };

  return getFileIcon();
}

export function getFileIconBg(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "bg-red-50 border-red-200";
    case "docx":
    case "doc":
      return "bg-blue-50 border-blue-200";
    case "txt":
      return "bg-gray-50 border-gray-200";
    case "md":
      return "bg-green-50 border-green-200";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

export function getFileTypeEmoji(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return "📄";
    case "docx":
    case "doc":
      return "📝";
    case "txt":
      return "📃";
    case "md":
      return "📋";
    default:
      return "📄";
  }
}