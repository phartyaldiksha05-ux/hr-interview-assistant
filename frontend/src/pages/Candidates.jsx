import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { candidatesApi } from "../api/candidates";
import { useApi } from "../hooks/useApi";
import CandidateForm from "../components/CandidateForm";
import ResumeUploadForm from "../components/ResumeUploadForm";
import { color, s, badge } from "../styles/theme";

export default function Candidates() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const { data: candidates, error, loading, refetch } = useApi(() => showArchived ? candidatesApi.archived() : candidatesApi.list(), [showArchived]);
  const [formMode, setFormMode] = useState(location.state?.openCreate ? "create" : null);
  const [showUpload, setShowUpload] = useState(Boolean(location.state?.openUpload));
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return candidates ?? [];
    return (candidates ?? []).filter((candidate) =>
      [candidate.name, candidate.email, candidate.phone, candidate.job_role]
        .some((value) => value?.toLowerCase().includes(normalizedQuery))
    );
  }, [candidates, query]);

  async function handleCreate(values) {
    setSubmitting(true);
    try {
      const candidate = await candidatesApi.create(values);
      setDuplicateCandidate(null);
      setFormMode(null);
      if (location.state?.uploadAfterCreate && candidate?.id) {
        navigate(`/candidates/${candidate.id}`, { state: { openResumePicker: true } });
        return;
      }
      await refetch();
    } catch (createError) {
      if (createError.status === 409) {
        try {
          setDuplicateCandidate(await candidatesApi.getByEmail(values.email.trim()));
          setFormMode(null);
          return;
        } catch {
          setActionError("A profile already uses this email, but it is archived or unavailable. Check Archived Candidates before retrying.");
          setFormMode(null);
          return;
        }
      }
      throw createError;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values) {
    setSubmitting(true);
    try {
      await candidatesApi.update(formMode.id, values);
      setFormMode(null);
      await refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(candidate) {
    if (!window.confirm(`Archive ${candidate.name} from the active list? Their resume and interview history will be retained and can be restored.`)) return;
    setActionError(null);
    try {
      await candidatesApi.remove(candidate.id);
      await refetch();
    } catch (deleteError) {
      setActionError(deleteError.message ?? "Failed to delete candidate");
    }
  }

  async function handleRestore(candidate) {
    setActionError(null);
    try {
      await candidatesApi.restore(candidate.id);
      await refetch();
    } catch (restoreError) {
      setActionError(restoreError.message ?? "Could not restore this candidate.");
    }
  }

  function finishUpload(candidateId) {
    setShowUpload(false);
    setDuplicateCandidate(null);
    navigate(`/candidates/${candidateId}`);
  }

  return (
    <div className="candidate-page">
      <header className="directory-header">
        <div>
          <span className="workspace-overline">PEOPLE & PIPELINE</span>
          <h1>Candidates</h1>
          <p>Keep profiles, resume context, and interview preparation together.</p>
        </div>
        <div className="directory-actions">
          <button className="workspace-secondary-action" type="button" onClick={() => { setShowArchived((value) => !value); setShowUpload(false); setFormMode(null); setDuplicateCandidate(null); }}>{showArchived ? "Active candidates" : "Archived candidates"}</button>
          <button className="workspace-secondary-action" onClick={() => { setShowUpload(true); setFormMode(null); }}>↑ Upload Resume</button>
          <button className="workspace-primary-action" onClick={() => { setFormMode("create"); setShowUpload(false); }}>＋ Add Candidate</button>
        </div>
      </header>

      {showUpload && <ResumeUploadForm existingCandidate={duplicateCandidate} onCancel={() => setShowUpload(false)} onComplete={finishUpload} />}
      {formMode === "create" && <CandidateForm onSubmit={handleCreate} onCancel={() => setFormMode(null)} submitting={submitting} />}
      {formMode && formMode !== "create" && <CandidateForm initialValues={formMode} onSubmit={handleUpdate} onCancel={() => setFormMode(null)} submitting={submitting} />}

      {duplicateCandidate && !showUpload && <div className="candidate-duplicate-notice" role="alert"><div><strong>A candidate with this email already exists.</strong><span>{duplicateCandidate.name} · {duplicateCandidate.email} · {duplicateCandidate.job_role}</span></div><div className="resume-duplicate-actions"><button className="resume-flow-text-button" type="button" onClick={() => navigate(`/candidates/${duplicateCandidate.id}`)}>Open Existing Candidate</button><button className="workspace-primary-action" type="button" onClick={() => setShowUpload(true)}>Upload Resume to Existing Candidate</button></div></div>}

      {actionError && <p className="workspace-inline-error" role="alert">{actionError}</p>}

      <section className="candidate-directory" aria-label="Candidate directory">
        <div className="candidate-directory-toolbar">
          <div className="candidate-search-wrap">
            <span aria-hidden="true">⌕</span>
            <input type="search" aria-label="Search candidates" placeholder="Search by name, email, or role" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <span className="candidate-result-count">{loading ? "Loading candidates…" : `${filteredCandidates.length} ${filteredCandidates.length === 1 ? "candidate" : "candidates"}`}</span>
        </div>

        {loading && <div className="candidate-directory-loading">Loading your candidates…</div>}
        {error && <p className="workspace-inline-error candidate-load-error" role="alert">{error}</p>}
        {!loading && !error && candidates?.length === 0 && (
          <div className="candidate-directory-empty">
            <span className="candidate-empty-mark">＋</span>
            <h2>{showArchived ? "No archived candidates" : "Your candidate list starts here"}</h2>
            <p>{showArchived ? "Archived profiles appear here and can be restored without losing their history." : "Add a profile or upload a resume to start preparing for a better interview."}</p>
            {!showArchived && <div><button className="workspace-primary-action" onClick={() => setShowUpload(true)}>↑ Upload Resume</button><button className="workspace-secondary-action" onClick={() => setFormMode("create")}>Add Candidate</button></div>}
          </div>
        )}
        {!loading && !error && candidates?.length > 0 && filteredCandidates.length === 0 && (
          <div className="candidate-search-empty"><strong>No matches found</strong><span>Try another name, email address, or job role.</span></div>
        )}
        {!loading && !error && filteredCandidates.length > 0 && (
          <div className="candidate-table-scroll">
            <table className="candidate-table">
              <thead><tr><th>Candidate</th><th>Contact</th><th>Job role</th><th>Status</th><th>Resume</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td><Link className="candidate-table-profile" to={`/candidates/${candidate.id}`}><span className="candidate-initials">{candidate.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span><strong>{candidate.name}</strong><small>View candidate profile</small></span></Link></td>
                    <td><span className="candidate-contact">{candidate.email}</span><small className="candidate-phone">{candidate.phone || "No phone added"}</small></td>
                    <td>{candidate.job_role}</td>
                    <td><span className="candidate-status-badge" style={{ color: badge(candidate.status).fg, background: badge(candidate.status).background }}>{candidate.status}</span></td>
                    <td>{candidate.has_resume ? <span className="resume-present"><i /> On file</span> : showArchived ? "—" : <Link className="candidate-upload-link" to={`/candidates/${candidate.id}`} state={{ openResumePicker: true }}>Upload PDF <span>→</span></Link>}</td>
                    <td><div className="candidate-row-actions">{showArchived ? <button type="button" onClick={() => handleRestore(candidate)}>Restore</button> : <><button type="button" onClick={() => setFormMode(candidate)}>Edit</button><button type="button" onClick={() => handleDelete(candidate)}>Archive</button></>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
