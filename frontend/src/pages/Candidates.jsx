
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { candidatesApi } from "../api/candidates";
import { useApi } from "../hooks/useApi";
import CandidateForm from "../components/CandidateForm";
import ResumeUploadForm from "../components/ResumeUploadForm";
import { badge } from "../styles/theme";

const STATUS_LABELS = {
  new: "New",
  scheduled: "Interview Scheduled",
  interviewed: "Interviewed",
  hired: "Hired",
  rejected: "Rejected",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Unknown";
}

export default function Candidates() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showArchived, setShowArchived] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const {
    data: candidates,
    error,
    loading,
    refetch,
  } = useApi(
    () =>
      showArchived
        ? candidatesApi.archived()
        : candidatesApi.list(),
    [showArchived]
  );

  const [showUpload, setShowUpload] = useState(
    Boolean(
      location.state?.openCreate ||
      location.state?.openUpload
    )
  );

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list = candidates ?? [];

    if (!normalizedQuery) {
      return list;
    }

    return list.filter((candidate) =>
      [
        candidate.name,
        candidate.email,
        candidate.phone,
        candidate.job_role,
        getStatusLabel(candidate.status),
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedQuery)
      )
    );
  }, [candidates, query]);

  async function handleUpdate(values) {
    if (!formMode?.id) {
      setActionError("Unable to identify the candidate to update.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      await candidatesApi.update(formMode.id, values);
      setFormMode(null);
      await refetch();
    } catch (updateError) {
      setActionError(
        updateError?.message || "Failed to update candidate."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(candidate) {
    if (busyAction) return;

    const confirmed = window.confirm(
      `Archive ${candidate.name} from the active list? Their resume and interview history will be retained and can be restored.`
    );

    if (!confirmed) return;

    setActionError(null);
    setBusyAction(`archive:${candidate.id}`);

    try {
      await candidatesApi.remove(candidate.id);
      await refetch();
    } catch (deleteError) {
      setActionError(
        deleteError?.message || "Failed to archive candidate."
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRestore(candidate) {
    if (busyAction) return;

    setActionError(null);
    setBusyAction(`restore:${candidate.id}`);

    try {
      await candidatesApi.restore(candidate.id);
      await refetch();
    } catch (restoreError) {
      setActionError(
        restoreError?.message || "Could not restore this candidate."
      );
    } finally {
      setBusyAction(null);
    }
  }

  function openAddCandidate() {
    setFormMode(null);
    setActionError(null);
    setShowUpload(true);
  }

  function finishUpload(candidateId) {
    setShowUpload(false);
    navigate(`/candidates/${candidateId}`);
  }

  function toggleArchived() {
    setShowArchived((value) => !value);
    setShowUpload(false);
    setFormMode(null);
    setActionError(null);
    setQuery("");
  }

  const isSearching = query.trim().length > 0;

  return (
    <div className="candidate-page">
      <header className="directory-header">
        <div>
          <span className="workspace-overline">
            PEOPLE &amp; PIPELINE
          </span>

          <h1>Candidates</h1>

          <p>
            Keep profiles, resume context, and interview
            preparation together.
          </p>
        </div>

        <div className="directory-actions">
          <button
            className="workspace-secondary-action"
            type="button"
            onClick={toggleArchived}
            disabled={Boolean(busyAction)}
          >
            {showArchived
              ? "Active candidates"
              : "Archived candidates"}
          </button>

          <button
            className="workspace-primary-action"
            type="button"
            onClick={openAddCandidate}
            disabled={Boolean(busyAction)}
          >
            ＋ Add Candidate
          </button>
        </div>
      </header>

      {showUpload && (
        <ResumeUploadForm
          onCancel={() => setShowUpload(false)}
          onComplete={async (candidateId) => {
            await refetch();
            finishUpload(candidateId);
          }}
        />
      )}

      {formMode && (
        <CandidateForm
          initialValues={formMode}
          onSubmit={handleUpdate}
          onCancel={() => setFormMode(null)}
          submitting={submitting}
        />
      )}

      {actionError && (
        <p
          className="workspace-inline-error"
          role="alert"
        >
          {actionError}
        </p>
      )}

      {!showUpload && (
        <section
          className="candidate-directory"
          aria-label="Candidate directory"
        >
          <div className="candidate-directory-toolbar">
            <div className="candidate-search-wrap">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                aria-label="Search candidates"
                placeholder="Search by name, email, role, or status"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  Clear
                </button>
              )}
            </div>

            <span className="candidate-result-count">
              {loading
                ? "Loading candidates…"
                : `${filteredCandidates.length} ${
                    filteredCandidates.length === 1
                      ? "candidate"
                      : "candidates"
                  }`}
            </span>
          </div>

          {loading && (
            <div
              className="candidate-directory-loading"
              role="status"
            >
              Loading your candidates…
            </div>
          )}

          {error && (
            <p
              className="workspace-inline-error candidate-load-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            (candidates ?? []).length === 0 && (
              <div className="candidate-directory-empty">
                <span className="candidate-empty-mark">
                  ＋
                </span>

                <h2>
                  {showArchived
                    ? "No archived candidates"
                    : "No candidates yet"}
                </h2>

                <p>
                  {showArchived
                    ? "Archived profiles will appear here. You can restore them without losing their history."
                    : "Add a candidate to start organizing profiles, resumes, and interview preparation."}
                </p>

                {!showArchived && (
                  <button
                    className="workspace-primary-action"
                    type="button"
                    onClick={openAddCandidate}
                  >
                    ＋ Add Candidate
                  </button>
                )}
              </div>
            )}

          {!loading &&
            !error &&
            (candidates ?? []).length > 0 &&
            filteredCandidates.length === 0 && (
              <div className="candidate-search-empty">
                <strong>
                  {isSearching
                    ? "No matches found"
                    : "No candidates to display"}
                </strong>

                <span>
                  Try another name, email, job role, or status.
                </span>

                {isSearching && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

          {!loading &&
            !error &&
            filteredCandidates.length > 0 && (
              <div className="candidate-table-scroll">
                <table className="candidate-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Contact</th>
                      <th>Job role</th>
                      <th>Status</th>
                      <th>Resume</th>
                      <th>
                        <span className="sr-only">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCandidates.map((candidate) => {
                      const candidateStatus =
                        candidate.status ?? "new";

                      const statusStyle = badge(candidateStatus);

                      const archiveBusy =
                        busyAction === `archive:${candidate.id}`;

                      const restoreBusy =
                        busyAction === `restore:${candidate.id}`;

                      return (
                        <tr key={candidate.id}>
                          <td>
                            <Link
                              className="candidate-table-profile"
                              to={`/candidates/${candidate.id}`}
                            >
                              <span className="candidate-initials">
                                {(candidate.name ?? "?")
                                  .split(/\s+/)
                                  .filter(Boolean)
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </span>

                              <span>
                                <strong>
                                  {candidate.name || "Unnamed candidate"}
                                </strong>

                                <small>
                                  View candidate profile
                                </small>
                              </span>
                            </Link>
                          </td>

                          <td>
                            <span className="candidate-contact">
                              {candidate.email || "No email added"}
                            </span>

                            <small className="candidate-phone">
                              {candidate.phone || "No phone added"}
                            </small>
                          </td>

                          <td>
                            {candidate.job_role || "Not specified"}
                          </td>

                          <td>
                            <span
                              className="candidate-status-badge"
                              style={{
                                color: statusStyle.fg,
                                background: statusStyle.background,
                              }}
                            >
                              {getStatusLabel(candidateStatus)}
                            </span>
                          </td>

                          <td>
                            {candidate.has_resume ? (
                              <span className="resume-present">
                                <i /> On file
                              </span>
                            ) : showArchived ? (
                              "—"
                            ) : (
                              <Link
                                className="candidate-upload-link"
                                to={`/candidates/${candidate.id}`}
                                state={{
                                  openResumePicker: true,
                                }}
                              >
                                Upload PDF <span>→</span>
                              </Link>
                            )}
                          </td>

                          <td>
                            <div className="candidate-row-actions">
                              {showArchived ? (
                                <button
                                  type="button"
                                  disabled={Boolean(busyAction)}
                                  onClick={() => handleRestore(candidate)}
                                >
                                  {restoreBusy ? "Restoring…" : "Restore"}
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={
                                      Boolean(busyAction) || submitting
                                    }
                                    onClick={() => {
                                      setActionError(null);
                                      setFormMode(candidate);
                                    }}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      Boolean(busyAction) || submitting
                                    }
                                    onClick={() => handleDelete(candidate)}
                                  >
                                    {archiveBusy ? "Archiving…" : "Archive"}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      )}
    </div>
  );
}