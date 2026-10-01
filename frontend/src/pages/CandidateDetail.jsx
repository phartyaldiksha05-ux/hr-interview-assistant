import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { candidatesApi } from "../api/candidates";
import { interviewsApi } from "../api/interviews";
import { aiApi } from "../api/ai";
import { notesApi } from "../api/notes";
import ResumeUploadForm from "../components/ResumeUploadForm";
import { useApi } from "../hooks/useApi";
import { formatLocalDateTime } from "../hooks/useCountdown";
import { color, s, badge } from "../styles/theme";

function SummaryPanel({ candidateId, hasResume }) {
  const {
    data: savedGeneration,
    loading,
    error: loadError,
    refetch,
  } = useApi(() => aiApi.getSummary(candidateId), [candidateId]);

  const [generation, setGeneration] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => setGeneration(savedGeneration), [savedGeneration]);

  async function generateSummary() {
    setGenerating(true);
    setActionError(null);

    try {
      const result = await aiApi.generateSummary(candidateId);
      setGeneration(result);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerate() {
    try {
      await generateSummary();
    } catch (err) {
      setActionError(
        err.message ??
          "Could not generate the briefing. Retry when the AI provider is available."
      );
    }
  }

  const summary =
    generation?.status === "completed" ? generation.content : null;

  const error =
    actionError ??
    (generation?.status === "failed"
      ? generation.error_message
      : null) ??
    loadError;

  return (
    <div style={s.card}>
      <div style={styles.panelHeader}>
        <h3 style={s.sectionTitle}>AI candidate summary</h3>

        <button
          onClick={handleGenerate}
          disabled={generating || !hasResume}
          style={s.buttonSecondary}
        >
          {generating
            ? "Generating briefing…"
            : summary
            ? "Refresh briefing"
            : error
            ? "Retry generation"
            : "Generate briefing"}
        </button>
      </div>

      {!hasResume && (
        <p style={s.emptyState}>
          Upload a resume first — the summary is generated from its extracted
          text.
        </p>
      )}

      {loading && (
        <p style={s.emptyState}>Checking for a saved briefing…</p>
      )}

      {generating && (
        <p style={s.emptyState} role="status">
          Reviewing the resume for evidence-backed context…
        </p>
      )}

      {error && <p style={s.errorText}>{error}</p>}

      {loadError && (
        <button
          type="button"
          onClick={refetch}
          style={s.buttonSecondary}
        >
          Retry loading briefing
        </button>
      )}

      {!summary &&
        hasResume &&
        !error &&
        !loading &&
        !generating && (
          <p style={s.emptyState}>No briefing is available yet.</p>
        )}

      {summary && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <p style={{ fontSize: 14, margin: 0 }}>{summary.overview}</p>

          {(summary.technical_skills?.length > 0 ||
            summary.skills?.length > 0 ||
            summary.relevant_technologies?.length > 0) && (
            <div>
              <div style={styles.blockLabel}>Technical skills</div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {(
                  summary.technical_skills ??
                  summary.skills ??
                  summary.relevant_technologies
                ).map((skill, i) => {
                  const name =
                    typeof skill === "string" ? skill : skill.name;

                  const evidence =
                    typeof skill === "string" ? null : skill.evidence;

                  return (
                    <span
                      key={`${name}-${i}`}
                      style={styles.skillChip}
                      title={evidence ?? undefined}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {summary.relevant_experience?.length > 0 && (
            <div>
              <div style={styles.blockLabel}>Relevant experience</div>

              <ul style={styles.list}>
                {summary.relevant_experience.map((item, i) => (
                  <li key={i}>
                    <strong>{item.title_or_role}</strong>
                    {item.organization
                      ? ` · ${item.organization}`
                      : ""}

                    {item.evidence ? (
                      <div style={styles.evidenceQuote}>
                        “{item.evidence}”
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.projects?.length > 0 && (
            <div>
              <div style={styles.blockLabel}>Projects</div>

              <ul style={styles.list}>
                {summary.projects.map((project, i) => (
                  <li key={i}>
                    <strong>{project.name}</strong>
                    {project.description
                      ? `: ${project.description}`
                      : ""}

                    {project.technologies?.length > 0 ? (
                      <div style={styles.evidenceQuote}>
                        Resume-listed technologies:{" "}
                        {project.technologies.join(", ")}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary.strengths?.length > 0 && (
            <div>
              <div style={styles.blockLabel}>Strengths</div>

              <ul style={styles.list}>
                {summary.strengths.map((item, i) => (
                  <li key={i}>
                    {typeof item === "string" ? (
                      item
                    ) : (
                      <>
                        {item.claim}

                        {typeof item.evidence_quote === "string" &&
                          item.evidence_quote.trim() && (
                            <div style={styles.evidenceQuote}>
                              Supported by resume: “
                              {item.evidence_quote}”
                            </div>
                          )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(summary.suggested_interview_areas?.length > 0 ||
            summary.interview_focus_areas?.length > 0) && (
            <div>
              <div style={styles.blockLabel}>
                Suggested areas to explore
              </div>

              <ul style={styles.list}>
                {(
                  summary.suggested_interview_areas ??
                  summary.interview_focus_areas
                ).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.education?.length > 0 && (
            <div>
              <div style={styles.blockLabel}>Education listed</div>

              <ul style={styles.list}>
                {summary.education.map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.missing_information?.length > 0 && (
            <div>
              <div style={styles.blockLabel}>Missing from resume</div>

              <ul style={styles.list}>
                {summary.missing_information.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CandidateQuestionsPanel({ candidate }) {
  const {
    data: savedGeneration,
    loading,
    error: loadError,
    refetch,
  } = useApi(
    () => aiApi.getCandidateQuestions(candidate.id),
    [candidate.id]
  );

  const [generation, setGeneration] = useState(null);
  const [targetJobRole, setTargetJobRole] = useState(candidate.job_role);
  const [draft, setDraft] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setGeneration(savedGeneration);
    setDraft(savedGeneration?.content?.questions ?? []);
    setDirty(false);
  }, [savedGeneration]);

  async function generateQuestions() {
    setGenerating(true);
    setError(null);

    try {
      const result = await aiApi.generateCandidateQuestions(
        candidate.id,
        targetJobRole.trim()
      );

      setGeneration(result);
      setDraft(result.content?.questions ?? []);
      setDirty(result.status === "completed");
    } catch (err) {
      setError(
        err.message ??
          "Could not generate interview questions. Retry when the AI provider is available."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function saveQuestions() {
    setSaving(true);
    setError(null);

    try {
      const result = await aiApi.saveCandidateQuestions(
        candidate.id,
        draft
      );

      setGeneration(result);
      setDraft(result.content?.questions ?? []);
      setDirty(false);
    } catch (err) {
      setError(
        err.message ?? "Could not save reviewed questions."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateQuestion(index, field, value) {
    setDraft((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index
          ? { ...question, [field]: value }
          : question
      )
    );

    setDirty(true);
  }

  const generationError =
    generation?.status === "failed"
      ? generation.error_message
      : null;

  return (
    <div style={s.card}>
      <div style={styles.panelHeader}>
        <h3 style={s.sectionTitle}>Interview preparation</h3>

        <button
          type="button"
          onClick={generateQuestions}
          disabled={
            !candidate.has_resume ||
            generating ||
            !targetJobRole.trim()
          }
          style={s.buttonSecondary}
        >
          {generating
            ? "Generating questions…"
            : draft.length
            ? "Regenerate questions"
            : "Generate interview questions"}
        </button>
      </div>

      <label style={s.label}>
        Target job role
        <input
          value={targetJobRole}
          onChange={(event) =>
            setTargetJobRole(event.target.value)
          }
          maxLength={150}
          style={s.input}
        />
      </label>

      {!candidate.has_resume && (
        <p style={s.emptyState}>
          Upload a text-based PDF to generate resume-grounded
          questions.
        </p>
      )}

      {loading && (
        <p style={s.emptyState}>Loading saved questions…</p>
      )}

      {(error || generationError || loadError) && (
        <p style={s.errorText} role="alert">
          {error ?? generationError ?? loadError}
        </p>
      )}

      {loadError && (
        <button
          type="button"
          onClick={refetch}
          style={s.buttonSecondary}
        >
          Retry loading questions
        </button>
      )}

      {!loading &&
        draft.length === 0 &&
        !error &&
        !generationError && (
          <p style={s.emptyState}>
            Generate technical, project-based, behavioral, and
            role-specific questions from the resume and target role.
          </p>
        )}

      <div style={styles.questionsList}>
        {draft.map((question, index) => (
          <div
            key={`${index}-${question.category}`}
            style={styles.questionCard}
          >
            <div style={styles.questionHeader}>
              <strong>Question {index + 1}</strong>

              <select
                aria-label={`Category for question ${index + 1}`}
                value={question.category}
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "category",
                    event.target.value
                  )
                }
                style={styles.categorySelect}
              >
                <option value="technical">Technical</option>
                <option value="project">Project-based</option>
                <option value="behavioral">Behavioral</option>
                <option value="role_specific">
                  Role-specific
                </option>
              </select>
            </div>

            <label style={styles.questionField}>
              <span style={styles.fieldLabel}>
                Interview question
              </span>

              <textarea
                rows={3}
                value={question.question_text}
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "question_text",
                    event.target.value
                  )
                }
                style={styles.questionTextarea}
              />
            </label>

            <label style={styles.questionField}>
              <span style={styles.fieldLabel}>
                Resume-grounded rationale
              </span>

              <textarea
                rows={3}
                value={question.rationale ?? ""}
                onChange={(event) =>
                  updateQuestion(
                    index,
                    "rationale",
                    event.target.value
                  )
                }
                style={styles.questionTextarea}
              />
            </label>
          </div>
        ))}
      </div>

      {draft.length > 0 && (
        <button
          type="button"
          onClick={saveQuestions}
          disabled={!dirty || saving}
          style={{
            ...s.buttonPrimary,
            marginTop: 12,
          }}
        >
          {saving
            ? "Saving reviewed questions…"
            : "Save reviewed questions"}
        </button>
      )}
    </div>
  );
}

export default function CandidateDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    data: candidate,
    loading,
    error,
    refetch,
  } = useApi(() => candidatesApi.get(id), [id]);

  const {
    data: resumes,
    loading: resumesLoading,
    error: resumesError,
    refetch: refetchResumes,
  } = useApi(() => candidatesApi.resumes(id), [id]);

  const {
    data: interviews,
    loading: interviewsLoading,
    error: interviewsError,
  } = useApi(() => interviewsApi.list(), []);

  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [resumeActionError, setResumeActionError] = useState(null);
  const [hrNotes, setHrNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(null);
  const resumePickerOpened = useRef(false);

  useEffect(() => {
    if (
      !location.state?.openResumePicker ||
      loading ||
      !candidate ||
      resumePickerOpened.current
    ) {
      return;
    }

    resumePickerOpened.current = true;
    setShowResumeUpload(true);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [
    candidate,
    loading,
    location.pathname,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (!interviews) return;

    let cancelled = false;

    const relevantInterviews = interviews.filter(
      (interview) => interview.candidate_id === id
    );

    setNotesLoading(true);
    setNotesError(null);

    Promise.all(
      relevantInterviews.map(async (interview) => {
        const notes = await notesApi.list(interview.id);

        return notes.map((note) => ({
          ...note,
          interview,
        }));
      })
    )
      .then((results) => {
        if (!cancelled) {
          setHrNotes(
            results
              .flat()
              .sort(
                (a, b) =>
                  new Date(b.created_at) -
                  new Date(a.created_at)
              )
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setNotesError(
            err.message ?? "Could not load HR notes."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setNotesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, interviews]);

  async function handleResumeComplete(candidateId) {
    setShowResumeUpload(false);

    if (candidateId && candidateId !== id) {
      navigate(`/candidates/${candidateId}`, {
        replace: true,
      });
      return;
    }

    await refetch();
    await refetchResumes();
  }

  async function handleDownloadResume(resume) {
    setResumeActionError(null);

    try {
      await candidatesApi.downloadResume(
        id,
        resume.id,
        resume.original_filename
      );
    } catch (err) {
      setResumeActionError(
        err.message ??
          "Could not download this resume. Please retry."
      );
    }
  }

  if (loading) {
    return (
      <p style={{ color: color.textLow }} role="status">
        Loading candidate profile…
      </p>
    );
  }

  if (error) {
    return (
      <div role="alert" style={s.card}>
        <p style={s.errorText}>{error}</p>

        <button
          type="button"
          onClick={refetch}
          style={s.buttonSecondary}
        >
          Retry loading profile
        </button>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div style={s.card}>
        <h1 style={s.sectionTitle}>Candidate not found</h1>

        <p style={s.emptyState}>
          This profile may have been archived, or you may no
          longer have access to it. Existing records were not
          removed by this request.
        </p>

        <Link to="/candidates" style={styles.backLink}>
          Back to candidates
        </Link>
      </div>
    );
  }

  const candidateInterviews = (interviews ?? []).filter(
    (iv) => iv.candidate_id === id
  );

  const latestResume = resumes?.[0];

  const hasResume =
    candidate.has_resume ??
    Boolean(
      resumes?.some(
        (resume) => resume.parse_status === "completed"
      )
    );

  const hasStoredResume = Boolean(resumes?.length);

  return (
    <div className="candidate-profile">
      <Link to="/candidates" style={styles.backLink}>
        ← Back to candidates
      </Link>

      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {candidate.name}
          </h1>

          <div className="candidate-contact-details">
            <span>{candidate.email}</span>
            <span>
              {candidate.phone || "No phone added"}
            </span>
            <span>{candidate.job_role}</span>
          </div>
        </div>

        <div className="candidate-profile-actions">
          <span style={badge(candidate.status)}>
            {candidate.status}
          </span>

          <button
  type="button"
  onClick={() => navigate(`/interviews?candidate=${id}`)}
  style={{
    ...s.buttonPrimary,
    background: "#14231f",
    color: "#ffffff",
    border: "1px solid #14231f",
  }}
>
  Schedule interview
</button>
        </div>
      </div>

      <div
        className="candidate-profile-grid"
        style={styles.grid}
      >
        {showResumeUpload && (
          <div style={{ gridColumn: "1 / -1" }}>
            <ResumeUploadForm
              existingCandidate={candidate}
              hasExistingResume={hasStoredResume}
              onCancel={() => setShowResumeUpload(false)}
              onComplete={handleResumeComplete}
            />
          </div>
        )}

        <div style={s.card}>
          <div style={styles.panelHeader}>
            <h3 style={s.sectionTitle}>Resume</h3>

            <button
              type="button"
              onClick={() => setShowResumeUpload(true)}
              style={s.buttonSecondary}
            >
              {hasStoredResume
                ? "Replace resume"
                : "Upload PDF"}
            </button>
          </div>

          {resumesLoading && (
            <p style={s.emptyState} role="status">
              Loading resume details…
            </p>
          )}

          {resumesError && (
            <div role="alert">
              <p style={s.errorText}>{resumesError}</p>

              <button
                type="button"
                onClick={refetchResumes}
                style={s.buttonSecondary}
              >
                Retry loading resumes
              </button>
            </div>
          )}

          {latestResume ? (
            <div>
              <p
                style={{
                  fontSize: 13,
                  color:
                    latestResume.parse_status === "completed"
                      ? color.success
                      : color.alarm,
                  fontWeight: 600,
                  margin: "0 0 5px",
                  textTransform: "capitalize",
                }}
              >
                Resume{" "}
                {latestResume.parse_status.replaceAll("_", " ")}
              </p>

              <p
                style={{
                  color: color.textHigh,
                  fontSize: 13,
                  margin: 0,
                  overflowWrap: "anywhere",
                }}
              >
                {latestResume.original_filename}
              </p>

              <div className="resume-profile-actions">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadResume(latestResume)
                  }
                  style={s.buttonSecondary}
                >
                  View / Download resume
                </button>

                <span
                  style={{
                    color: color.textLow,
                    fontSize: 12,
                  }}
                >
                  {latestResume.file_size_bytes
                    ? `${(
                        latestResume.file_size_bytes /
                        (1024 * 1024)
                      ).toFixed(2)} MB`
                    : "PDF"}
                </span>
              </div>

              {latestResume.parse_error && (
                <p style={s.errorText}>
                  {latestResume.parse_error}
                </p>
              )}

              {latestResume.extracted_text && (
                <details className="resume-extracted-details">
                  <summary>
                    Extracted resume information
                  </summary>

                  <pre>{latestResume.extracted_text}</pre>
                </details>
              )}
            </div>
          ) : (
            !resumesLoading &&
            !resumesError && (
              <p style={s.emptyState}>
                No resume uploaded yet.
              </p>
            )
          )}

          {resumeActionError && (
            <p role="alert" style={s.errorText}>
              {resumeActionError}
            </p>
          )}
        </div>

        <div style={s.card}>
          <div style={styles.panelHeader}>
            <h3 style={s.sectionTitle}>Interviews</h3>

            <button
              onClick={() =>
                navigate(`/interviews?candidate=${id}`)
              }
              style={s.buttonSecondary}
            >
              Schedule
            </button>
          </div>

          {interviewsLoading && (
            <p style={s.emptyState} role="status">
              Loading interview history…
            </p>
          )}

          {interviewsError && (
            <p role="alert" style={s.errorText}>
              {interviewsError}
            </p>
          )}

          {!interviewsLoading &&
            !interviewsError &&
            candidateInterviews.length === 0 && (
              <p style={s.emptyState}>
                No interviews scheduled yet.
              </p>
            )}

          {candidateInterviews.map((iv) => {
            const { date, time } = formatLocalDateTime(
              iv.scheduled_at
            );

            return (
              <Link
                key={iv.id}
                to={`/interviews/${iv.id}`}
                style={styles.interviewRow}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {date} at {time}
                  </div>

                  <div
                    style={{
                      fontSize: 12.5,
                      color: color.textLow,
                    }}
                  >
                    {iv.interviewer ?? "No interviewer set"}
                  </div>
                </div>

                <span style={badge(iv.status)}>
                  {iv.status}
                </span>
              </Link>
            );
          })}
        </div>

        <div style={s.card}>
          <div style={styles.panelHeader}>
            <h3 style={s.sectionTitle}>
              HR feedback & notes
            </h3>

            <span
              style={{
                color: color.textLow,
                fontSize: 12,
              }}
            >
              {hrNotes.length}{" "}
              {hrNotes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {notesLoading && (
            <p style={s.emptyState}>
              Loading interview notes…
            </p>
          )}

          {interviewsError && (
            <p style={s.errorText}>{interviewsError}</p>
          )}

          {notesError && (
            <p style={s.errorText}>{notesError}</p>
          )}

          {!notesLoading &&
            !notesError &&
            hrNotes.length === 0 && (
              <p style={s.emptyState}>
                Feedback added to interviews will appear here.
              </p>
            )}

          {!notesLoading &&
            hrNotes.map((note) => (
              <article
                key={note.id}
                style={styles.noteItem}
              >
                <div style={styles.noteMeta}>
                  <Link
                    to={`/interviews/${note.interview.id}`}
                    style={styles.noteInterview}
                  >
                    {
                      formatLocalDateTime(
                        note.interview.scheduled_at
                      ).date
                    }{" "}
                    interview
                  </Link>

                  <time>
                    {new Date(
                      note.created_at
                    ).toLocaleDateString()}
                  </time>
                </div>

                <p style={styles.noteContent}>
                  {note.content}
                </p>

                <div style={styles.noteTags}>
                  {note.rating != null && (
                    <span>
                      {note.rating}/5 rating
                    </span>
                  )}

                  {note.recommendation && (
                    <span
                      style={badge(note.recommendation)}
                    >
                      {note.recommendation}
                    </span>
                  )}
                </div>
              </article>
            ))}
        </div>

        <div
          id="briefing"
          style={{ gridColumn: "1 / -1" }}
        >
          <SummaryPanel
            candidateId={id}
            hasResume={hasResume}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <CandidateQuestionsPanel
            candidate={candidate}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  backLink: {
    display: "inline-block",
    marginBottom: 18,
    color: color.ink,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
    gap: 18,
  },

  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },

  blockLabel: {
    color: color.textMid,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },

  skillChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    border: `1px solid ${color.border}`,
    borderRadius: 8,
    background: color.canvas,
    color: color.textHigh,
    fontSize: 12,
    overflowWrap: "anywhere",
  },

  list: {
    margin: 0,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontSize: 13,
    lineHeight: 1.6,
  },

  evidenceQuote: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 1.5,
    color: color.textLow,
    overflowWrap: "anywhere",
  },

  interviewRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 0",
    borderBottom: `1px solid ${color.border}`,
    textDecoration: "none",
    color: color.textHigh,
  },

  noteItem: {
    padding: "12px 0",
    borderBottom: `1px solid ${color.border}`,
  },

  noteMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 12,
    color: color.textLow,
  },

  noteInterview: {
    color: color.ink,
    textDecoration: "none",
    fontWeight: 600,
  },

  noteContent: {
    margin: "8px 0",
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  },

  noteTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    fontSize: 12,
    color: color.textMid,
  },

  questionsList: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    marginTop: 20,
  },

  questionCard: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: 20,
    border: `1px solid ${color.border}`,
    borderRadius: 12,
    background: color.canvas,
  },

  questionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },

  categorySelect: {
    ...s.input,
    maxWidth: "100%",
  },

  questionField: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "100%",
    minWidth: 0,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: color.textMid,
  },

  questionTextarea: {
    ...s.input,
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    minHeight: 90,
    lineHeight: 1.6,
    resize: "vertical",
  },
};