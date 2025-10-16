import { describe, it, expect } from "vitest";
import {
  AnalyzeBranchSchema,
  GeneratePRSchema,
  SuggestReviewersSchema,
  ReviewSchema,
  TitleSchema,
} from "../../validation/schemas.js";

describe("Validation Schemas", () => {
  describe("AnalyzeBranchSchema", () => {
    it("should accept valid input", () => {
      const result = AnalyzeBranchSchema.parse({
        baseBranch: "develop",
        detailed: false,
      });
      expect(result.baseBranch).toBe("develop");
      expect(result.detailed).toBe(false);
    });

    it("should use defaults", () => {
      const result = AnalyzeBranchSchema.parse({});
      expect(result.baseBranch).toBe("main");
      expect(result.detailed).toBe(true);
    });
  });

  describe("GeneratePRSchema", () => {
    it("should accept valid input", () => {
      const result = GeneratePRSchema.parse({
        title: "My PR",
        baseBranch: "develop",
        template: "detailed",
        language: "en",
        includeStats: false,
      });
      expect(result.title).toBe("My PR");
      expect(result.template).toBe("detailed");
      expect(result.language).toBe("en");
      expect(result.includeStats).toBe(false);
    });

    it("should use defaults", () => {
      const result = GeneratePRSchema.parse({});
      expect(result.baseBranch).toBe("main");
      expect(result.template).toBe("standard");
      expect(result.language).toBe("fr");
      expect(result.includeStats).toBe(true);
    });

    it("should reject invalid template", () => {
      expect(() =>
        GeneratePRSchema.parse({ template: "invalid" })
      ).toThrow();
    });

    it("should reject invalid language", () => {
      expect(() => GeneratePRSchema.parse({ language: "es" })).toThrow();
    });
  });

  describe("SuggestReviewersSchema", () => {
    it("should accept valid limit", () => {
      const result = SuggestReviewersSchema.parse({ limit: 5 });
      expect(result.limit).toBe(5);
    });

    it("should use default limit", () => {
      const result = SuggestReviewersSchema.parse({});
      expect(result.limit).toBe(3);
    });

    it("should reject limit > 20", () => {
      expect(() =>
        SuggestReviewersSchema.parse({ limit: 25 })
      ).toThrow();
    });

    it("should reject negative limit", () => {
      expect(() =>
        SuggestReviewersSchema.parse({ limit: -1 })
      ).toThrow();
    });

    it("should reject zero limit", () => {
      expect(() => SuggestReviewersSchema.parse({ limit: 0 })).toThrow();
    });
  });

  describe("ReviewSchema", () => {
    it("should accept empty object", () => {
      const result = ReviewSchema.parse({});
      expect(result.baseBranch).toBe("main");
    });

    it("should accept custom baseBranch", () => {
      const result = ReviewSchema.parse({ baseBranch: "develop" });
      expect(result.baseBranch).toBe("develop");
    });
  });

  describe("TitleSchema", () => {
    it("should accept maxLength", () => {
      const result = TitleSchema.parse({ maxLength: 72 });
      expect(result.maxLength).toBe(72);
    });

    it("should accept empty object", () => {
      const result = TitleSchema.parse({});
      expect(result.maxLength).toBeUndefined();
      expect(result.baseBranch).toBe("main");
    });

    it("should reject maxLength > 200", () => {
      expect(() => TitleSchema.parse({ maxLength: 250 })).toThrow();
    });

    it("should reject negative maxLength", () => {
      expect(() => TitleSchema.parse({ maxLength: -10 })).toThrow();
    });
  });
});
