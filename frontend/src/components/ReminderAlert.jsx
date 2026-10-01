import { useCountdown, formatLocalDateTime } from "../hooks/useCountdown";
import { color } from "../styles/theme";

const TIER_LABEL = {
  "24_hour": { icon: "🔔", text: "Interview tomorrow" },
  "1_hour": { icon: "🔔", text: "Interview in 1 hour" },
  "15_minute": { icon: "🔴", text: "Interview in 15 minutes" },
  at_time: { icon: "◷", text: "Interview is starting" },
};

export default function ReminderAlert({ reminder, onAcknowledge }) {
  const tier = TIER_LABEL[reminder.reminder_type] ?? { icon: "🔔", text: "Interview reminder" };
  const countdown = useCountdown(reminder.interview_scheduled_at);
  const { date, time } = formatLocalDateTime(reminder.interview_scheduled_at);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={{ fontSize: 18 }}>{tier.icon}</span>
        <strong style={styles.headerText}>{tier.text}</strong>
      </div>
      <div style={styles.name}>{reminder.candidate_name}</div>
      <div style={styles.role}>{reminder.candidate_role}</div>
      <div style={styles.time}>{date} at {time} · <strong>{countdown}</strong></div>
      <div style={styles.actions}>
        {reminder.meeting_link && (
          <a href={reminder.meeting_link} target="_blank" rel="noopener noreferrer" style={styles.joinButton}>
            Join interview
          </a>
        )}
        <button onClick={() => onAcknowledge(reminder.id)} style={styles.dismissButton}>Dismiss</button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: `1px solid ${color.alarm}33`,
    background: color.alarmSoft,
    borderRadius: 12,
    padding: "1.1rem 1.3rem",
    marginBottom: "0.75rem",
  },
  header: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  headerText: { color: color.alarm, fontSize: 14, fontWeight: 700 },
  name: { fontWeight: 600, fontSize: 16, color: color.textHigh },
  role: { color: color.textMid, fontSize: 13.5, marginBottom: 4 },
  time: { fontSize: 13.5, color: color.textMid, marginBottom: 12 },
  actions: { display: "flex", gap: 8 },
  joinButton: {
  padding: "0.45rem 1rem",
  borderRadius: 6,
  background: color.surface,
  border: `1px solid ${color.borderStrong}`,
  color: color.ink,
  textDecoration: "none",
  fontSize: 13.5,
  fontWeight: 600,
},

dismissButton: {
  padding: "0.45rem 1rem",
  borderRadius: 6,
  border: `1px solid ${color.borderStrong}`,
  background: color.surface,
  color: color.ink,
  cursor: "pointer",
  fontSize: 13.5,
  fontWeight: 500,
},
};
