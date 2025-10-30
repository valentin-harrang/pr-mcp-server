import { z } from "zod";
import { Language, TemplateType } from "./types.js";

export const AnalyzeBranchSchema = z.object({
  baseBranch: z.string().optional(),
  detailed: z.boolean().default(true),
});

export const GeneratePRSchema = z.object({
  title: z.string().optional(),
  baseBranch: z.string().optional(),
  template: z
    .custom<TemplateType>(
      (val) => val === "standard" || val === "detailed" || val === "minimal"
    )
    .default("standard"),
  language: z
    .custom<Language>((val) => val === "en" || val === "fr")
    .default("fr"),
  includeStats: z.boolean().default(true),
});

export const SuggestReviewersSchema = z.object({
  limit: z.number().int().positive().max(20).default(3),
  baseBranch: z.string().optional(),
});

export const ReviewSchema = z.object({
  baseBranch: z.string().optional(),
});

export const TitleSchema = z.object({
  maxLength: z.number().int().positive().max(200).optional(),
  baseBranch: z.string().optional(),
});

export const GenerateCompleteSchema = z.object({
  template: z
    .custom<TemplateType>(
      (val) => val === "standard" || val === "detailed" || val === "minimal"
    )
    .default("standard"),
  language: z
    .custom<Language>((val) => val === "en" || val === "fr")
    .default("fr"),
  includeStats: z.boolean().default(true),
  maxTitleLength: z.number().int().positive().max(200).optional(),
  baseBranch: z.string().optional(),
});

export const CreatePRSchema = z.object({
  template: z
    .custom<TemplateType>(
      (val) => val === "standard" || val === "detailed" || val === "minimal"
    )
    .default("standard"),
  language: z
    .custom<Language>((val) => val === "en" || val === "fr")
    .default("fr"),
  includeStats: z.boolean().default(true),
  maxTitleLength: z.number().int().positive().max(200).optional(),
  baseBranch: z.string().optional(),
  draft: z.boolean().default(false),
  githubToken: z.string().optional(),
  addReviewers: z.boolean().default(true),
  maxReviewers: z.number().int().positive().max(20).default(3),
});

export const CreatePRCompleteSchema = z.object({
  template: z
    .custom<TemplateType>(
      (val) => val === "standard" || val === "detailed" || val === "minimal"
    )
    .default("standard"),
  language: z
    .custom<Language>((val) => val === "en" || val === "fr")
    .default("fr"),
  includeStats: z.boolean().default(true),
  maxTitleLength: z.number().int().positive().max(200).optional(),
  baseBranch: z.string().optional(),
  draft: z.boolean().default(false),
  githubToken: z.string().optional(),
  addReviewers: z.boolean().default(true),
  maxReviewers: z.number().int().positive().max(20).default(3),
  includeAIReview: z.boolean().default(false),
  aiReviewText: z.string().optional(), // The actual AI-generated review to include
});
