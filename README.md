# CAPA Triage Assistant

A concept project that shows how a deviation report could be triaged, checked for documentation gaps, and turned into a draft CAPA outline, with a named human approving every result and an audit log of each step.

**This is a portfolio concept using synthetic data.** The rules are illustrative, not GMP advice, and do not represent any company's procedure. Do not enter real deviation, batch, or patient information.

## Screens
1. Intake: a deviation form with three sample cases.
2. Triage result: proposed severity and category, the rule hits behind them, ALCOA+ documentation gaps, and a draft CAPA outline.
3. Approval and audit log: a reviewer approves or returns the triage, and each action is logged in the browser.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Tests
```bash
npm test
```
Sixteen tests cover severity thresholds, the sample cases, empty-input handling, the rule that human review is always required, and the second-opinion route (missing key, bad input, key kept out of the URL, quota and error handling). The route tests use a mocked network call, so they do not use up any free quota.

## Optional AI second opinion (Gemini free tier)
The app works fully without any API key. To enable the "Get second opinion" button, create a free key in Google AI Studio and set a server-side environment variable:

```
GEMINI_API_KEY=your-key
# optional, defaults to gemini-3.1-flash-lite
GEMINI_MODEL=gemini-3.1-flash-lite
```
The key is read only in `app/api/second-opinion/route.ts` on the server, is sent in a request header, and is never sent to the browser. The AI comment is shown separately and never changes the rules-based result.

Free-tier notes:
- Free limits are small and can change. Check your limits in Google AI Studio. When the quota runs out, the button shows a short message and the rest of the app keeps working.
- Google states that free-tier data may be used for training outside the UK, EU, EEA, and Switzerland. This project uses synthetic data only. Never enter real information.
- Never commit the key to Git or paste it into chat.

## Deploy to Vercel
1. Push this folder to a GitHub repository.
2. In Vercel, choose Add New Project and import the repository. Framework preset: Next.js.
3. Optional: add `GEMINI_API_KEY` under Settings, Environment Variables, then redeploy.
4. Deploy.

## Project layout
- `lib/triage.ts`: rules, ALCOA+ gap check, CAPA outline builder, sample cases
- `lib/types.ts`: shared types
- `app/page.tsx`: the three-step interface
- `app/api/second-opinion/route.ts`: optional AI comment
- `tests/triage.test.ts`: unit tests
- `docs/`: problem brief and case study draft

## Known limits
- Keyword rules can miss context. A real version needs review by quality staff and testing against historical deviations.
- The audit log lives in browser storage. A real audit trail needs authentication and tamper-evident server-side storage.
- No usage data or user testing exists yet, so this project makes no performance claims.
