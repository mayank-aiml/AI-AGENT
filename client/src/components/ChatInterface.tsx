import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, Loader2, FileText, Shield, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FeedbackButtons from "./FeedbackButtons";
import TypingIndicator from "./TypingIndicator";
import { getFileTypeEmoji } from "./FileTypeIcon";

interface ChatInterfaceProps {
  conversationId: number | null;
  onConversationChange: (id: number) => void;
  stats?: {
    totalDocs: number;
    indexedDocs: number;
  };
}

interface Message {
  id: number;
  content: string;
  role: "user" | "assistant";
  sources?: string;
  createdAt: string;
}

interface Source {
  id: number;
  originalName: string;
  fileType: string;
}

export default function ChatInterface({ 
  conversationId, 
  onConversationChange,
  stats 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get messages for current conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", {
        title: null,
      });
      return response.json();
    },
    onSuccess: (conversation) => {
      onConversationChange(conversation.id);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      setIsTyping(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const messageContent = message.trim();
    setMessage("");
    setIsTyping(true);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      let currentConversationId = conversationId;

      // Create conversation if none exists
      if (!currentConversationId) {
        const conversation = await createConversationMutation.mutateAsync();
        currentConversationId = conversation.id;
      }

      // Send message
      await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        content: messageContent,
      });
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const parseSources = (sourcesJson: string | null): Source[] => {
    if (!sourcesJson) return [];
    try {
      return JSON.parse(sourcesJson);
    } catch {
      return [];
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const quickPrompts = [
    { text: "What's our refund policy?", icon: "💰" },
    { text: "How do I apply for leave?", icon: "🏖️" },
    { text: "Who handles reimbursements?", icon: "🧾" },
    { text: "Remote work guidelines", icon: "🏠" },
    { text: "Expense policy details", icon: "💳" },
  ];

  const handleQuickPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    
    setMessage("");
    setIsTyping(true);

    try {
      let currentConversationId = conversationId;

      // Create conversation if none exists
      if (!currentConversationId) {
        const conversation = await createConversationMutation.mutateAsync();
        currentConversationId = conversation.id;
      }

      // Send message
      await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        content: promptText,
      });
    } catch (error) {
      setIsTyping(false);
      console.error("Error sending quick prompt:", error);
    }
  };

  return (
    <Card className="h-[700px] flex flex-col shadow-lg rounded-xl border-slate-200">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="text-primary" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Ask DocuMind</h2>
            </div>
            <p className="text-sm text-slate-500">Get answers from your team's knowledge base</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 font-medium">
              {stats?.indexedDocs || 0} docs indexed
            </span>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!conversationId && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="text-white" size={16} />
            </div>
            <div className="flex-1">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl rounded-tl-md p-4 shadow-sm border border-slate-200">
                <p className="text-slate-700">
                  👋 Hi! I'm DocuMind, your internal docs assistant. Ask me anything about your team's documents, policies, or procedures. I can help you find information quickly!
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-2">Just now</p>
            </div>
          </div>
        )}

        {messages?.map((msg: Message) => (
          <div key={msg.id} className="animate-fade-in">
            {msg.role === "user" ? (
              <div className="flex items-start space-x-3 justify-end">
                <div className="flex-1 flex justify-end">
                  <div className="bg-primary rounded-2xl rounded-tr-md p-4 max-w-md shadow-sm">
                    <p className="text-white">{msg.content}</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User size={16} className="text-slate-600" />
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="text-white" size={16} />
                </div>
                <div className="flex-1">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl rounded-tl-md p-4 shadow-sm border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Source Citations */}
                    {msg.sources && (
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <p className="text-xs text-slate-500 mb-2">📚 Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {parseSources(msg.sources).map((source, index) => (
                            <div
                              key={`${source.id}-${index}`}
                              className="inline-flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1 hover:bg-slate-50 cursor-pointer shadow-sm transition-all hover:shadow-md"
                            >
                              <span className="text-sm">{getFileTypeEmoji(source.fileType)}</span>
                              <span className="text-xs text-slate-700">{source.originalName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      {formatTimeAgo(msg.createdAt)}
                    </p>
                    <FeedbackButtons messageId={msg.id} />
                  </div>
                </div>
              </div>
            )}
            {msg.role === "user" && (
              <p className="text-xs text-slate-500 mt-2 text-right">
                {formatTimeAgo(msg.createdAt)}
              </p>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="border-t border-slate-200 p-6">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your team's documents..."
                className="min-h-[44px] max-h-[120px] resize-none pr-12"
                rows={1}
              />
              <Button
                size="sm"
                className="absolute right-2 bottom-2 w-8 h-8 p-0"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                className="text-xs h-8 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-all hover:shadow-sm"
                onClick={() => handleQuickPrompt(prompt.text)}
              >
                <span className="mr-1">{prompt.icon}</span>
                "{prompt.text}"
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">💡 Click any suggestion above to get started</span>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <Shield size={12} />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
