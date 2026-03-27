"use client";

import { useStrategyStore } from "@/lib/stores/strategy-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function DiscoveryStepBusiness() {
  const { profile, updateProfile, nextDiscoveryStep } = useStrategyStore();

  const canContinue =
    profile.businessName.trim() !== "" &&
    profile.businessDescription.trim() !== "";

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl ig-gradient flex items-center justify-center mb-4">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Tell us about your business</h2>
        <p className="text-muted-foreground">
          This helps us understand your brand and create relevant content.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Business Name</label>
            <Input
              value={profile.businessName}
              onChange={(e) =>
                updateProfile({ businessName: e.target.value })
              }
              placeholder="e.g., Acme Fitness Co."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Business Description</label>
            <textarea
              value={profile.businessDescription}
              onChange={(e) =>
                updateProfile({ businessDescription: e.target.value })
              }
              placeholder="What does your business do? Who do you serve?"
              rows={3}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product / Service</label>
            <textarea
              value={profile.productService}
              onChange={(e) =>
                updateProfile({ productService: e.target.value })
              }
              placeholder="Describe your main product or service offering"
              rows={2}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Website URL</label>
            <Input
              value={profile.websiteUrl}
              onChange={(e) =>
                updateProfile({ websiteUrl: e.target.value })
              }
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={nextDiscoveryStep}
          disabled={!canContinue}
          size="lg"
          className="px-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
