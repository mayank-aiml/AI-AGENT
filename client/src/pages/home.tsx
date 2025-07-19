import { useState } from "react";
import DocumentSidebar from "@/components/DocumentSidebar";
import ChatInterface from "@/components/ChatInterface";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Upload, Bot } from "lucide-react";

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isMobileUploadOpen, setIsMobileUploadOpen] = useState(false);

  const { data: conversations } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/documents/stats"],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-lg p-2">
              <Bot className="text-white text-xl" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">DocuMind</h1>
              <p className="text-sm text-slate-500">Internal Docs Q&A Agent</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="hidden md:flex items-center space-x-2"
              onClick={() => setIsMobileUploadOpen(true)}
            >
              <Upload size={16} />
              <span>Upload Docs</span>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
              <span className="hidden md:block text-slate-700 font-medium">John Doe</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar - Document Management */}
          <div className="lg:col-span-1">
            <DocumentSidebar stats={stats} />
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <ChatInterface 
              conversationId={currentConversationId}
              onConversationChange={setCurrentConversationId}
              stats={stats}
            />
          </div>
          
        </div>
      </div>

      {/* Mobile Upload Button */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <Button 
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={() => setIsMobileUploadOpen(true)}
        >
          <Upload size={20} />
        </Button>
      </div>
    </div>
  );
}
