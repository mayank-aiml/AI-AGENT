import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FileUpload from "./FileUpload";
import { FileText, CheckCircle, Clock, ArrowRight } from "lucide-react";

interface DocumentSidebarProps {
  stats?: {
    totalDocs: number;
    indexedDocs: number;
  };
}

export default function DocumentSidebar({ stats }: DocumentSidebarProps) {
  const { data: documents } = useQuery({
    queryKey: ["/api/documents"],
  });

  const getFileIcon = (fileType: string) => {
    const iconClass = "text-sm";
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className={`${iconClass} text-red-600`} />;
      case "docx":
        return <FileText className={`${iconClass} text-blue-600`} />;
      case "txt":
      case "md":
        return <FileText className={`${iconClass} text-green-600`} />;
      default:
        return <FileText className={`${iconClass} text-gray-600`} />;
    }
  };

  const getFileIconBg = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "bg-red-100";
      case "docx":
        return "bg-blue-100";
      case "txt":
      case "md":
        return "bg-green-100";
      default:
        return "bg-gray-100";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Document Library</h2>
        
        {/* Upload Area */}
        <FileUpload />

        {/* Document Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-slate-900">
              {stats?.totalDocs || 0}
            </div>
            <div className="text-xs text-slate-500">Documents</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats?.indexedDocs || 0}
            </div>
            <div className="text-xs text-slate-500">Indexed</div>
          </div>
        </div>

        {/* Recent Documents */}
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Documents</h3>
        <div className="space-y-2">
          {documents && documents.length > 0 ? (
            documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <div className={`w-8 h-8 ${getFileIconBg(doc.fileType)} rounded flex items-center justify-center`}>
                  {getFileIcon(doc.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {doc.originalName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {doc.isIndexed ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-yellow-500 animate-pulse" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No documents uploaded yet</p>
              <p className="text-xs text-slate-400">Upload your first document to get started</p>
            </div>
          )}
        </div>

        {documents && documents.length > 5 && (
          <Button variant="ghost" className="w-full mt-4 text-sm">
            View All Documents <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
