"use client";

import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  gradient: string;
}

const templates: Template[] = [
  { id: "fact_card", name: "Fact Card", gradient: "from-ig-pink to-ig-orange" },
  {
    id: "stat_highlight",
    name: "Stat Highlight",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "quote_post",
    name: "Quote Post",
    gradient: "from-ig-orange to-amber-400",
  },
  {
    id: "listicle",
    name: "Listicle",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "before_after",
    name: "Before/After",
    gradient: "from-rose-500 to-ig-pink",
  },
  {
    id: "question_hook",
    name: "Question Hook",
    gradient: "from-ig-pink to-ig-purple",
  },
];

interface TemplateGalleryProps {
  selected?: string;
  onSelect: (id: string) => void;
}

export function TemplateGallery({ selected, onSelect }: TemplateGalleryProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "shrink-0 flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all w-[80px]",
            selected === t.id
              ? "border-ig-pink bg-ig-pink/10"
              : "border-border/40 hover:border-ig-pink/30"
          )}
        >
          <div
            className={`w-full aspect-[4/5] rounded-md bg-gradient-to-br ${t.gradient} flex items-center justify-center`}
          >
            <div className="w-5 h-0.5 rounded-full bg-white/60" />
          </div>
          <span className="text-[10px] font-medium text-center leading-tight truncate w-full">
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}
