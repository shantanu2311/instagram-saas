"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bookmark,
  Plus,
  X,
  ExternalLink,
  Wand2,
  Pencil,
  Trash2,
  Archive,
  Lightbulb,
  Link2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Idea {
  id: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  contentType: string | null;
  pillar: string | null;
  notes: string | null;
  status: string;
  tags: string[];
  usedAt: string | null;
  createdAt: string;
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
  { value: "archived", label: "Archived" },
];

const emptyForm = {
  title: "",
  sourceUrl: "",
  contentType: "",
  pillar: "",
  notes: "",
};

export default function InspirationPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchIdeas = useCallback(() => {
    setLoading(true);
    const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    fetch(`/api/ideas${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setIdeas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(idea: Idea) {
    setForm({
      title: idea.title,
      sourceUrl: idea.sourceUrl || "",
      contentType: idea.contentType || "",
      pillar: idea.pillar || "",
      notes: idea.notes || "",
    });
    setEditingId(idea.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const url = editingId ? `/api/ideas/${editingId}` : "/api/ideas";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          sourceUrl: form.sourceUrl || null,
          contentType: form.contentType || null,
          pillar: form.pillar || null,
          notes: form.notes || null,
          sourceType: form.sourceUrl ? "article" : "manual",
        }),
      });
      if (res.ok) {
        resetForm();
        fetchIdeas();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/ideas/${id}`, { method: "DELETE" });
    fetchIdeas();
  }

  async function handleArchive(id: string) {
    await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    fetchIdeas();
  }

  async function handleMarkUsed(id: string) {
    await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "used" }),
    });
    fetchIdeas();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Inspiration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Save ideas, links, and notes for future content
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg ig-gradient px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Idea"}
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="idea-title">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="idea-title"
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g., Behind-the-scenes office tour"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="idea-url">
                    Source URL
                  </label>
                  <input
                    id="idea-url"
                    type="url"
                    value={form.sourceUrl}
                    onChange={(e) =>
                      setForm({ ...form, sourceUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="idea-type">
                    Content Type
                  </label>
                  <select
                    id="idea-type"
                    value={form.contentType}
                    onChange={(e) =>
                      setForm({ ...form, contentType: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="image">Image</option>
                    <option value="carousel">Carousel</option>
                    <option value="reel">Reel</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="idea-pillar">
                    Pillar
                  </label>
                  <input
                    id="idea-pillar"
                    type="text"
                    value={form.pillar}
                    onChange={(e) =>
                      setForm({ ...form, pillar: e.target.value })
                    }
                    placeholder="e.g., education, entertainment"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="idea-notes">
                  Notes
                </label>
                <textarea
                  id="idea-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional notes or context..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="rounded-lg ig-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Idea"
                      : "Save Idea"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter pills */}
      <div className="flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? "border-border bg-muted/60 text-foreground shadow-sm"
                : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-36 rounded-xl bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && ideas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No ideas yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save content ideas, links, and inspiration for later
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg ig-gradient px-4 py-2 text-sm font-medium text-white"
            >
              Add Your First Idea
            </button>
          </CardContent>
        </Card>
      )}

      {/* Ideas grid */}
      {!loading && ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => (
            <Card
              key={idea.id}
              className={`overflow-hidden transition-opacity ${
                idea.status === "archived" ? "opacity-60" : ""
              }`}
            >
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-tight line-clamp-2">
                    {idea.title}
                  </h3>
                  <Badge
                    variant={
                      idea.status === "new"
                        ? "default"
                        : idea.status === "used"
                          ? "secondary"
                          : "outline"
                    }
                    className="shrink-0 text-[10px]"
                  >
                    {idea.status}
                  </Badge>
                </div>

                {idea.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {idea.notes}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {idea.contentType && (
                    <Badge variant="outline" className="text-[10px]">
                      {idea.contentType}
                    </Badge>
                  )}
                  {idea.pillar && (
                    <Badge variant="outline" className="text-[10px]">
                      {idea.pillar}
                    </Badge>
                  )}
                  {idea.sourceUrl && (
                    <a
                      href={idea.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[10px] text-ig-pink hover:underline"
                    >
                      <Link2 className="h-3 w-3" />
                      source
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {idea.status === "new" && (
                      <Link
                        href={`/studio?topic=${encodeURIComponent(idea.title)}`}
                        onClick={() => handleMarkUsed(idea.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-ig-pink/10 px-2 py-1 text-[10px] font-medium text-ig-pink hover:bg-ig-pink/20 transition-colors"
                      >
                        <Wand2 className="h-3 w-3" />
                        Use
                      </Link>
                    )}
                    <button
                      onClick={() => startEdit(idea)}
                      className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {idea.status !== "archived" && (
                      <button
                        onClick={() => handleArchive(idea.id)}
                        className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="p-1 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
