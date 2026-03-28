"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeepDiveChatProps {
  discoveryProfile: Record<string, any>;
  onComplete: (answers: Array<{ question: string; answer: string }>) => void;
  onSkip: () => void;
}

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

export function DeepDiveChat({
  discoveryProfile,
  onComplete,
  onSkip,
}: DeepDiveChatProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [answers, setAnswers] = useState<
    Array<{ question: string; answer: string }>
  >([]);
  const [allAnswered, setAllAnswered] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch follow-up questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/strategy/deep-dive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: discoveryProfile }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch questions");
        }
        setQuestions(data.questions);
        // Show first question as a chat message
        setMessages([{ role: "assistant", content: data.questions[0] }]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load questions";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [discoveryProfile]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const currentQ = questions[currentQuestionIndex];
    const answer = inputValue.trim();

    // Add user message
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: answer },
    ];

    const newAnswers = [...answers, { question: currentQ, answer }];
    setAnswers(newAnswers);
    setInputValue("");

    const nextIdx = currentQuestionIndex + 1;

    if (nextIdx < questions.length) {
      // Add next question
      newMessages.push({ role: "assistant", content: questions[nextIdx] });
      setMessages(newMessages);
      setCurrentQuestionIndex(nextIdx);
    } else {
      // All questions answered
      setMessages(newMessages);
      setAllAnswered(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Loading state — pulsing dots
  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4 py-12">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-ig-pink"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Preparing follow-up questions...
        </p>
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline"
        >
          Skip deep dive
        </button>
      </div>
    );
  }

  // Error state — allow skip
  if (error) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-destructive text-center">{error}</p>
        <Button onClick={onSkip} variant="outline" size="sm">
          Skip and generate strategy
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Quick Deep Dive</h3>
        <p className="text-xs text-muted-foreground">
          Answer a few follow-up questions for a more targeted strategy.{" "}
          <button
            onClick={onSkip}
            className="text-muted-foreground/60 hover:text-muted-foreground underline"
          >
            Skip
          </button>
        </p>
      </div>

      {/* Chat area */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto px-1 py-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] text-sm ${
                  msg.role === "assistant"
                    ? "bg-muted/50 rounded-2xl rounded-tl-sm p-3"
                    : "bg-ig-pink/10 rounded-2xl rounded-tr-sm p-3 ml-auto"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input area or generate button */}
      {allAnswered ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 pt-2"
        >
          <Button
            onClick={() => onComplete(answers)}
            size="lg"
            className="px-8 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate My Strategy
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <div className="flex items-end gap-2 border rounded-xl p-2 bg-background">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 py-1.5 px-1 max-h-[120px]"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="icon"
            variant="ghost"
            className="shrink-0 h-8 w-8 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Progress indicator */}
      {!allAnswered && questions.length > 0 && (
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      )}
    </div>
  );
}
