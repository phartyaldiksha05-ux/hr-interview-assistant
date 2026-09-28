import { Link } from "react-router-dom";
import { dashboardApi } from "../api/dashboard";
import { candidatesApi } from "../api/candidates";
import { interviewsApi } from "../api/interviews";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { useCountdown, formatLocalDateTime } from "../hooks/useCountdown";
import ReminderAlert from "../components/ReminderAlert";
import { badge } from "../styles/theme";

function Stat({ label, value, note }) {
  return (
    <div className="workspace-stat">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
      <small>{note}</small>
    </div>
  );
}

function InterviewItem({ interview, featured = false }) {
  const countdown = useCountdown(interview.scheduled_at);
  const { date, time } = formatLocalDateTime(interview.scheduled_at);
  return (
    <article className={`workspace-interview${featured ? " workspace-interview-featured" : ""}`}>
      <div className="workspace-interview-time"><span>{time}</span><small>{date}</small></div>
      <span className="workspace-interview-rule" />
      <div className="workspace-interview-main">
        <Link to={`/interviews/${interview.id}`} className="workspace-interview-name">{interview.candidate_name}</Link>
        <span>{interview.interview_type} interview{interview.interviewer ? ` · ${interview.interviewer}` : ""}</span>
      </div>
      <div className="workspace-interview-end">
        <span className="workspace-countdown">{countdown}</span>
        {interview.meeting_link && <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">Join ↗</a>}
      </div>
    </article>
  );
}

function EmptyPanel({ icon, title, text, action, to }) {
  return (
    <div className="workspace-empty-panel">
      <span className="workspace-empty-icon" aria-hidden="true">{icon}</span>
      <div><strong>{title}</strong><p>{text}</p></div>
      {action && <Link to={to} state={action === "Add candidate" ? { openCreate: true } : undefined}>{action} <span aria-hidden="true">→</span></Link>}
    </div>
  );
}

export default function Dashboard({ reminders, onAcknowledge }) {
  const { user } = useAuth();
  const { data: stats, error: statsError } = useApi(dashboardApi.stats, []);
  const { data: candidates, loading: candidatesLoading, error: candidatesError } = useApi(candidatesApi.list, []);
  const { data: interviews, loading: interviewsLoading, error: interviewsError } = useApi(interviewsApi.list, []);
  const { data: pendingFeedback, loading: feedbackLoading, error: feedbackError } = useApi(dashboardApi.pendingFeedback, []);
  const candidateList = candidates ?? [];
  const interviewList = interviews ?? [];
  const upcoming = interviewList
    .filter((interview) => interview.status === "scheduled" && new Date(interview.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const nextInterview = upcoming[0];
  const recentCandidates = [...candidateList].slice(0, 5);
  const preparationCandidates = candidateList.filter((candidate) => candidate.has_resume).slice(0, 4);
  const hasNoHiringData = !candidatesLoading && !interviewsLoading && !candidatesError && !interviewsError && candidateList.length === 0 && interviewList.length === 0;
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="hr-workspace">
      <header className="workspace-welcome">
        <div>
          <span className="workspace-overline">YOUR HIRING WORKSPACE</span>
          <h1>{hasNoHiringData ? `Welcome, ${firstName}.` : `Good to see you, ${firstName}.`}</h1>
          <p>{hasNoHiringData ? "Start with one candidate. We’ll help you take it from resume to a considered conversation." : "Here’s what needs your attention next."}</p>
        </div>
        <div className="workspace-header-actions">
          {!hasNoHiringData && <Link className="workspace-secondary-action" to="/candidates" state={{ openUpload: true }}>↑ Upload Resume</Link>}
          <Link className="workspace-secondary-action" to="/candidates" state={{ openCreate: true }}>Add candidate</Link>
          {!hasNoHiringData && <Link className="workspace-primary-action" to="/interviews" state={{ openSchedule: true }}>Schedule interview <span>↗</span></Link>}
        </div>
      </header>

      {hasNoHiringData ? (
        <section className="onboarding-panel">
          <div className="onboarding-copy">
            <span className="onboarding-label"><i /> YOUR FIRST STEP</span>
            <h2>Begin with the person,<br />not the paperwork.</h2>
            <p>Add a candidate and upload their resume. Meetwise can then prepare a useful briefing to help you start the conversation well.</p>
            <div className="onboarding-actions">
              <Link className="workspace-primary-action onboarding-upload" to="/candidates" state={{ openUpload: true }}><span className="upload-arrow">↑</span> Upload Resume</Link>
              <Link className="onboarding-add-link" to="/candidates" state={{ openCreate: true }}>Add Candidate <span>→</span></Link>
            </div>
          </div>
          <div className="onboarding-steps" aria-label="Getting started with Meetwise">
            <div className="onboarding-step onboarding-step-current"><span>01</span><i>↑</i><div><strong>Add a resume</strong><small>Start with candidate context</small></div><b>START HERE</b></div>
            <div className="onboarding-step"><span>02</span><i>✳</i><div><strong>Prepare with AI</strong><small>Review a candidate briefing</small></div></div>
            <div className="onboarding-step"><span>03</span><i>◷</i><div><strong>Plan the conversation</strong><small>Schedule and get ready</small></div></div>
          </div>
        </section>
      ) : (
        <>
          <section className="workspace-stats" aria-label="Hiring overview">
            <Stat label="Candidates" value={stats?.total_candidates} note="In your workspace" />
            <Stat label="Upcoming interviews" value={stats?.upcoming_interviews} note="Scheduled ahead" />
            <Stat label="Today" value={stats?.today_interviews} note="Interviews today" />
            <Stat label="Active reminders" value={stats?.pending_reminders} note="Need your attention" />
            <Stat label="Pending feedback" value={stats?.pending_feedback} note="Completed interviews" />
          </section>

          {statsError && <p className="workspace-data-note">Hiring summary is unavailable right now. Your candidate and interview details are still shown below.</p>}

          <section className="workspace-section workspace-feedback-section">
            <div className="workspace-section-heading"><div><span className="workspace-overline">CLOSE THE LOOP</span><h2>Pending feedback</h2></div><span className="workspace-count-pill">{pendingFeedback?.length ?? 0}</span></div>
            {feedbackLoading && <p className="workspace-section-intro" role="status">Loading completed interviews…</p>}
            {feedbackError && <p className="workspace-inline-error" role="alert">{feedbackError}</p>}
            {!feedbackLoading && !feedbackError && pendingFeedback?.length === 0 && <div className="workspace-feedback-empty">No completed interviews are waiting for notes.</div>}
            {!feedbackLoading && !feedbackError && pendingFeedback?.map((interview) => {
              const { date, time } = formatLocalDateTime(interview.scheduled_at);
              return <article className="workspace-feedback-row" key={interview.id}><div><Link to={`/interviews/${interview.id}`}>{interview.candidate_name}</Link><small>{interview.candidate_job_role} · {date} at {time}</small></div><Link to={`/interviews/${interview.id}`}>Add feedback →</Link></article>;
            })}
          </section>

          <div className="workspace-columns">
            <div className="workspace-primary-column">
              <section className="workspace-section">
                <div className="workspace-section-heading"><div><span className="workspace-overline">UP NEXT</span><h2>Upcoming interviews</h2></div><Link to="/interviews">View schedule <span>→</span></Link></div>
                {interviewsError && <p className="workspace-inline-error">{interviewsError}</p>}
                {upcoming.length > 0 ? (
                  <div className="workspace-interview-list">
                    {upcoming.slice(0, 5).map((interview, index) => <InterviewItem key={interview.id} interview={interview} featured={index === 0} />)}
                  </div>
                ) : (
                  <EmptyPanel icon="◷" title="No interviews on the calendar" text={candidateList.length ? "Choose a candidate and find a time for the first conversation." : "Add a candidate to start planning your first interview."} action={candidateList.length ? "Schedule interview" : "Add candidate"} to={candidateList.length ? "/interviews" : "/candidates"} />
                )}
              </section>

              <section className="workspace-section">
                <div className="workspace-section-heading"><div><span className="workspace-overline">CANDIDATE CONTEXT</span><h2>Recent candidates</h2></div><Link to="/candidates">All candidates <span>→</span></Link></div>
                {candidatesError && <p className="workspace-inline-error">{candidatesError}</p>}
                {recentCandidates.length > 0 ? (
                  <div className="workspace-candidate-list">
                    {recentCandidates.map((candidate) => (
                      <Link className="workspace-candidate-row" key={candidate.id} to={`/candidates/${candidate.id}`}>
                        <span className="candidate-initials">{candidate.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
                        <span className="workspace-candidate-info"><strong>{candidate.name}</strong><small>{candidate.job_role} · {candidate.email}</small></span>
                        <span className="workspace-candidate-status" style={{ color: badge(candidate.status).fg }}>{candidate.status}</span>
                        <span className="workspace-row-arrow">↗</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel icon="＋" title="Your candidate list starts here" text="Keep profiles and resume context together as you meet people." action="Add a candidate" to="/candidates" />
                )}
              </section>
            </div>

            <aside className="workspace-side-column">
              <section className="workspace-section workspace-reminders-section">
                <div className="workspace-section-heading"><div><span className="workspace-overline">STAY ON TRACK</span><h2>Reminders</h2></div><span className="workspace-count-pill">{reminders.length}</span></div>
                {reminders.length ? reminders.map((reminder) => <ReminderAlert key={reminder.id} reminder={reminder} onAcknowledge={onAcknowledge} />) : <div className="workspace-reminder-empty"><span>◷</span><strong>You’re all caught up</strong><p>Interview reminders will appear here when they need your attention.</p></div>}
              </section>

              <section className="workspace-section workspace-prep-section">
                <div className="workspace-section-heading"><div><span className="workspace-overline">MAKE THE MOST OF IT</span><h2>AI preparation</h2></div><span className="workspace-ai-mark">✳</span></div>
                <p className="workspace-section-intro">Get candidate context and interview focus areas before you meet.</p>
                {preparationCandidates.length ? (
                  <div className="workspace-prep-list">
                    {preparationCandidates.map((candidate) => (
                      <Link className="workspace-prep-row" key={candidate.id} to={`/candidates/${candidate.id}`}>
                        <span className="workspace-prep-icon">✳</span><span><strong>{candidate.name}</strong><small>{candidate.job_role}</small></span><b>Prepare →</b>
                      </Link>
                    ))}
                  </div>
                ) : <div className="workspace-prep-empty">{candidateList.length ? "Upload a resume to prepare a candidate briefing." : "Candidate briefings will be ready here once you add a resume."}</div>}
              </section>
            </aside>
          </div>

          {stats && <p className="workspace-summary-foot">Your hiring overview is based on the latest data in your workspace.</p>}
        </>
      )}
    </div>
  );
}
