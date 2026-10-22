# Problem brief: CAPA Triage Assistant

Concept project. Synthetic data only.

## Problem
In regulated manufacturing, a deviation report starts a chain of work: someone decides how serious it is, checks whether the record is complete, and starts planning the investigation. When intake is thin or triage is inconsistent, reviewers spend their first pass chasing basic details and the investigation starts late.

## Users
- Reporter: the operator or technician who files the deviation.
- Quality reviewer: the person who triages the report and decides whether it can move forward.
- Investigation owner: the person who builds the CAPA plan.

## Goal
Give the reviewer a consistent first pass in one screen: a proposed severity and category with the reasons shown, a list of missing intake fields tied to ALCOA+ attributes, and a draft CAPA outline. A named human approves or returns every triage, and every step is logged.

## Non-goals
- It does not replace a quality system or electronic QMS.
- It does not make final severity decisions.
- It does not give regulatory advice. Rules are illustrative defaults.

## What the prototype does
1. Intake form with three sample deviations (including one with a blank impact assessment).
2. Rules-based triage with visible rule hits and points.
3. Documentation gap check mapped to ALCOA+.
4. Draft CAPA outline with containment, investigation, root cause hypotheses, corrective and preventive actions, effectiveness check, and an illustrative timeline.
5. Human approval step requiring a reviewer name, plus an audit log kept in the browser.
6. Optional AI second opinion that adds a comment and never changes the rules-based result.

## Success measures to test with real users (not measured yet)
- Time for a reviewer to reach a triage decision compared with their current process.
- Share of reports that arrive with all required fields after the gap check is shown to reporters.
- Rate at which reviewers change the proposed severity, and why.

## Key design decisions
- Rules first, AI second. Reviewers can see exactly why a severity was proposed, which matters when the work is audited.
- Human approval is always required. The tool proposes; a named person decides.
- The AI comment is optional and separate, so the core flow works without any model call.
- Blank fields are allowed on purpose so the gap check can be demonstrated.

## Risks and open questions
- Keyword rules can miss context or be fooled by wording. A real version would need review by quality staff and testing against historical deviations.
- Browser-only audit logs are for demonstration. A real audit trail needs server-side, tamper-evident storage and user authentication.
- Severity thresholds and timelines are placeholders and would need to come from an organization's own procedures.
