/** Public surface of @promptgenius/core — isomorphic, no native deps. */
export * from "./types.js";
export * from "./frameworks.js";
export * from "./tiers.js";
export * from "./gating.js";
export * from "./system-prompt.js";
export * from "./generation.js";
export * from "./bundles.js";

export const PROMPTGENIUS_DEFAULT_MODEL = "claude-opus-4-8";
export const PROMPTGENIUS_DEFAULT_EFFORT = "high";
