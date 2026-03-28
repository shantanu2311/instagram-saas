// Shared constants used across API routes and UI components

export const VALID_MOMENT_TYPES = [
  "launch",
  "event",
  "milestone",
  "collaboration",
  "seasonal",
] as const;

export type MomentType = (typeof VALID_MOMENT_TYPES)[number];

export const VALID_CONTENT_TYPES = ["image", "carousel", "reel"] as const;

export type ContentType = (typeof VALID_CONTENT_TYPES)[number];

export const VALID_MEDIA_SOURCES = [
  "upload",
  "ai-generated",
  "instagram-sync",
] as const;

export type MediaSource = (typeof VALID_MEDIA_SOURCES)[number];

export const VALID_IDEA_STATUSES = ["new", "used", "archived"] as const;

export type IdeaStatus = (typeof VALID_IDEA_STATUSES)[number];

export const VALID_IDEA_SOURCE_TYPES = [
  "article",
  "social",
  "competitor",
  "manual",
] as const;

export type IdeaSourceType = (typeof VALID_IDEA_SOURCE_TYPES)[number];

export const PERIOD_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
] as const;
