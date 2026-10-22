# Case study draft: CAPA Triage Assistant

Fill in the bracketed parts from your own experience before publishing. Nothing here claims results the project has not produced.

## One-line summary
A concept tool that gives a quality reviewer a consistent first pass on a deviation report, with visible reasoning and a human approval step.

## Why I built it
[Add 2 to 3 sentences in your own words about what you saw in regulated manufacturing documentation and review work, and why consistent first-pass triage and complete intake mattered. Use only things you actually observed.]

## The problem
Deviation intake is often thin, and severity calls can vary by reviewer. That delays the investigation and puts the first pass on the reviewer's desk.

## What I built
- A three-step flow: intake, triage result, approval with audit log.
- Rules that propose severity and category and show every rule that fired.
- A documentation gap check mapped to ALCOA+ attributes.
- A draft CAPA outline the investigation owner can edit.
- An optional AI second opinion kept separate from the rules-based result.

## Decisions and tradeoffs
1. Rules first, AI second. Reviewers can trace why a severity was proposed. The AI adds a comment only.
2. Human approval is mandatory. The tool proposes and a named person decides.
3. Sample cases include a blank impact assessment so the gap check is easy to demonstrate.
4. Illustrative timelines, labeled as placeholders, because real targets belong to each organization's procedures.

## What I tested
- Sixteen unit tests: eight on the triage logic (including empty input and the always-require-review rule) and eight on the AI route using a mocked network call.
- A production build and a smoke test of the page and API route.

## What I have not tested yet
- No real users, so no claims about time saved or accuracy.
- Keyword rules have not been checked against real historical deviations.

## What I would do next
1. Walk 3 to 5 quality reviewers through the sample cases and record where they disagree with the proposed severity.
2. Replace keyword rules with criteria drawn from a real procedure.
3. Move the audit log to authenticated, server-side storage.

## Skills shown
Requirements and process mapping, regulated-documentation thinking (ALCOA+), human-in-the-loop AI design, prototyping, testing, and deployment.

## Links
- Live demo: [add Vercel URL after deploy]
- Code: [add GitHub URL]
