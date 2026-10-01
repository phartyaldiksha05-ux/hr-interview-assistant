import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { interviewsApi } from "../api/interviews";
import { questionsApi } from "../api/questions";
import { notesApi } from "../api/notes";
import { aiApi } from "../api/ai";
import { candidatesApi } from "../api/candidates";
import { useApi } from "../hooks/useApi";
import { useCountdown, formatLocalDateTime } from "../hooks/useCountdown";
import { color, s, badge } from "../styles/theme";

const CATEGORY_LABEL = {
  technical: "Technical",
  project: "Project",
  behavioral: "Behavioral",
  role_specific: "Role-specific",
};

function QuestionsPanel({ interviewId, candidateRole }) {
  const { data: questions, loading, refetch } = useApi(() => questionsApi.list(interviewId), [interviewId]);
  const [draft, setDraft] = useState([]);
  const [targetRole, setTargetRole] = useState(candidateRole ?? "");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDraft((questions ?? []).map(({ question_text, category, rationale }) => ({ question_text, category, rationale: rationale ?? "" })));
    setDirty(false);
  }, [questions]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await aiApi.generateQuestions(interviewId, targetRole.trim() || candidateRole);
      if (result.status === "failed") {
        setError(result.error_message ?? "Question generation failed.");
      } else {
        setDraft((result.content?.questions ?? []).map((question) => ({ ...question, rationale: question.rationale ?? "" })));
        setDirty(true);
      }
    } catch (err) {
      setError(err.message ?? "Failed to generate questions");
    } finally {
      setGenerating(false);
    }
  }

  async function saveReviewedQuestions() {
    setSaving(true);
    setError(null);
    try {
      await questionsApi.save(interviewId, draft);
      await refetch();
      setDirty(false);
    } catch (err) {
      setError(err.message ?? "Could not save reviewed questions.");
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index, field, value) {
    setDraft((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, [field]: value } : question));
    setDirty(true);
  }

  return (
    <div style={s.card}>
      <div style={styles.panelHeader}>
        <h3 style={s.sectionTitle}>Interview preparation</h3>
        <button onClick={handleGenerate} disabled={generating || !targetRole.trim()} style={s.buttonSecondary}>
          {generating ? "Generating…" : questions?.length ? "Regenerate" : "Generate with AI"}
        </button>
      </div>
      <label style={s.label}>Target job role<input value={targetRole} onChange={(event) => setTargetRole(event.target.value)} maxLength={150} style={s.input} /></label>
      {error && <p style={s.errorText}>{error}</p>}
      {loading && <p style={{ color: color.textLow, fontSize: 14 }}>Loading…</p>}
      {!loading && draft.length === 0 && !error && (
        <p style={s.emptyState}>Generate resume-grounded technical, project-based, and behavioral questions for this role. Review them before using them.</p>
      )}
      {draft.length > 0 && (
        <div>
          {draft.map((question, index) => (
            <div key={`${index}-${question.category}`} style={styles.questionRow}>
              <div style={styles.questionEditHeader}><span style={badge(question.category)}>{CATEGORY_LABEL[question.category] ?? question.category}</span><label style={styles.questionCategory}>Category<select value={question.category} onChange={(event) => updateQuestion(index, "category", event.target.value)}><option value="technical">Technical</option><option value="project">Project</option><option value="behavioral">Behavioral</option><option value="role_specific">Role-specific</option></select></label></div>
              <label style={styles.questionEditLabel}>Question<textarea rows={2} value={question.question_text} onChange={(event) => updateQuestion(index, "question_text", event.target.value)} /></label>
              <label style={styles.questionEditLabel}>Why ask this?<textarea rows={2} value={question.rationale} onChange={(event) => updateQuestion(index, "rationale", event.target.value)} /></label>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}><button type="button" onClick={saveReviewedQuestions} disabled={saving || !dirty} style={s.buttonPrimary}>{saving ? "Saving…" : "Save reviewed questions"}</button><span style={{ color: color.textLow, fontSize: 12 }}>AI assists; HR decides what to ask.</span></div>
        </div>
      )}
    </div>
  );
}

function NotesPanel({ interviewId }) {
  const { data: notes, loading, error: loadError, refetch } = useApi(() => notesApi.list(interviewId), [interviewId]);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await notesApi.create(interviewId, {
        content,
        rating: rating ? Number(rating) : null,
        recommendation: recommendation || null,
      });
      setContent("");
      setRating("");
      setRecommendation("");
      await refetch();
    } catch (err) {
      setError(err.message ?? "Failed to add note");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveNote() {
    if (!editing?.content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await notesApi.update(editing.id, {
        content: editing.content,
        rating: editing.rating === "" ? null : Number(editing.rating),
        recommendation: editing.recommendation || null,
      });
      setEditing(null);
      await refetch();
    } catch (err) {
      setError(err.message ?? "Could not save the edited feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={s.card}>
      <h3 style={s.sectionTitle}>Interview notes</h3>

      <form onSubmit={handleAdd} style={{ marginBottom: 18 }}>
        <label style={s.label}>
          Note
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            style={{ ...s.input, resize: "vertical", fontFamily: "inherit" }}
            placeholder="What did you observe during the interview?"
          />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ ...s.label, flex: 1 }}>
            Rating (1–5)
            <select value={rating} onChange={(e) => setRating(e.target.value)} style={s.input}>
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label style={{ ...s.label, flex: 1 }}>
            Recommendation
            <select value={recommendation} onChange={(e) => setRecommendation(e.target.value)} style={s.input}>
              <option value="">—</option>
              <option value="pending">Pending</option>
              <option value="selected">Selected</option>
              <option value="hold">Hold</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>
        {error && <p style={s.errorText}>{error}</p>}
        <button type="submit" disabled={submitting} style={s.buttonPrimary}>
          {submitting ? "Saving…" : "Add note"}
        </button>
      </form>

      {loadError && <div role="alert"><p style={s.errorText}>{loadError}</p><button type="button" onClick={refetch} style={s.buttonSecondary}>Retry loading notes</button></div>}
      {error && <p role="alert" style={s.errorText}>{error}</p>}
      {loading && <p style={{ color: color.textLow, fontSize: 14 }} role="status">Loading saved notes…</p>}
      {!loading && !loadError && notes?.length === 0 && <p style={s.emptyState}>No notes or feedback recorded yet.</p>}
      {notes?.map((note) => (
        <div key={note.id} style={styles.noteRow}>
          {editing?.id === note.id ? (
            <div>
              <label style={s.label}>HR note<textarea rows={3} value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} style={{ ...s.input, resize: "vertical" }} /></label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label style={{ ...s.label, flex: 1 }}>Rating<select value={editing.rating} onChange={(event) => setEditing({ ...editing, rating: event.target.value })} style={s.input}><option value="">Not rated</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
                <label style={{ ...s.label, flex: 1 }}>Feedback<select value={editing.recommendation} onChange={(event) => setEditing({ ...editing, recommendation: event.target.value })} style={s.input}><option value="">Not recorded</option><option value="pending">Pending</option><option value="selected">Selected</option><option value="hold">Hold</option><option value="rejected">Rejected</option></select></label>
              </div>
              <div style={{ display: "flex", gap: 8 }}><button type="button" onClick={saveNote} disabled={submitting} style={s.buttonPrimary}>{submitting ? "Saving…" : "Save feedback"}</button><button type="button" onClick={() => setEditing(null)} style={s.buttonSecondary}>Discard edits</button></div>
            </div>
          ) : (
            <>
              <div style={styles.noteMeta}>{note.rating != null && <span style={styles.ratingChip}>★ {note.rating} / 5</span>}{note.recommendation && <span style={badge(note.recommendation)}>{note.recommendation}</span>}<button type="button" onClick={() => setEditing({ id: note.id, content: note.content, rating: note.rating == null ? "" : String(note.rating), recommendation: note.recommendation ?? "" })} style={s.buttonSecondary}>Edit</button></div>
              <div style={{ fontSize: 14, color: color.textHigh, whiteSpace: "pre-wrap" }}>{note.content}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const SUMMARY_LIST_FIELDS = [
  ["skills_discussed", "Skills discussed"],
  ["candidate_responses_observations", "Candidate responses and observations"],
  ["strengths", "Strengths supported by notes"],
  ["areas_for_further_assessment", "Areas for further assessment"],
  ["suggested_follow_up_topics", "Suggested follow-up topics"],
];

function summaryToDraft(summary) {
  return {
    overview: summary?.overview ?? summary?.overall_summary ?? "",
    skills_discussed: (summary?.skills_discussed ?? summary?.technical_observations ?? []).join("\n"),
    candidate_responses_observations: (summary?.candidate_responses_observations ?? []).join("\n"),
    strengths: (summary?.strengths ?? []).join("\n"),
    areas_for_further_assessment: (summary?.areas_for_further_assessment ?? summary?.concerns ?? []).join("\n"),
    suggested_follow_up_topics: (summary?.suggested_follow_up_topics ?? summary?.suggested_follow_up ?? []).join("\n"),
  };
}

function summaryToContent(draft) {
  return {
    overview: draft.overview.trim(),
    ...Object.fromEntries(SUMMARY_LIST_FIELDS.map(([field]) => [field, draft[field].split("\n").map((item) => item.trim()).filter(Boolean)])),
  };
}

function PostSummaryPanel({ interviewId }) {
  const { data: savedGeneration, loading, error: loadError, refetch } = useApi(() => aiApi.getPostSummary(interviewId), [interviewId]);
  const [generation, setGeneration] = useState(null);
  const [draft, setDraft] = useState(() => summaryToDraft(null));
  const [dirty, setDirty] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setGeneration(savedGeneration);
    setDraft(summaryToDraft(savedGeneration?.content));
    setDirty(false);
  }, [savedGeneration]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await aiApi.generatePostSummary(interviewId);
      if (result.status === "failed") {
        setError(result.error_message ?? "Summary generation failed.");
      } else {
        setGeneration(result);
        setDraft(summaryToDraft(result.content));
        setDirty(true);
      }
    } catch (err) {
      setError(err.message ?? "The interview summary could not be generated. Your notes are still saved; retry when the provider is available.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveSummary() {
    setSaving(true);
    setError(null);
    try {
      const result = await aiApi.savePostSummary(interviewId, summaryToContent(draft));
      setGeneration(result);
      setDraft(summaryToDraft(result.content));
      setDirty(false);
    } catch (err) {
      setError(err.message ?? "Could not save the edited summary.");
    } finally {
      setSaving(false);
    }
  }

  const summary = generation?.status === "completed" ? generation.content : null;

  return (
    <div style={s.card}>
      <div style={styles.panelHeader}>
        <h3 style={s.sectionTitle}>Post-interview summary</h3>
        <button onClick={handleGenerate} disabled={generating || loading} style={s.buttonSecondary}>
          {generating ? "Generating summary…" : summary ? "Regenerate summary" : error ? "Retry generation" : "Generate interview summary"}
        </button>
      </div>
      <p style={s.emptyState}>Summary content is based only on recorded HR notes and feedback. Hiring decisions remain with HR.</p>
      {loading && <p style={s.emptyState} role="status">Loading saved summary…</p>}
      {(error || loadError) && <p role="alert" style={s.errorText}>{error ?? loadError}</p>}
      {loadError && <button type="button" onClick={refetch} style={s.buttonSecondary}>Retry loading summary</button>}
      {!loading && !summary && !error && !loadError && <p style={s.emptyState}>Add notes and feedback, then generate an interview summary.</p>}
      {summary && (
        <div className="interview-summary-editor">
          <label style={s.label}>Overview<textarea rows={3} value={draft.overview} onChange={(event) => { setDraft({ ...draft, overview: event.target.value }); setDirty(true); }} style={{ ...s.input, resize: "vertical" }} /></label>
          {SUMMARY_LIST_FIELDS.map(([field, label]) => <label key={field} style={s.label}>{label}<textarea rows={3} value={draft[field]} onChange={(event) => { setDraft({ ...draft, [field]: event.target.value }); setDirty(true); }} style={{ ...s.input, resize: "vertical" }} placeholder="One item per line" /></label>)}
          <button type="button" onClick={saveSummary} disabled={!dirty || saving || !draft.overview.trim()} style={s.buttonPrimary}>{saving ? "Saving summary…" : "Save final summary"}</button>
        </div>
      )}
    </div>
  );
}

function CandidateContextPanel({ candidateId }) {
  const { data: context, loading, error, refetch } = useApi(async () => {
    const [candidate, resumes, briefing] = await Promise.all([
      candidatesApi.get(candidateId),
      candidatesApi.resumes(candidateId),
      aiApi.getSummary(candidateId),
    ]);
    return { candidate, resumes, briefing };
  }, [candidateId]);
  const [downloadError, setDownloadError] = useState(null);
  const latestResume = context?.resumes?.[0];

  async function downloadResume() {
    if (!latestResume) return;
    setDownloadError(null);
    try {
      await candidatesApi.downloadResume(candidateId, latestResume.id, latestResume.original_filename);
    } catch (err) {
      setDownloadError(err.message ?? "Could not download the resume.");
    }
  }

  return (
    <section style={{ ...s.card, gridColumn: "1 / -1" }}>
      <div style={styles.panelHeader}><h3 style={s.sectionTitle}>Candidate preparation</h3>{context?.candidate && <Link to={`/candidates/${candidateId}`} style={styles.contextLink}>Open candidate profile ↗</Link>}</div>
      {loading && <p style={s.emptyState} role="status">Loading candidate resume and briefing…</p>}
      {error && <div role="alert"><p style={s.errorText}>{error}</p><button type="button" onClick={refetch} style={s.buttonSecondary}>Retry loading candidate context</button></div>}
      {context && <div className="interview-candidate-context">
        <div><span style={styles.blockLabel}>Candidate</span><strong>{context.candidate.name}</strong><span>{context.candidate.email}</span><span>{context.candidate.phone || "No phone added"}</span><span>{context.candidate.job_role}</span></div>
        <div><span style={styles.blockLabel}>Latest resume</span>{latestResume ? <><strong>{latestResume.original_filename}</strong><span>Text extraction: {latestResume.parse_status.replaceAll("_", " ")}</span><button type="button" onClick={downloadResume} style={s.buttonSecondary}>View / Download resume</button></> : <span>No resume is on file.</span>}</div>
        <div><span style={styles.blockLabel}>AI briefing</span><span>{context.briefing?.status === "completed" ? context.briefing.content?.overview : context.briefing?.error_message ?? "No saved briefing yet."}</span><Link to={`/candidates/${candidateId}#briefing`} style={styles.contextLink}>Open AI candidate briefing ↗</Link></div>
      </div>}
      {downloadError && <p role="alert" style={s.errorText}>{downloadError}</p>}
    </section>
  );
}

const actionButtonBase = {
  minHeight: 40,
  padding: "0.62rem 1.1rem",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const actionButtonSecondary = {
  ...actionButtonBase,
  background: color.surface,
  color: color.textHigh,
  border: `1px solid ${color.borderStrong}`,
};

const actionButtonDanger = {
  ...actionButtonBase,
  background: color.surface,
  color: color.alarm,
  border: `1px solid ${color.alarm}`,
};

export default function InterviewDetail() {
  const { id } = useParams();
  const { data: interview, error, loading, refetch } = useApi(() => interviewsApi.get(id), [id]);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDateTime, setNewDateTime] = useState("");
  const [actionError, setActionError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const countdown = useCountdown(interview?.scheduled_at ?? new Date().toISOString());

  async function handleReschedule(e) {
    e.preventDefault();
    if (!newDateTime) return;
    const localDate = new Date(newDateTime);
    if (Number.isNaN(localDate.getTime()) || localDate <= new Date()) {
      setActionError("Choose a future date and time.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await interviewsApi.update(id, { scheduled_at: localDate.toISOString(), status: "scheduled" });
      setRescheduling(false);
      await refetch();
    } catch (err) {
      setActionError(err.message ?? "Failed to reschedule");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this interview? Pending reminders will be cancelled too.")) return;
    try {
      await interviewsApi.update(id, { status: "cancelled" });
      await refetch();
    } catch (err) {
      setActionError(err.message ?? "Failed to cancel");
    }
  }

  async function updateInterviewStatus(status) {
    setSubmitting(true);
    setActionError(null);
    try {
      await interviewsApi.update(id, { status });
      await refetch();
    } catch (err) {
      setActionError(err.message ?? "Could not update the interview status.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p style={{ color: color.textLow }} role="status">Loading interview workspace…</p>;
  if (error) return <div role="alert" style={s.card}><p style={s.errorText}>{error}</p><button type="button" onClick={refetch} style={s.buttonSecondary}>Retry loading interview</button></div>;
  if (!interview) return <div style={s.card}><h1 style={s.sectionTitle}>Interview not found</h1><p style={s.emptyState}>This interview may have been removed or may belong to another workspace.</p><Link to="/interviews" style={styles.backLink}>Back to interviews</Link></div>;

  const { date, time } = formatLocalDateTime(interview.scheduled_at);

  return (
    <div>
      <Link to="/interviews" style={styles.backLink}>← Back to interviews</Link>

      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>{interview.candidate_name}</h1>
          <div style={{ color: color.textLow, fontSize: 14, marginTop: 4 }}>{interview.candidate_email}</div>
        </div>
        <span style={badge(interview.status)}>{interview.status}</span>
      </div>

      <div style={styles.grid}>
        <div style={{ ...s.card, gridColumn: "1 / -1" }}>
          <div style={styles.infoRow}>
            <div>
              <div style={styles.blockLabel}>Date &amp; time</div>
              <div style={{ fontSize: 15 }}>{date} at {time}</div>
              {interview.status === "scheduled" && <div style={{ color: color.accentText, fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{countdown}</div>}
            </div>
            <div>
              <div style={styles.blockLabel}>Interviewer</div>
              <div style={{ fontSize: 15 }}>{interview.interviewer ?? "—"}</div>
            </div>
            <div>
              <div style={styles.blockLabel}>Type</div>
              <div style={{ fontSize: 15, textTransform: "capitalize" }}>{interview.interview_type}</div>
            </div>
            <div>
              <div style={styles.blockLabel}>Duration</div>
              <div style={{ fontSize: 15 }}>{interview.duration_minutes} min</div>
            </div>
          </div>

          {actionError && <p style={s.errorText}>{actionError}</p>}

          {rescheduling ? (
            <form onSubmit={handleReschedule} style={styles.rescheduleForm}>
              <label style={{ ...s.label, minWidth: 240 }}>
                New date and time
                <input type="datetime-local" min={minimumLocalDateTime()} value={newDateTime} onChange={(e) => setNewDateTime(e.target.value)} style={s.input} required />
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", paddingBottom: 14 }}>
                <button type="submit" disabled={submitting} style={s.buttonPrimary}>Confirm</button>
                <button type="button" onClick={() => setRescheduling(false)} style={s.buttonSecondary}>Cancel</button>
              </div>
            </form>
          ) : (
            <div style={styles.actionRow}>
              {interview.meeting_link && interview.status === "scheduled" && (
                <a
                  href={interview.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...s.buttonPrimary,
                    background: color.surface,
                    border: `1px solid ${color.border}`,
                    color: color.textHigh,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Join interview
                </a>
              )}

              {interview.status === "scheduled" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDateTime(toLocalInputValue(interview.scheduled_at));
                      setRescheduling(true);
                    }}
                    style={actionButtonSecondary}
                  >
                    Reschedule
                  </button>

                  <button
                    type="button"
                    onClick={() => updateInterviewStatus("completed")}
                    disabled={submitting}
                    style={actionButtonSecondary}
                  >
                    Mark completed
                  </button>

                  <button
                    type="button"
                    onClick={() => updateInterviewStatus("no_show")}
                    disabled={submitting}
                    style={actionButtonSecondary}
                  >
                    Mark no-show
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={submitting}
                    style={actionButtonDanger}
                  >
                    Cancel interview
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <CandidateContextPanel candidateId={interview.candidate_id} />
        <QuestionsPanel interviewId={id} candidateRole={interview.candidate_job_role} />
        <NotesPanel interviewId={id} />
        <div style={{ gridColumn: "1 / -1" }}>
          <PostSummaryPanel interviewId={id} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  backLink: { color: color.textLow, fontSize: 13.5, textDecoration: "none", display: "inline-block", marginBottom: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  infoRow: { display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 18 },
  blockLabel: { fontSize: 12, color: color.textLow, fontWeight: 600, marginBottom: 4 },
  actionRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    paddingTop: 4,
  },
  rescheduleForm: { display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  questionRow: { padding: "12px 0", borderBottom: `1px solid ${color.border}` },
  questionMeta: { marginBottom: 6 },
  questionText: { fontSize: 14.5, color: color.textHigh, fontWeight: 500 },
  questionRationale: { fontSize: 13, color: color.textLow, marginTop: 3 },
  questionEditHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 9 },
  questionCategory: { display: "flex", alignItems: "center", gap: 7, color: color.textLow, fontSize: 11 },
  questionEditLabel: { display: "block", marginBottom: 8, color: color.textMid, fontSize: 11, fontWeight: 600 },
  noteRow: { padding: "12px 0", borderBottom: `1px solid ${color.border}` },
  noteMeta: { display: "flex", gap: 8, marginBottom: 6 },
  ratingChip: { fontSize: 12.5, fontWeight: 600, color: color.accentText, background: color.accentSoft, padding: "3px 10px", borderRadius: 999 },
  list: { margin: 0, paddingLeft: 18, fontSize: 14 },
};

function toLocalInputValue(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function minimumLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
