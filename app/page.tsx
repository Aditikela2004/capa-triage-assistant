"use client";

import { useEffect, useState } from "react";
import { SAMPLE_DEVIATIONS, triage } from "@/lib/triage";
import type { AuditEntry, DeviationInput, TriageResult } from "@/lib/types";

const EMPTY: DeviationInput = {
  title: "",
  description: "",
  area: "",
  batch: "",
  reportedBy: "",
  dateTime: "",
  immediateAction: "",
  impactAssessment: "",
};

const LOG_KEY = "capa-triage-audit-log";

type Step = 1 | 2 | 3;

function loadLog(): AuditEntry[] {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLog(entries: AuditEntry[]) {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be blocked. The log still works for this session.
  }
}

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [input, setInput] = useState<DeviationInput>(EMPTY);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [reviewer, setReviewer] = useState("");
  const [comment, setComment] = useState("");
  const [decision, setDecision] = useState<"Approved" | "Returned" | null>(null);
  const [opinion, setOpinion] = useState("");
  const [opinionError, setOpinionError] = useState("");
  const [loadingOpinion, setLoadingOpinion] = useState(false);

  useEffect(() => {
    setLog(loadLog());
  }, []);

  function addLog(actor: string, action: string, detail: string) {
    const entry: AuditEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: new Date().toISOString(),
      actor: actor || "Unknown",
      action,
      detail,
    };
    setLog((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      saveLog(next);
      return next;
    });
  }

  function update<K extends keyof DeviationInput>(key: K, value: string) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function runTriage() {
    const r = triage(input);
    setResult(r);
    setDecision(null);
    setOpinion("");
    setOpinionError("");
    addLog(input.reportedBy || "Reporter", "Triage run", r.summary);
    setStep(2);
  }

  async function getOpinion() {
    if (!result) return;
    setLoadingOpinion(true);
    setOpinion("");
    setOpinionError("");
    try {
      const res = await fetch("/api/second-opinion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, result }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOpinionError(data.error || "Could not get a second opinion.");
      } else {
        setOpinion(data.opinion);
        addLog("AI assistant", "Second opinion added", "Comment generated for reviewer. Not a decision.");
      }
    } catch {
      setOpinionError("Could not reach the server.");
    } finally {
      setLoadingOpinion(false);
    }
  }

  function decide(d: "Approved" | "Returned") {
    if (!result) return;
    if (!reviewer.trim()) return;
    setDecision(d);
    addLog(
      reviewer.trim(),
      d === "Approved" ? "Triage approved" : "Returned to reporter",
      `${result.severity} / ${result.category}. ${comment.trim() || "No comment."}`
    );
  }

  function clearLog() {
    setLog([]);
    saveLog([]);
  }

  return (
    <main className="wrap">
      <h1>CAPA Triage Assistant</h1>
      <p className="sub">
        Triage a deviation report, find documentation gaps, draft a CAPA outline, and keep a human approval trail.
      </p>
      <div className="banner" role="note">
        Concept project with synthetic data only. Rules are illustrative and are not GMP advice or any company
        procedure. A person always makes the final decision.
      </div>

      <nav className="steps" aria-label="Steps">
        <button className="step" aria-current={step === 1 ? "step" : undefined} onClick={() => setStep(1)}>
          1. Intake
        </button>
        <button
          className="step"
          aria-current={step === 2 ? "step" : undefined}
          onClick={() => setStep(2)}
          disabled={!result}
        >
          2. Triage result
        </button>
        <button
          className="step"
          aria-current={step === 3 ? "step" : undefined}
          onClick={() => setStep(3)}
          disabled={!result}
        >
          3. Approval and audit log
        </button>
      </nav>

      {step === 1 && (
        <section className="card">
          <h2>Deviation intake</h2>
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="muted small">Load a sample:</span>
            {SAMPLE_DEVIATIONS.map((s) => (
              <button key={s.label} className="secondary" onClick={() => setInput(s.input)}>
                {s.label}
              </button>
            ))}
            <button className="secondary" onClick={() => setInput(EMPTY)}>
              Clear
            </button>
          </div>
          <div className="grid">
            <div className="full">
              <label htmlFor="title">Title</label>
              <input id="title" value={input.title} onChange={(e) => update("title", e.target.value)} />
            </div>
            <div className="full">
              <label htmlFor="description">What happened</label>
              <textarea
                id="description"
                value={input.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="area">Area or equipment</label>
              <input id="area" value={input.area} onChange={(e) => update("area", e.target.value)} />
            </div>
            <div>
              <label htmlFor="batch">Batch or lot number</label>
              <input id="batch" value={input.batch} onChange={(e) => update("batch", e.target.value)} />
            </div>
            <div>
              <label htmlFor="reportedBy">Reported by</label>
              <input id="reportedBy" value={input.reportedBy} onChange={(e) => update("reportedBy", e.target.value)} />
            </div>
            <div>
              <label htmlFor="dateTime">Date and time of event</label>
              <input id="dateTime" value={input.dateTime} onChange={(e) => update("dateTime", e.target.value)} />
            </div>
            <div className="full">
              <label htmlFor="immediateAction">Immediate action taken</label>
              <textarea
                id="immediateAction"
                value={input.immediateAction}
                onChange={(e) => update("immediateAction", e.target.value)}
              />
            </div>
            <div className="full">
              <label htmlFor="impactAssessment">Initial impact assessment</label>
              <textarea
                id="impactAssessment"
                value={input.impactAssessment}
                onChange={(e) => update("impactAssessment", e.target.value)}
              />
            </div>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button
              className="primary"
              onClick={runTriage}
              disabled={input.title.trim().length === 0 && input.description.trim().length === 0}
            >
              Run triage
            </button>
            <span className="muted small">Leave fields blank on purpose to see the documentation gap check.</span>
          </div>
        </section>
      )}

      {step === 2 && result && (
        <>
          <section className="card">
            <h2>Triage result</h2>
            <div className="row">
              <span className={`badge ${result.severity}`}>{result.severity}</span>
              <span>{result.category}</span>
              <span className="muted small">Rule score {result.score}</span>
            </div>
            <p>{result.summary}</p>

            <h3>Why the rules said this</h3>
            {result.hits.length === 0 ? (
              <p className="muted">No severity rules matched. Treated as Minor by default, so a reviewer should confirm.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>What it means</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {result.hits.map((h) => (
                    <tr key={h.rule}>
                      <td>{h.rule}</td>
                      <td>{h.effect}</td>
                      <td>{h.points > 0 ? `+${h.points}` : h.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3>Documentation gaps (ALCOA+)</h3>
            {result.missing.length === 0 ? (
              <p className="muted">No missing intake fields.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Missing field</th>
                    <th>ALCOA+ attribute</th>
                    <th>Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  {result.missing.map((m) => (
                    <tr key={m.field}>
                      <td>{m.field}</td>
                      <td>{m.alcoa}</td>
                      <td>{m.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card">
            <h2>Draft CAPA outline</h2>
            <p className="muted small">A starting point for the investigation owner. Edit freely.</p>
            <h3>Containment</h3>
            <ul>{result.capa.containment.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Investigation</h3>
            <ul>{result.capa.investigation.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Root cause hypotheses to test</h3>
            <ul>{result.capa.rootCauseHypotheses.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Corrective actions</h3>
            <ul>{result.capa.corrective.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Preventive actions</h3>
            <ul>{result.capa.preventive.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Effectiveness check</h3>
            <ul>{result.capa.effectivenessCheck.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Illustrative timeline for {result.severity.toLowerCase()} events</h3>
            <table>
              <tbody>
                {result.capa.suggestedTimeline.map((t) => (
                  <tr key={t.step}>
                    <td>{t.step}</td>
                    <td>{t.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2>Optional AI second opinion</h2>
            <p className="muted small">
              Adds a short comment for the reviewer. It does not change the result above. Works only when the
              server has an API key configured.
            </p>
            <button className="secondary" onClick={getOpinion} disabled={loadingOpinion}>
              {loadingOpinion ? "Asking..." : "Get second opinion"}
            </button>
            {opinion && <div className="ai">{opinion}</div>}
            {opinionError && <p className="error">{opinionError}</p>}
          </section>

          <div className="row">
            <button className="secondary" onClick={() => setStep(1)}>
              Back to intake
            </button>
            <button className="primary" onClick={() => setStep(3)}>
              Continue to approval
            </button>
          </div>
        </>
      )}

      {step === 3 && result && (
        <>
          <section className="card">
            <h2>Human approval</h2>
            <p>
              <span className={`badge ${result.severity}`}>{result.severity}</span> {result.category}
            </p>
            <p className="muted small">
              Nothing is final until a named reviewer approves or returns the triage.
              {result.missing.length > 0 &&
                ` ${result.missing.length} intake gap${result.missing.length === 1 ? "" : "s"} remain open.`}
            </p>
            <div className="grid">
              <div>
                <label htmlFor="reviewer">Reviewer name</label>
                <input id="reviewer" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
              </div>
              <div className="full">
                <label htmlFor="comment">Reviewer comment</label>
                <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <button className="primary" onClick={() => decide("Approved")} disabled={!reviewer.trim()}>
                Approve triage
              </button>
              <button className="danger" onClick={() => decide("Returned")} disabled={!reviewer.trim()}>
                Return to reporter
              </button>
              {!reviewer.trim() && <span className="muted small">Enter a reviewer name to enable decisions.</span>}
            </div>
            {decision && (
              <p>
                Decision recorded: <strong>{decision}</strong>
              </p>
            )}
          </section>

          <section className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0 }}>Audit log</h2>
              <button className="secondary" onClick={clearLog} disabled={log.length === 0}>
                Clear log
              </button>
            </div>
            <p className="muted small">Stored only in this browser. Newest first.</p>
            {log.length === 0 ? (
              <p className="muted">No entries yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Who</th>
                    <th>Action</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((e) => (
                    <tr key={e.id}>
                      <td>{new Date(e.at).toLocaleString()}</td>
                      <td>{e.actor}</td>
                      <td>{e.action}</td>
                      <td>{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  );
}
