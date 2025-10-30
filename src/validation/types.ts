import { AnalysisResult } from "../core/git/types.js";
import { ProjectContext } from "../core/context/project-context.js";

export interface TemplateData extends AnalysisResult {
  title?: string;
  description?: string | null;
  includeStats?: boolean;
  projectContext?: ProjectContext;
}

export type TemplateType = "standard" | "detailed" | "minimal";
export type Language = "en" | "fr";

export interface PRTemplate {
  fr: (data: TemplateData) => Promise<string>;
  en: (data: TemplateData) => Promise<string>;
}

export type PRTemplates = Record<TemplateType, PRTemplate>;
