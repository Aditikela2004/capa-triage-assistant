import type {
  CapaOutline,
  Category,
  DeviationInput,
  MissingField,
  RuleHit,
  Severity,
  TriageResult,
} from "./types";

/*
  Concept project. Rules below are illustrative defaults for a portfolio demo.
  They are not GMP advice and do not represent any company's procedure.
*/

interface Rule {
  name: string;
  pattern: RegExp;
  points: number;
  effect: string;
}

const SEVERITY_RULES: Rule[] = [
  {
    name: "Patient or product safety signal",
    pattern: /(patient|adverse|safety|recall|contaminat|sterility|endotoxin|mix-?up|mislabel)/i,
    points: 5,
    effect: "Possible patient or product safety impact",
  },
  {
    name: "Product already released or distributed",
    pattern: /(released|shipped|distributed|in the market|dispatched)/i,
    points: 4,
    effect: "Affected material may have left site control",
  },
  {
    name: "Out of specification or limit",
    pattern: /(out of spec|oos|out-of-spec|exceed(ed)? (the )?limit|excursion|alarm limit|above limit|below limit)/i,
    points: 3,
    effect: "Quality attribute or process limit not met",
  },
  {
    name: "Data integrity concern",
    pattern: /(back-?dat|overwrit|missing (signature|entry|record)|unsigned|altered|deleted data|shared (login|password)|not contemporaneous)/i,
    points: 4,
    effect: "Record reliability is in question",
  },
  {
    name: "Repeat occurrence",
    pattern: /(repeat|recurr|again|second time|same issue|previous deviation|trend)/i,
    points: 2,
    effect: "Prior corrective action may not have been effective",
  },
  {
    name: "Multiple batches or lots",
    pattern: /(multiple (batches|lots)|several (batches|lots)|all (batches|lots)|\b\d+ (batches|lots)\b)/i,
    points: 3,
    effect: "Impact may extend beyond a single batch",
  },
  {
    name: "Equipment malfunction",
    pattern: /(malfunction|breakdown|failed|failure|leak|calibration (overdue|expired)|out of calibration)/i,
    points: 2,
    effect: "Equipment condition may have affected the process",
  },
  {
    name: "Documentation-only wording",
    pattern: /(typo|late entry|transcription|wrong date|missing initials|formatting)/i,
    points: -2,
    effect: "Pattern is consistent with a documentation correction",
  },
  {
    name: "No product impact stated",
    pattern: /(no (product )?impact|no effect on (the )?product|did not affect)/i,
    points: -2,
    effect: "Reporter states no product impact (needs verification)",
  },
];

const CATEGORY_RULES: { category: Category; pattern: RegExp }[] = [
  {
    category: "Documentation / Data integrity",
    pattern: /(record|signature|entry|log ?book|documentation|back-?dat|overwrit|initials|transcription|data integrity)/i,
  },
  {
    category: "Equipment",
    pattern: /(equipment|pump|filter|centrifuge|autoclave|sensor|probe|calibrat|valve|chiller|freezer|instrument|alarm)/i,
  },
  {
    category: "Environment",
    pattern: /(temperature|humidity|pressure differential|cleanroom|particulate|environmental|viable|hvac)/i,
  },
  {
    category: "Material",
    pattern: /(raw material|reagent|supplier|vendor|lot of|component|label stock|expired material)/i,
  },
  {
    category: "Personnel / Training",
    pattern: /(operator|technician|training|untrained|not qualified|gowning|sop (not )?followed)/i,
  },
  {
    category: "Process",
    pattern: /(process|step|hold time|mixing|fill|pooling|sequence|parameter|yield)/i,
  },
];

export function classifySeverity(score: number): Severity {
  if (score >= 8) return "Critical";
  if (score >= 4) return "Major";
  return "Minor";
}

export function classifyCategory(text: string): Category {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "Process";
}

export function findMissingFields(input: DeviationInput): MissingField[] {
  const missing: MissingField[] = [];
  const blank = (v: string) => !v || v.trim().length < 3;

  if (blank(input.reportedBy))
    missing.push({
      field: "Reported by",
      alcoa: "Attributable",
      why: "Every record needs a named person who can be traced.",
    });
  if (blank(input.dateTime))
    missing.push({
      field: "Date and time of event",
      alcoa: "Contemporaneous",
      why: "Timing shows the record was made when the event happened.",
    });
  if (blank(input.description) || input.description.trim().length < 40)
    missing.push({
      field: "Event description (40+ characters)",
      alcoa: "Complete",
      why: "A short description cannot support an investigation.",
    });
  if (blank(input.area))
    missing.push({
      field: "Area or equipment",
      alcoa: "Accurate",
      why: "Location is needed to scope the impact and find related records.",
    });
  if (blank(input.batch))
    missing.push({
      field: "Batch or lot number",
      alcoa: "Complete",
      why: "Without a batch reference, product impact cannot be assessed.",
    });
  if (blank(input.immediateAction))
    missing.push({
      field: "Immediate action taken",
      alcoa: "Consistent",
      why: "Containment steps show how the event was controlled.",
    });
  if (blank(input.impactAssessment))
    missing.push({
      field: "Initial impact assessment",
      alcoa: "Accurate",
      why: "A first view of product, patient, and process impact is required before triage is final.",
    });
  return missing;
}

function buildCapa(category: Category, severity: Severity): CapaOutline {
  const containment = [
    "Quarantine or hold affected material and mark it clearly.",
    "Stop or restrict the affected step until impact is understood.",
    "Notify the area supervisor and Quality on duty.",
  ];
  if (severity === "Critical")
    containment.push("Assess whether distributed material needs a hold or recall evaluation.");

  const investigation = [
    "Interview the people involved and collect contemporaneous records.",
    "Build a timeline of the event from batch, equipment, and system records.",
    "Check for prior deviations on the same area, equipment, or product.",
    "Use a 5 Whys or fishbone review to separate cause from symptom.",
  ];

  const hypotheses: Record<Category, string[]> = {
    Equipment: [
      "Preventive maintenance or calibration interval was not adequate.",
      "Equipment alarm or interlock did not trigger as designed.",
      "Spare or replacement part did not meet the original specification.",
    ],
    Process: [
      "Procedure step is ambiguous or allows more than one interpretation.",
      "Process parameter range is too tight or not verified during execution.",
      "Handoff between shifts or teams lost a required step.",
    ],
    Material: [
      "Supplier lot varied from the specification.",
      "Incoming inspection did not test the affected attribute.",
      "Storage or handling conditions changed before use.",
    ],
    "Documentation / Data integrity": [
      "Form layout makes the required entry easy to miss.",
      "Review step did not catch the missing or altered entry.",
      "System permissions or shared access allowed an unattributed change.",
    ],
    Environment: [
      "Monitoring alert threshold did not give enough warning.",
      "HVAC or utility change was not communicated to the area.",
      "Gowning or material flow introduced the excursion.",
    ],
    "Personnel / Training": [
      "Training did not cover the failure scenario.",
      "Qualification records were not checked before assignment.",
      "Workload or staffing level led to a skipped step.",
    ],
  };

  const corrective = [
    "Fix the immediate condition and document the verification.",
    "Complete the impact assessment for all affected batches or records.",
    "Correct the affected record using an approved late-entry or amendment process.",
  ];

  const preventive: Record<Category, string[]> = {
    Equipment: ["Review the maintenance plan and alarm design for similar equipment."],
    Process: ["Revise the procedure and retrain affected staff on the change."],
    Material: ["Add or tighten incoming checks and review the supplier agreement."],
    "Documentation / Data integrity": [
      "Redesign the form or system prompt and add a second-person review point.",
    ],
    Environment: ["Adjust alert and action limits and add trend review to routine meetings."],
    "Personnel / Training": ["Update the training matrix and add a competence check before sign-off."],
  };

  const timelines: Record<Severity, { step: string; target: string }[]> = {
    Critical: [
      { step: "Containment in place", target: "Within 1 working day" },
      { step: "Impact assessment complete", target: "Within 5 working days" },
      { step: "Investigation closed", target: "Within 30 days" },
      { step: "Effectiveness check", target: "90 days after implementation" },
    ],
    Major: [
      { step: "Containment in place", target: "Within 2 working days" },
      { step: "Impact assessment complete", target: "Within 10 working days" },
      { step: "Investigation closed", target: "Within 45 days" },
      { step: "Effectiveness check", target: "90 days after implementation" },
    ],
    Minor: [
      { step: "Containment in place", target: "Within 5 working days" },
      { step: "Investigation closed", target: "Within 60 days" },
      { step: "Effectiveness check", target: "Next routine review cycle" },
    ],
  };

  return {
    containment,
    investigation,
    rootCauseHypotheses: hypotheses[category],
    corrective,
    preventive: preventive[category],
    effectivenessCheck: [
      "Define a measurable check, such as no repeat deviation on this step for 3 consecutive batches.",
      "Record who owns the check and when it will be reviewed.",
    ],
    suggestedTimeline: timelines[severity],
  };
}

export function triage(input: DeviationInput): TriageResult {
  const text = [
    input.title,
    input.description,
    input.immediateAction,
    input.impactAssessment,
  ].join(" ");

  const hits: RuleHit[] = [];
  let score = 0;
  for (const rule of SEVERITY_RULES) {
    if (rule.pattern.test(text)) {
      score += rule.points;
      hits.push({ rule: rule.name, effect: rule.effect, points: rule.points });
    }
  }
  if (score < 0) score = 0;

  const severity = classifySeverity(score);
  const category = classifyCategory(text + " " + input.area);
  const missing = findMissingFields(input);
  const capa = buildCapa(category, severity);

  // Human review is always required in this demo.
  // The flag below only records why the reviewer should look closely.
  const needsHumanReview = true;

  const summary =
    `${severity} ${category.toLowerCase()} deviation (rule score ${score}). ` +
    (missing.length
      ? `${missing.length} required field${missing.length === 1 ? "" : "s"} missing or too thin.`
      : "All required intake fields are present.");

  return { severity, category, score, hits, missing, capa, needsHumanReview, summary };
}

export const SAMPLE_DEVIATIONS: { label: string; input: DeviationInput }[] = [
  {
    label: "Freezer temperature excursion",
    input: {
      title: "Cold storage excursion overnight",
      description:
        "Overnight monitoring showed the freezer temperature rose above the alarm limit for about 3 hours. The alarm sounded but was not acknowledged until the morning shift. Two lots of intermediate material were stored in the unit and one lot was already released to the next step.",
      area: "Cold storage room 2, freezer FZ-204",
      batch: "LOT-SYN-0412, LOT-SYN-0413",
      reportedBy: "Day shift technician A",
      dateTime: "2026-10-18 06:40",
      immediateAction: "Moved material to a backup freezer and placed both lots on hold.",
      impactAssessment: "",
    },
  },
  {
    label: "Late entry on batch record",
    input: {
      title: "Missing initials on a batch record step",
      description:
        "During review, an operator initial was missing on one in-process check step. The operator confirmed the check was done and the late entry is a transcription gap. No product impact is expected.",
      area: "Formulation suite 1",
      batch: "LOT-SYN-0398",
      reportedBy: "QA reviewer B",
      dateTime: "2026-10-17 14:10",
      immediateAction: "Operator added a signed and dated late entry with an explanation.",
      impactAssessment: "No product impact. Check results were within range.",
    },
  },
  {
    label: "Back-dated log entry",
    input: {
      title: "Back-dated entry found in equipment logbook",
      description:
        "Reviewer found a logbook entry dated two days before it was actually written. The same page has an overwritten value that is not initialed. This is the second time a similar issue was noted in this area.",
      area: "Purification suite, chromatography skid",
      batch: "LOT-SYN-0405",
      reportedBy: "QA reviewer C",
      dateTime: "2026-10-19 09:15",
      immediateAction: "Logbook page sequestered.",
      impactAssessment: "Under review.",
    },
  },
];
