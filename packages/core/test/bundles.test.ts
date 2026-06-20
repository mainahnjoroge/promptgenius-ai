import { describe, expect, it } from "vitest";
import { mockBundleSet, type GenerationInput } from "../src/index.js";

const input: GenerationInput = {
  industry: "E-commerce",
  useCase: "write product descriptions",
  skillLevel: "beginner",
  outputType: "simple",
};

describe("mockBundleSet", () => {
  it("returns three tiers with increasing prompt counts", () => {
    const set = mockBundleSet(input);
    expect(set.bundles).toHaveLength(3);
    const [starter, pro, ent] = set.bundles;
    expect(starter?.tier).toBe("starter");
    expect(pro?.tier).toBe("professional");
    expect(ent?.tier).toBe("enterprise");
    expect(starter!.prompts.length).toBeLessThan(pro!.prompts.length);
    expect(pro!.prompts.length).toBeLessThan(ent!.prompts.length);
    expect(set.mock).toBe(true);
  });
});
