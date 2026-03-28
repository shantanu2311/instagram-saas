"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/page-transition";
import {
  CalendarHeart,
  Plus,
  Pencil,
  Trash2,
  Repeat,
  Loader2,
  Rocket,
  PartyPopper,
  Trophy,
  Users,
  Sun,
  X,
} from "lucide-react";

interface BrandMoment {
  id: string;
  title: string;
  description: string | null;
  date: string;
  type: string;
  isRecurring: boolean;
  color: string | null;
  createdAt: string;
}

const momentTypes = [
  {
    value: "launch",
    label: "Launch",
    bgClass: "bg-ig-pink/10",
    textClass: "text-ig-pink",
    icon: Rocket,
  },
  {
    value: "event",
    label: "Event",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-500",
    icon: PartyPopper,
  },
  {
    value: "milestone",
    label: "Milestone",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-500",
    icon: Trophy,
  },
  {
    value: "collaboration",
    label: "Collaboration",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-500",
    icon: Users,
  },
  {
    value: "seasonal",
    label: "Seasonal",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-500",
    icon: Sun,
  },
];

function getMomentType(value: string) {
  return momentTypes.find((t) => t.value === value) || momentTypes[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const emptyForm = {
  title: "",
  description: "",
  date: "",
  type: "launch",
  isRecurring: false,
};

export default function MomentsPage() {
  const [moments, setMoments] = useState<BrandMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchMoments = useCallback(() => {
    fetch("/api/moments")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMoments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMoments();
  }, [fetchMoments]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(moment: BrandMoment) {
    setForm({
      title: moment.title,
      description: moment.description || "",
      date: moment.date.slice(0, 10),
      type: moment.type,
      isRecurring: moment.isRecurring,
    });
    setEditingId(moment.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.type) return;
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description || null,
      date: form.date,
      type: form.type,
      isRecurring: form.isRecurring,
    };

    try {
      const url = editingId ? `/api/moments/${editingId}` : "/api/moments";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        fetchMoments();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/moments/${id}`, { method: "DELETE" });
      if (res.ok) fetchMoments();
    } catch {
      // ignore
    }
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Brand Moments</h1>
            <p className="text-sm text-muted-foreground">
              Track launches, events, and milestones for your content calendar.
            </p>
          </div>
          <Button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            variant={showForm ? "outline" : "default"}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Moment
              </>
            )}
          </Button>
        </div>

        {/* Inline Add/Edit Form */}
        {showForm && (
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {editingId ? "Edit Moment" : "Add New Moment"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. Summer Collection Launch"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Type *
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {momentTypes.map((t) => {
                        const Icon = t.icon;
                        const selected = form.type === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, type: t.value }))
                            }
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                              selected
                                ? `border-border bg-muted/60 text-foreground shadow-sm`
                                : `border-transparent text-muted-foreground/60 hover:text-muted-foreground`
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recurring */}
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isRecurring}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            isRecurring: e.target.checked,
                          }))
                        }
                        className="rounded border-border"
                      />
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Recurring annually
                      </span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="What's happening and why it matters for content..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      saving || !form.title.trim() || !form.date || !form.type
                    }
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingId ? "Update" : "Add Moment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && moments.length === 0 && !showForm && (
          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                  <CalendarHeart className="h-6 w-6 text-purple-500" />
                </div>
                <p className="text-sm font-medium">No brand moments yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Add launches, events, and milestones so your content calendar
                  reflects what matters.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Moment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {!loading && moments.length > 0 && (
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border" />

            <div className="space-y-4">
              {moments.map((moment) => {
                const mt = getMomentType(moment.type);
                const Icon = mt.icon;
                const isPast = new Date(moment.date) < new Date();

                return (
                  <div key={moment.id} className="relative">
                    {/* Dot */}
                    <div
                      className={`absolute -left-6 top-4 h-5 w-5 rounded-full border-2 border-background flex items-center justify-center ${
                        isPast ? "bg-muted" : mt.bgClass
                      }`}
                    >
                      <Icon
                        className={`h-2.5 w-2.5 ${
                          isPast
                            ? "text-muted-foreground"
                            : mt.textClass
                        }`}
                      />
                    </div>

                    <Card
                      className={`border-border/40 ${
                        isPast ? "opacity-60" : ""
                      }`}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">
                                {moment.title}
                              </h3>
                              <Badge className={`text-[10px] ${mt.bgClass} ${mt.textClass}`}>
                                {mt.label}
                              </Badge>
                              {moment.isRecurring && (
                                <Repeat className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(moment.date)}
                            </p>
                            {moment.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                                {moment.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEdit(moment)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(moment.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
