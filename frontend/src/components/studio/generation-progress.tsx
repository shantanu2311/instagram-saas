"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const progressSteps = [
  "Crafting caption...",
  "Designing layout...",
  "Generating image...",
  "Running quality check...",
];

interface GenerationProgressProps {
  isGenerating: boolean;
}

export function GenerationProgress({ isGenerating }: GenerationProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    setCurrentStep(0);
    setCompletedSteps([]);

    const timers: NodeJS.Timeout[] = [];

    progressSteps.forEach((_, i) => {
      if (i > 0) {
        timers.push(
          setTimeout(() => {
            setCompletedSteps((prev) => [...prev, i - 1]);
            setCurrentStep(i);
          }, i * 800)
        );
      }
    });

    // Complete the last step
    timers.push(
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, progressSteps.length - 1]);
      }, progressSteps.length * 800)
    );

    return () => timers.forEach(clearTimeout);
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div className="space-y-2 py-2">
      <AnimatePresence mode="wait">
        {progressSteps.map((step, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.2 }}
            className="flex items-center gap-2.5"
          >
            {completedSteps.includes(i) ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : currentStep === i ? (
              <Loader2 className="h-4 w-4 text-ig-pink animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-border/60 shrink-0" />
            )}
            <span
              className={`text-xs ${
                completedSteps.includes(i)
                  ? "text-muted-foreground line-through"
                  : currentStep === i
                  ? "text-foreground font-medium"
                  : "text-muted-foreground/50"
              }`}
            >
              {step}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
