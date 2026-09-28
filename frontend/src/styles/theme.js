/**
 * Design tokens. Mint drives primary actions; red is
 * reserved exclusively for the alarm/reminder system so it stays meaningful
 * rather than decorative when it appears.
 */
export const color = {
  ink: "#261A3B",
  inkSoft: "#392C4B",
  canvas: "#F5F4F7",
  surface: "#FFFFFF",
  border: "#E2E4EA",
  borderStrong: "#C7CBD4",

  textHigh: "#292439",
  textMid: "#514A5C",
  textLow: "#787281",
  textOnInk: "#F4F0F8",
  textOnInkMuted: "#B8AEC6",

  accent: "#A5E8C2",
  accentSoft: "#E6F6EC",
  accentText: "#507F61",

  alarm: "#D93636",
  alarmSoft: "#FBEAEA",

  success: "#43865F",
  successSoft: "#E4F5EA",
  info: "#3054A6",
  infoSoft: "#E7ECF8",
  neutralSoft: "#EEF0F3",
};

export const font = {
  family: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export const radius = { sm: 6, md: 8, lg: 12 };

export const shadow = {
  card: "none",
  raised: "0 8px 24px rgba(27, 32, 48, 0.12)",
};

// Shared building blocks so every page's cards/buttons/badges look consistent
// without copy-pasting the same object literals everywhere.
export const s = {
  page: { fontFamily: font.family, color: color.textHigh },
  card: {
    background: color.surface,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    padding: "1.25rem 1.5rem",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: color.textHigh,
    marginBottom: 14,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 14,
    fontSize: 13,
    color: color.textMid,
    fontWeight: 500,
  },
  input: {
    padding: "0.55rem 0.7rem",
    borderRadius: radius.sm,
    border: `1px solid ${color.borderStrong}`,
    fontSize: 14,
    fontFamily: font.family,
    color: color.textHigh,
    background: color.surface,
  },
  buttonPrimary: {
    padding: "0.55rem 1.1rem",
    borderRadius: radius.sm,
    border: "none",
    background: color.accent,
    color: color.ink,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: font.family,
  },
  buttonSecondary: {
    padding: "0.55rem 1.1rem",
    borderRadius: radius.sm,
    border: `1px solid ${color.borderStrong}`,
    background: color.surface,
    color: color.textHigh,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: font.family,
  },
  buttonDanger: {
    padding: "0.55rem 1.1rem",
    borderRadius: radius.sm,
    border: `1px solid ${color.alarm}`,
    background: color.surface,
    color: color.alarm,
    fontWeight: 500,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: font.family,
  },
  linkButton: {
    border: "none",
    background: "none",
    color: color.accentText,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: font.family,
    padding: 0,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    borderBottom: `1px solid ${color.border}`,
    padding: "0.6rem 0.75rem",
    fontSize: 12,
    fontWeight: 600,
    color: color.textLow,
    letterSpacing: "0.01em",
  },
  td: {
    borderBottom: `1px solid ${color.border}`,
    padding: "0.7rem 0.75rem",
    fontSize: 14,
    color: color.textHigh,
  },
  emptyState: {
    color: color.textLow,
    fontSize: 14,
    padding: "1.5rem 0",
  },
  errorText: { color: color.alarm, fontSize: 13.5 },
};

export function badge(kind) {
  const map = {
    new: { bg: color.infoSoft, fg: color.info },
    scheduled: { bg: color.infoSoft, fg: color.info },
    interviewed: { bg: color.accentSoft, fg: color.accentText },
    hired: { bg: color.successSoft, fg: color.success },
    rejected: { bg: color.alarmSoft, fg: color.alarm },
    completed: { bg: color.successSoft, fg: color.success },
    cancelled: { bg: color.neutralSoft, fg: color.textLow },
    no_show: { bg: color.alarmSoft, fg: color.alarm },
    pending: { bg: color.neutralSoft, fg: color.textLow },
    selected: { bg: color.successSoft, fg: color.success },
    hold: { bg: color.accentSoft, fg: color.accentText },
  };
  const { bg, fg } = map[kind] ?? { bg: color.neutralSoft, fg: color.textMid };
  return {
    display: "inline-block",
    background: bg,
    color: fg,
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 600,
    textTransform: "capitalize",
  };
}
