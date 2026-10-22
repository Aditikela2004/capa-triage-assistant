import { test } from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_DEVIATIONS, classifySeverity, findMissingFields, triage } from "../lib/triage";

test("severity thresholds", () => {
  assert.equal(classifySeverity(0), "Minor");
  assert.equal(classifySeverity(3), "Minor");
  assert.equal(classifySeverity(4), "Major");
  assert.equal(classifySeverity(7), "Major");
  assert.equal(classifySeverity(8), "Critical");
});

test("freezer excursion with released lot is not Minor", () => {
  const r = triage(SAMPLE_DEVIATIONS[0].input);
  assert.notEqual(r.severity, "Minor");
  assert.ok(r.hits.some((h) => h.rule.startsWith("Product already released")));
  assert.ok(r.hits.some((h) => h.rule.startsWith("Out of specification")));
});

test("freezer sample flags the blank impact assessment", () => {
  const missing = findMissingFields(SAMPLE_DEVIATIONS[0].input);
  assert.ok(missing.some((m) => m.field === "Initial impact assessment"));
});

test("late entry with no product impact is Minor and documentation category", () => {
  const r = triage(SAMPLE_DEVIATIONS[1].input);
  assert.equal(r.severity, "Minor");
  assert.equal(r.category, "Documentation / Data integrity");
  assert.equal(r.missing.length, 0);
});

test("back-dated entry is at least Major with data integrity hit", () => {
  const r = triage(SAMPLE_DEVIATIONS[2].input);
  assert.notEqual(r.severity, "Minor");
  assert.ok(r.hits.some((h) => h.rule === "Data integrity concern"));
  assert.ok(r.hits.some((h) => h.rule === "Repeat occurrence"));
});

test("empty input yields Minor with every key field missing", () => {
  const r = triage({
    title: "",
    description: "",
    area: "",
    batch: "",
    reportedBy: "",
    dateTime: "",
    immediateAction: "",
    impactAssessment: "",
  });
  assert.equal(r.severity, "Minor");
  assert.equal(r.missing.length, 7);
});

test("human review is always required", () => {
  for (const s of SAMPLE_DEVIATIONS) assert.equal(triage(s.input).needsHumanReview, true);
});

test("critical events include a distribution hold step", () => {
  const r = triage({
    ...SAMPLE_DEVIATIONS[0].input,
    description:
      "Possible patient safety concern after contamination found in a lot that was already shipped to the distributor.",
  });
  assert.equal(r.severity, "Critical");
  assert.ok(r.capa.containment.some((c) => c.includes("recall")));
});
