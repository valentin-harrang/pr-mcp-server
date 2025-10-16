import { AnalysisResult } from "../core/git/types.js";

export interface TemplateData extends AnalysisResult {
  title?: string;
  description?: string | null;
  includeStats?: boolean;
}

export type TemplateType = "standard" | "detailed" | "minimal";
export type Language = "en" | "fr";

export interface PRTemplate {
  fr: (data: TemplateData) => string;
  en: (data: TemplateData) => string;
}

export type PRTemplates = Record<TemplateType, PRTemplate>;
