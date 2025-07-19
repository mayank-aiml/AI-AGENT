import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackButtonsProps {
  messageId: number;
}

export default function FeedbackButtons({ messageId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const { toast } = useToast();

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    toast({
      title: "Thanks for your feedback!",
      description: type === "up" ? "Glad I could help!" : "I'll try to improve my responses.",
    });
    
    // Here you could send feedback to your backend
    console.log(`Feedback for message ${messageId}: ${type}`);
  };

  return (
    <div className="flex items-center space-x-2 mt-2">
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 hover:bg-slate-100 transition-colors ${
          feedback === "up" ? "bg-green-100 text-green-600" : "text-slate-400 hover:text-slate-600"
        }`}
        onClick={() => handleFeedback("up")}
        disabled={feedback !== null}
      >
        <ThumbsUp size={14} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 hover:bg-slate-100 transition-colors ${
          feedback === "down" ? "bg-red-100 text-red-600" : "text-slate-400 hover:text-slate-600"
        }`}
        onClick={() => handleFeedback("down")}
        disabled={feedback !== null}
      >
        <ThumbsDown size={14} />
      </Button>
    </div>
  );
}