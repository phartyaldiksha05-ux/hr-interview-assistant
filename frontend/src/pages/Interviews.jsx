import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { interviewsApi } from "../api/interviews";
import { candidatesApi } from "../api/candidates";
import { useApi } from "../hooks/useApi";
import { useCountdown, formatLocalDateTime } from "../hooks/useCountdown";
import InterviewForm from "../components/InterviewForm";
import ReminderAlert from "../components/ReminderAlert";
import { badge } from "../styles/theme";

function InterviewRow({ interview }) {
  const countdown = useCountdown(interview.scheduled_at);
  const { date, time } = formatLocalDateTime(interview.scheduled_at);
  return (
    <article className="interview-list-row">
      <div className="interview-list-date"><strong>{time}</strong><small>{date}</small></div>
      <span className="interview-list-rule" />
      <div className="interview-list-person"><Link to={`/interviews/${interview.id}`}>{interview.candidate_name}</Link><small>{interview.interviewer || "Interviewer not assigned"}</small></div>
      <div className="interview-list-details"><span>{interview.interview_type}</span><small>{interview.duration_minutes} min</small></div>
      <span className="interview-status" style={{ color: badge(interview.status).fg, background: badge(interview.status).background }}>{interview.status.replaceAll("_", " ")}</span>
      <div className="interview-list-actions">{interview.status === "scheduled" && <span>{countdown}</span>}{interview.meeting_link && interview.status === "scheduled" && <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">Join ↗</a>}<Link to={`/interviews/${interview.id}`}>Details</Link></div>
    </article>
  );
}

function InterviewGroup({ title, eyebrow, interviews, emptyTitle, emptyText }) {
  return (
    <section className="interview-group">
      <header className="interview-group-heading"><div><span className="workspace-overline">{eyebrow}</span><h2>{title}</h2></div><span>{interviews.length}</span></header>
      {interviews.length ? <div>{interviews.map((interview) => <InterviewRow key={interview.id} interview={interview} />)}</div> : <div className="interview-empty"><span>◷</span><div><strong>{emptyTitle}</strong><p>{emptyText}</p></div></div>}
    </section>
  );
}

export default function Interviews({ reminders = [], onAcknowledge }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const preselectedCandidateId = searchParams.get("candidate");
  const { data: interviews, error, loading, refetch } = useApi(interviewsApi.list, []);
  const { data: candidates, loading: candidatesLoading, error: candidatesError } = useApi(candidatesApi.list, []);
  const [showForm, setShowForm] = useState(Boolean(preselectedCandidateId || location.state?.openSchedule));
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const { upcoming, completed, previous } = useMemo(() => {
    const now = Date.now();
    const upcomingInterviews = (interviews ?? []).filter((interview) => interview.status === "scheduled" && new Date(interview.scheduled_at).getTime() > now)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const upcomingIds = new Set(upcomingInterviews.map((interview) => interview.id));
    const previousInterviews = (interviews ?? []).filter((interview) => !upcomingIds.has(interview.id) && interview.status !== "completed")
      .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
    const completedInterviews = (interviews ?? []).filter((interview) => interview.status === "completed")
      .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
    return { upcoming: upcomingInterviews, completed: completedInterviews, previous: previousInterviews };
  }, [interviews]);

  useEffect(() => {
    if (preselectedCandidateId) setShowForm(true);
  }, [preselectedCandidateId]);

  async function handleCreate(payload) {
    setSubmitting(true);
    setActionError(null);
    try {
      await interviewsApi.create(payload);
      setShowForm(false);
      await refetch();
    } catch (err) {
      setActionError(err.message ?? "Could not schedule the interview.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="interviews-page">
      <header className="interviews-header">
        <div><span className="workspace-overline">CONVERSATIONS & FOLLOW-THROUGH</span><h1>Interviews</h1><p>Coordinate the conversation and keep every next step clear.</p></div>
        {!showForm && candidates?.length > 0 && <button className="workspace-primary-action" onClick={() => setShowForm(true)}>＋ Schedule Interview</button>}
      </header>

      {!candidatesLoading && !candidatesError && !candidates?.length && !showForm && (
        <div className="interview-needs-candidate"><span>＋</span><div><strong>Add a candidate before scheduling</strong><p>Interviews are linked to candidate profiles so their preparation and feedback stay together.</p></div><Link to="/candidates" state={{ openCreate: true }}>Add candidate →</Link></div>
      )}
      {candidatesError && <p className="workspace-inline-error" role="alert">{candidatesError}</p>}

      {showForm && (
        <InterviewForm
          candidates={candidates ?? []}
          preselectedCandidateId={preselectedCandidateId}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      {actionError && <p className="workspace-inline-error" role="alert">{actionError}</p>}
      {loading && <div className="interview-loading">Loading interviews…</div>}
      {error && <p className="workspace-inline-error" role="alert">{error}</p>}

      {!loading && !error && (
        <>
          {reminders.length > 0 && <section className="interview-reminders"><header><div><span className="workspace-overline">NEEDS YOUR ATTENTION</span><h2>Pending reminders</h2></div><span>{reminders.length}</span></header>{reminders.map((reminder) => <ReminderAlert key={reminder.id} reminder={reminder} onAcknowledge={onAcknowledge} />)}</section>}
          <InterviewGroup title="Upcoming interviews" eyebrow="ON THE CALENDAR" interviews={upcoming} emptyTitle="Nothing scheduled yet" emptyText={candidates?.length ? "Schedule an interview to see the plan and next steps here." : "Add a candidate first, then schedule the first conversation."} />
          <InterviewGroup title="Completed interviews" eyebrow="FEEDBACK & FOLLOW-THROUGH" interviews={completed} emptyTitle="No completed interviews yet" emptyText="Mark an interview completed to capture HR feedback and prepare a post-interview summary." />
          {previous.length > 0 && <InterviewGroup title="Cancelled, no-show & past" eyebrow="OTHER INTERVIEWS" interviews={previous} emptyTitle="No other interviews" emptyText="Cancelled, no-show, and past interviews appear here." />}
        </>
      )}
    </div>
  );
}
