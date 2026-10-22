export type Severity = "Critical" | "Major" | "Minor";

export type Category =
  | "Equipment"
  | "Process"
  | "Material"
  | "Documentation / Data integrity"
  | "Environment"
  | "Personnel / Training";

export interface DeviationInput {
  title: string;
  description: string;
  area: string;
  batch: string;
  reportedBy: string;
  dateTime: string;
  immediateAction: string;
  impactAssessment: string;
}

export interface RuleHit {
  rule: string;
  effect: string;
  points: number;
}

export interface MissingField {
  field: string;
  alcoa: string;
  why: string;
}

export interface CapaOutline {
  containment: string[];
  investigation: string[];
  rootCauseHypotheses: string[];
  corrective: string[];
  preventive: string[];
  effectivenessCheck: string[];
  suggestedTimeline: { step: string; target: string }[];
}

export interface TriageResult {
  severity: Severity;
  category: Category;
  score: number;
  hits: RuleHit[];
  missing: MissingField[];
  capa: CapaOutline;
  needsHumanReview: boolean;
  summary: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}
