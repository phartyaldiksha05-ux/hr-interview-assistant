import { useEffect, useState } from "react";
import { s } from "../styles/theme";

export default function InterviewForm({ candidates, preselectedCandidateId, onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState({
    candidate_id: preselectedCandidateId ?? candidates[0]?.id ?? "",
    scheduled_at: "",
    duration_minutes: 60,
    interview_type: "video",
    meeting_link: "",
    interviewer: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (values.candidate_id || !candidates.length) return;
    setValues((current) => ({ ...current, candidate_id: preselectedCandidateId ?? candidates[0].id }));
  }, [candidates, preselectedCandidateId, values.candidate_id]);

  function handleChange(e) {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!values.candidate_id || !values.scheduled_at) {
      setError("Candidate, date, and time are required.");
      return;
    }
    const localDate = new Date(values.scheduled_at);
    if (isNaN(localDate.getTime())) {
      setError("Invalid date or time.");
      return;
    }
    const payload = {
      candidate_id: values.candidate_id,
      scheduled_at: localDate.toISOString(),
      duration_minutes: Number(values.duration_minutes) || 60,
      interview_type: values.interview_type,
      meeting_link: values.meeting_link || null,
      interviewer: values.interviewer || null,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message ?? "Failed to schedule interview");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...s.card, marginBottom: "1.5rem" }}>
      <h3 style={s.sectionTitle}>Schedule interview</h3>

      <label style={s.label}>
        Candidate
        <select name="candidate_id" value={values.candidate_id} onChange={handleChange} style={s.input}>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>{c.name} — {c.job_role}</option>
          ))}
        </select>
      </label>

      <div style={styles.row}>
        <label style={{ ...s.label, flex: 1 }}>
          Date and time (your local timezone)
          <input name="scheduled_at" type="datetime-local" min={minimumLocalDateTime()} value={values.scheduled_at} onChange={handleChange} style={s.input} required />
        </label>
      </div>

      <div style={styles.row}>
        <label style={s.label}>
          Duration (minutes)
          <input name="duration_minutes" type="number" min="15" max="480" value={values.duration_minutes} onChange={handleChange} style={s.input} />
        </label>
        <label style={s.label}>
          Type
          <select name="interview_type" value={values.interview_type} onChange={handleChange} style={s.input}>
            <option value="video">Video</option>
            <option value="phone">Phone</option>
            <option value="onsite">Onsite</option>
          </select>
        </label>
      </div>

      <label style={s.label}>
        Interviewer
        <input name="interviewer" value={values.interviewer} onChange={handleChange} style={s.input} />
      </label>

      <label style={s.label}>
        Meeting link
        <input name="meeting_link" placeholder="https://meet.google.com/..." value={values.meeting_link} onChange={handleChange} style={s.input} />
      </label>

      {error && <p style={s.errorText}>{error}</p>}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button type="submit" disabled={submitting} style={s.buttonPrimary}>
          {submitting ? "Scheduling…" : "Schedule interview"}
        </button>
        <button type="button" onClick={onCancel} style={s.buttonSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const styles = { row: { display: "flex", gap: "1rem" } };

function minimumLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}
