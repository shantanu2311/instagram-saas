"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/page-transition";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Tag,
  DollarSign,
  Loader2,
  ShoppingBag,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
  usps: string[];
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  imageUrl: "",
  usps: [] as string[],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newUsp, setNewUsp] = useState("");

  const fetchProducts = useCallback(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setNewUsp("");
  }

  function startEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category || "",
      price: product.price != null ? String(product.price) : "",
      imageUrl: product.imageUrl || "",
      usps: product.usps || [],
    });
    setEditingId(product.id);
    setShowForm(true);
    setNewUsp("");
  }

  function addUsp() {
    const trimmed = newUsp.trim();
    if (trimmed && !form.usps.includes(trimmed)) {
      setForm((f) => ({ ...f, usps: [...f.usps, trimmed] }));
      setNewUsp("");
    }
  }

  function removeUsp(index: number) {
    setForm((f) => ({ ...f, usps: f.usps.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      price: form.price || null,
      imageUrl: form.imageUrl || null,
      usps: form.usps,
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        fetchProducts();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchProducts();
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
            <h1 className="text-2xl font-bold">Products & Services</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product catalogue so AI can reference them in content.
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
                Add Product
              </>
            )}
          </Button>
        </div>

        {/* Inline Add/Edit Form */}
        {showForm && (
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {editingId ? "Edit Product" : "Add New Product"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Product name"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Category
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      placeholder="e.g. Skincare, Course, Service"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Price
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, imageUrl: e.target.value }))
                      }
                      placeholder="https://..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
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
                    placeholder="Brief description of your product or service..."
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                {/* USPs */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Unique Selling Points
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newUsp}
                      onChange={(e) => setNewUsp(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addUsp();
                        }
                      }}
                      placeholder="Add a USP and press Enter"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addUsp}
                    >
                      Add
                    </Button>
                  </div>
                  {form.usps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.usps.map((usp, i) => (
                        <Badge
                          key={`${i}-${usp}`}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {usp}
                          <button
                            type="button"
                            onClick={() => removeUsp(i)}
                            className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
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
                    disabled={saving || !form.name.trim()}
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingId ? "Update" : "Add Product"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && !showForm && (
          <Card className="border-border/40">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-ig-pink/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-6 w-6 text-ig-pink" />
                </div>
                <p className="text-sm font-medium">No products yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Add your products so AI can reference them in content.
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="border-border/40 overflow-hidden"
              >
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold truncate">
                        {product.name}
                      </h3>
                      {product.category && (
                        <Badge
                          variant="secondary"
                          className="mt-1 text-[10px]"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEdit(product)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {product.price != null && (
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {product.price.toFixed(2)}
                    </div>
                  )}

                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {product.usps && product.usps.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      <Package className="h-3 w-3" />
                      {product.usps.length} USP{product.usps.length !== 1 && "s"}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
