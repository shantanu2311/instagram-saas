"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface QueueItem {
  id: string;
  calendarSlotDate: string;
  pillar: string;
  contentType: "image" | "carousel" | "reel";
  topic: string;
  headline: string;
  caption: string;
  hashtags: string[];
  qualityScore: number;
  suggestedTime: string;
  status: "generating" | "pending_approval" | "approved" | "posted" | "rejected" | "failed";
  createdAt: string;
  scheduledFor: string; // ISO datetime
  error?: string;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

interface QueueState {
  items: QueueItem[];
  batchProgress: BatchProgress | null;
  // Actions
  addItem: (item: QueueItem) => void;
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  removeItem: (id: string) => void;
  approveItem: (id: string) => void;
  rejectItem: (id: string) => void;
  approveAll: () => void;
  setBatchProgress: (progress: BatchProgress | null) => void;
  clearPosted: () => void;
  resetStuck: () => void;
  reset: () => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set) => ({
      items: [],
      batchProgress: null,

      addItem: (item) =>
        set((s) => ({ items: [...s.items, item] })),

      updateItem: (id, updates) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      approveItem: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: "approved" as const } : i
          ),
        })),

      rejectItem: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: "rejected" as const } : i
          ),
        })),

      approveAll: () =>
        set((s) => ({
          items: s.items.map((i) =>
            i.status === "pending_approval"
              ? { ...i, status: "approved" as const }
              : i
          ),
        })),

      setBatchProgress: (progress) => set({ batchProgress: progress }),

      clearPosted: () =>
        set((s) => ({
          items: s.items.filter((i) => i.status !== "posted"),
        })),

      resetStuck: () =>
        set((s) => ({
          items: s.items.map((i) =>
            i.status === "generating"
              ? { ...i, status: "failed" as const, error: "Generation interrupted — retry from Strategy." }
              : i
          ),
          batchProgress: s.batchProgress ? { ...s.batchProgress, inProgress: false } : null,
        })),

      reset: () => set({ items: [], batchProgress: null }),
    }),
    {
      name: "igcreator-queue",
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const val = sessionStorage.getItem(name);
          return val ? JSON.parse(val) : null;
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(name);
          }
        },
      },
    }
  )
);
