import { useRef, useState } from "react";
import { candidatesApi } from "../api/candidates";

const MAX_RESUME_SIZE = 10 * 1024 * 1024;

async function validatePdf(file) {
  if (!file) return "Choose a PDF resume to continue.";
  if (!file.name.toLowerCase().endsWith(".pdf")) return "Choose a file with the .pdf extension.";
  if (file.size > MAX_RESUME_SIZE) return "This file is larger than the 10 MB limit.";
  if (file.size === 0) return "This file is empty. Choose another PDF.";
  const header = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (header !== "%PDF-") return "This file does not appear to be a valid PDF. Choose another file.";
  return null;
}

export default function ResumeUploadForm({ onCancel, onComplete, existingCandidate = null }) {
  const [values, setValues] = useState({ name: "", email: "", phone: "", job_role: "" });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [error, setError] = useState(null);
  const [candidate, setCandidate] = useState(existingCandidate);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [usingExistingCandidate, setUsingExistingCandidate] = useState(Boolean(existingCandidate));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function chooseFile(selectedFile) {
    setFileError(null);
    setError(null);
    setFile(selectedFile ?? null);
    if (selectedFile) setFileError(await validatePdf(selectedFile));
  }

  async function upload(candidateId, selectedFile) {
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const existingResumes = await candidatesApi.resumes(candidateId);
      if (existingResumes.length > 0 && !window.confirm(`This candidate already has ${existingResumes.length === 1 ? "a resume" : `${existingResumes.length} resumes`}. Add this PDF as the latest resume? Previous files will remain on the profile.`)) {
        return;
      }
      const resume = await candidatesApi.uploadResume(candidateId, selectedFile, setProgress);
      if (resume.parse_status === "failed") {
        setFile(null);
        setFileError(null);
        setError(`The resume was saved, but text extraction failed${resume.parse_error ? `: ${resume.parse_error}` : "."} Choose a text-based PDF and retry.`);
        return;
      }
      onComplete(candidateId);
    } catch (uploadError) {
      setError(uploadError.message ?? "Resume upload failed. Your candidate profile is saved; retry the upload.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (candidate) {
      const validationError = await validatePdf(file);
      if (validationError) {
        setFileError(validationError);
        return;
      }
      await upload(candidate.id, file);
      return;
    }

    if (!values.name.trim() || !values.email.trim() || !values.job_role.trim()) {
      setError("Name, email, and job role are required.");
      return;
    }
    const validationError = await validatePdf(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    setBusy(true);
    try {
      const created = await candidatesApi.create({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        job_role: values.job_role.trim(),
      });
      setCandidate(created);
      await upload(created.id, file);
    } catch (createError) {
      if (createError.status === 409) {
        try {
          const existing = await candidatesApi.getByEmail(values.email.trim());
          setDuplicateCandidate(existing);
          setError(`A candidate with ${existing.email} already exists in your workspace.`);
          setBusy(false);
          return;
        } catch {
          setError("A candidate with this email already exists. Open Candidates and search for the profile to attach the resume.");
          setBusy(false);
          return;
        }
      }
      setError(createError.message ?? "Could not create the candidate profile.");
      setBusy(false);
    }
  }

  async function attachToExisting() {
    if (!duplicateCandidate) return;
    setCandidate(duplicateCandidate);
    setUsingExistingCandidate(true);
    await upload(duplicateCandidate.id, file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  return (
    <section className="resume-flow" aria-labelledby="resume-flow-title">
      <div className="resume-flow-heading">
        <div>
          <span className="workspace-overline">{usingExistingCandidate ? "EXISTING CANDIDATE" : "NEW CANDIDATE"}</span>
          <h2 id="resume-flow-title">{usingExistingCandidate ? "Attach a resume" : "Upload a resume"}</h2>
          <p>{usingExistingCandidate ? `Add a PDF resume to ${candidate?.name}'s profile.` : "Create a candidate profile and attach their resume in one step."}</p>
        </div>
        <button className="resume-flow-close" type="button" onClick={onCancel} disabled={busy} aria-label="Close upload form">×</button>
      </div>

      {candidate ? (
        <div className="resume-candidate-saved" role="status">
          <span className="resume-saved-check">✓</span>
          <div><strong>{usingExistingCandidate ? `${candidate.name}'s profile is selected` : `${candidate.name}'s profile is saved`}</strong><small>The resume will be attached to this candidate. The profile will remain available if upload needs another try.</small></div>
        </div>
      ) : (
        <div className="resume-profile-fields">
          <label className="resume-field">Full name<input name="name" autoComplete="name" value={values.name} onChange={updateField} required /></label>
          <label className="resume-field">Email<input name="email" type="email" autoComplete="email" value={values.email} onChange={updateField} required /></label>
          <label className="resume-field">Job role<input name="job_role" value={values.job_role} onChange={updateField} required /></label>
          <label className="resume-field">Phone <span className="resume-optional">Optional</span><input name="phone" type="tel" autoComplete="tel" value={values.phone} onChange={updateField} /></label>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          className={`resume-dropzone${dragging ? " resume-dropzone-active" : ""}${file ? " resume-dropzone-selected" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
          onDrop={handleDrop}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(event) => { if (!busy && (event.key === "Enter" || event.key === " ")) inputRef.current?.click(); }}
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-label="Choose a PDF resume or drop it here"
        >
          <input ref={inputRef} className="resume-file-input" type="file" accept=".pdf,application/pdf" onClick={(event) => event.stopPropagation()} onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
          <span className="resume-drop-icon" aria-hidden="true">{file ? "✓" : "↑"}</span>
          <div className="resume-drop-copy">
            <strong>{file ? file.name : "Drop a PDF resume here"}</strong>
            <span>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · PDF document` : "or browse files from your device"}</span>
          </div>
          <button className="resume-browse-button" type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>Browse Files</button>
          <small>PDF only · Maximum file size 10 MB</small>
        </div>
        {fileError && <p className="resume-upload-error" role="alert">{fileError}</p>}
        {error && <p className="resume-upload-error" role="alert">{error}</p>}
        {duplicateCandidate && !candidate && (
          <div className="resume-duplicate-actions">
            <button className="resume-flow-text-button" type="button" onClick={() => onComplete(duplicateCandidate.id)}>Open Existing Candidate</button>
            <button className="workspace-primary-action" type="button" disabled={busy || Boolean(fileError) || !file} onClick={attachToExisting}>Upload Resume to Existing Candidate</button>
          </div>
        )}
        {busy && <div className="resume-progress" role="status"><div><span>{candidate ? "Uploading resume" : "Preparing upload"}</span><strong>{progress}%</strong></div><progress max="100" value={progress} /></div>}
        <div className="resume-form-actions">
          {!duplicateCandidate && <button className="workspace-primary-action" type="submit" disabled={busy || Boolean(fileError) || !file}>
            {busy ? <><span className="resume-spinner" /> {candidate ? "Uploading resume…" : "Saving profile and uploading…"}</> : candidate ? "Retry Upload" : "Create Profile & Upload"}
          </button>}
          {duplicateCandidate && candidate && <button className="workspace-primary-action" type="submit" disabled={busy || Boolean(fileError) || !file}>Retry Upload</button>}
          {candidate && (fileError || error) && <button className="resume-flow-text-button" type="button" onClick={() => inputRef.current?.click()}>Choose another file</button>}
          <span className="resume-secure-note">Resume text is processed by your hiring workspace.</span>
        </div>
      </form>
    </section>
  );
}
