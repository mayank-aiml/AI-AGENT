import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import FileUpload from "./FileUpload";
import { FileText, CheckCircle, Clock, ArrowRight, TrendingUp } from "lucide-react";
import FileTypeIcon, { getFileIconBg, getFileTypeEmoji } from "./FileTypeIcon";

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

  const indexingProgress = stats?.totalDocs > 0 ? 
    Math.round((stats.indexedDocs / stats.totalDocs) * 100) : 0;

  return (
    <Card className="shadow-lg rounded-xl border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="text-white" size={16} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Document Library</h2>
        </div>
        
        {/* Upload Area */}
        <FileUpload />

        {/* Document Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 text-center border border-slate-200 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">
              {stats?.totalDocs || 0}
            </div>
            <div className="text-xs text-slate-500">📚 Documents</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {stats?.indexedDocs || 0}
            </div>
            <div className="text-xs text-slate-500">✅ Indexed</div>
          </div>
        </div>

        {/* Indexing Progress */}
        {(stats?.totalDocs || 0) > 0 && (
          <div className="mb-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 flex items-center">
                <TrendingUp size={14} className="mr-1 text-blue-600" />
                Indexing Progress
              </span>
              <span className="text-sm font-bold text-blue-700">
                {stats.indexedDocs} of {stats.totalDocs}
              </span>
            </div>
            <Progress 
              value={indexingProgress} 
              className="h-2 bg-blue-100" 
            />
            <p className="text-xs text-slate-500 mt-2">
              {indexingProgress}% complete • {stats.totalDocs - stats.indexedDocs} documents processing
            </p>
          </div>
        )}

        {/* Recent Documents */}
        <div className="flex items-center space-x-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Recent Documents</h3>
          <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
          <span className="text-xs text-slate-500">{documents?.length || 0} total</span>
        </div>
        <div className="space-y-3">
          {documents && documents.length > 0 ? (
            documents.slice(0, 5).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 rounded-xl cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:shadow-sm"
              >
                <div className={`w-10 h-10 ${getFileIconBg(doc.fileType)} rounded-xl border flex items-center justify-center shadow-sm`}>
                  <span className="text-lg">{getFileTypeEmoji(doc.fileType)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.originalName}
                    </p>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-medium">
                      {doc.fileType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {doc.isIndexed ? (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="w-3 h-3 text-yellow-600 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">No documents uploaded yet</p>
              <p className="text-xs text-slate-500">Upload your first document to get started</p>
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
