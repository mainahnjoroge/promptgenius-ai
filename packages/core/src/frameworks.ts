/**
 * Industry intelligence: maps an industry to the professional frameworks the
 * generated prompt should apply. Used to make outputs realistic and usable.
 */

export interface IndustryFramework {
  /** Canonical key (lowercased industry name fragment). */
  match: string[];
  label: string;
  frameworks: string[];
  terminology: string[];
}

export const INDUSTRY_FRAMEWORKS: IndustryFramework[] = [
  {
    match: ["market", "advertis", "growth", "brand", "seo", "social"],
    label: "Marketing",
    frameworks: ["AIDA", "PAS (Problem-Agitate-Solve)", "4 Ps", "Hook-Story-Offer"],
    terminology: ["funnel", "CTR", "CTA", "positioning", "ICP", "value proposition"],
  },
  {
    match: ["health", "medic", "clinic", "patient", "nurse", "therap"],
    label: "Healthcare",
    frameworks: ["SOAP (Subjective-Objective-Assessment-Plan)", "SBAR", "ICD coding"],
    terminology: ["intake", "differential", "care plan", "HIPAA", "triage"],
  },
  {
    match: ["business", "strategy", "consult", "operations", "startup", "manage"],
    label: "Business",
    frameworks: ["SWOT", "OKRs", "Porter's Five Forces", "RACI", "Business Model Canvas"],
    terminology: ["KPI", "north-star metric", "runway", "TAM/SAM/SOM", "unit economics"],
  },
  {
    match: ["sale", "revenue", "account exec", "bdr", "sdr", "pipeline"],
    label: "Sales",
    frameworks: ["BANT", "MEDDIC", "SPIN Selling", "Challenger"],
    terminology: ["discovery", "objection handling", "close rate", "ACV", "champion"],
  },
  {
    match: ["engineer", "software", "developer", "code", "devops", "data"],
    label: "Engineering",
    frameworks: ["User stories", "RFC/Design docs", "STAR for postmortems", "DORA metrics"],
    terminology: ["acceptance criteria", "edge cases", "latency", "rollback", "observability"],
  },
  {
    match: ["legal", "law", "compliance", "contract", "attorney"],
    label: "Legal",
    frameworks: ["IRAC (Issue-Rule-Application-Conclusion)", "Clause-by-clause review"],
    terminology: ["indemnity", "liability", "jurisdiction", "redline", "precedent"],
  },
  {
    match: ["financ", "account", "invest", "bank", "fintech", "tax"],
    label: "Finance",
    frameworks: ["DuPont analysis", "DCF", "Three-statement model", "Variance analysis"],
    terminology: ["EBITDA", "cash flow", "GAAP", "burn", "ROI", "liquidity"],
  },
  {
    match: ["educat", "teach", "course", "curriculum", "student", "learn"],
    label: "Education",
    frameworks: ["Bloom's Taxonomy", "Backward Design", "ADDIE", "Scaffolding"],
    terminology: ["learning objective", "rubric", "formative assessment", "differentiation"],
  },
  {
    match: ["hr", "recruit", "people", "talent", "hiring"],
    label: "Human Resources",
    frameworks: ["STAR interviews", "9-box grid", "Competency models"],
    terminology: ["job description", "onboarding", "performance review", "DEI", "retention"],
  },
  {
    match: ["ecommerce", "retail", "shop", "product", "store", "merch"],
    label: "E-commerce / Retail",
    frameworks: ["AIDA", "Jobs-To-Be-Done", "Conversion funnel", "FAB (Features-Advantages-Benefits)"],
    terminology: ["SKU", "AOV", "conversion rate", "cart abandonment", "merchandising"],
  },
  {
    match: ["design", "ux", "ui", "creative", "art"],
    label: "Design",
    frameworks: ["Double Diamond", "Heuristic evaluation", "Design thinking"],
    terminology: ["wireframe", "affordance", "hierarchy", "accessibility", "design system"],
  },
  {
    match: ["real estate", "property", "realtor", "mortgage"],
    label: "Real Estate",
    frameworks: ["Comparative Market Analysis", "AIDA listings", "FSBO scripts"],
    terminology: ["listing", "closing", "appraisal", "escrow", "curb appeal"],
  },
];

const GENERIC_FRAMEWORK: IndustryFramework = {
  match: [],
  label: "General / Cross-industry",
  frameworks: ["Goal-Context-Constraints-Format", "Chain-of-thought", "Few-shot examples"],
  terminology: ["objective", "audience", "constraints", "deliverable", "success criteria"],
};

/** Resolve the best-fit framework set for a free-text industry string. */
export function resolveFramework(industry: string): IndustryFramework {
  const needle = industry.trim().toLowerCase();
  if (!needle) return GENERIC_FRAMEWORK;
  for (const entry of INDUSTRY_FRAMEWORKS) {
    if (entry.match.some((m) => needle.includes(m))) return entry;
  }
  return GENERIC_FRAMEWORK;
}
