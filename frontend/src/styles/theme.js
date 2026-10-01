/** Meetwise shared design tokens. */

export const color = {
  // Main surfaces
  canvas: "var(--mw-bg)",
  surface: "var(--mw-surface)",
  surfaceAlt: "var(--mw-surface-2)",

  // Text
  textHigh: "var(--mw-text-high)",
  textMid: "var(--mw-text-mid)",
  textLow: "var(--mw-text-low)",

  // Strong / dark controls
  ink: "var(--mw-ink)",
  inkSoft: "var(--mw-ink-soft)",

  // Text placed on dark / ink surfaces
  textOnInk: "var(--mw-text-on-ink)",
  textOnInkMuted: "var(--mw-text-on-ink-muted)",

  // Borders
  border: "var(--mw-border)",
  borderStrong: "var(--mw-border-strong)",

  // Accent
  accent: "var(--mw-accent)",
  accentSoft: "var(--mw-accent-soft)",
  accentText: "var(--mw-accent-strong)",

  // Status
  alarm: "var(--mw-danger)",
  alarmSoft: "var(--mw-danger-soft)",

  success: "var(--mw-accent-strong)",
  successSoft: "var(--mw-accent-soft)",

  info: "var(--mw-purple)",
  infoSoft: "var(--mw-purple-soft)",

  neutralSoft: "var(--mw-surface-2)",
};

export const font = {
  family: "'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export const radius = {
  sm: 9,
  md: 12,
  lg: 16,
};

export const shadow = {
  card: "0 7px 22px rgba(24, 45, 38, 0.06)",
  raised: "0 18px 45px rgba(24, 45, 38, 0.07)",
};

export const s = {
  page: {
    fontFamily: font.family,
    color: color.textHigh,
  },

  card: {
    background: color.surface,
    border: `1px solid ${color.border}`,
    borderRadius: radius.lg,
    padding: "1.25rem 1.5rem",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: color.textHigh,
    marginBottom: 14,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 14,
    fontSize: 13,
    color: color.textMid,
    fontWeight: 600,
  },

  input: {
    padding: "0.62rem 0.75rem",
    minHeight: 40,
    boxSizing: "border-box",
    borderRadius: radius.sm,
    border: `1px solid ${color.borderStrong}`,
    fontSize: 13,
    fontFamily: font.family,
    color: color.textHigh,
    background: color.surface,
    outline: "none",
  },

  buttonPrimary: {
    padding: "0.62rem 1.1rem",
    minHeight: 40,
    borderRadius: radius.sm,
    border: "none",
    background: color.ink,
    color: color.textOnInk,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: font.family,
  },

  buttonSecondary: {
    padding: "0.62rem 1.1rem",
    minHeight: 40,
    borderRadius: radius.sm,
    border: `1px solid ${color.borderStrong}`,
    background: color.surface,
    color: color.textHigh,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: font.family,
  },

  buttonDanger: {
    padding: "0.62rem 1.1rem",
    minHeight: 40,
    borderRadius: radius.sm,
    border: `1px solid ${color.alarm}`,
    background: color.surface,
    color: color.alarm,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: font.family,
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: color.accentText,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: font.family,
    padding: 0,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    borderBottom: `1px solid ${color.border}`,
    padding: "0.7rem 0.75rem",
    fontSize: 11,
    fontWeight: 700,
    color: color.textLow,
  },

  td: {
    borderBottom: `1px solid ${color.border}`,
    padding: "0.75rem",
    fontSize: 13,
    color: color.textHigh,
  },

  emptyState: {
    color: color.textLow,
    fontSize: 13,
    padding: "1.5rem 0",
  },

  errorText: {
    color: color.alarm,
    fontSize: 13,
  },
};

export function badge(kind) {
  const map = {
    new: {
      bg: color.infoSoft,
      fg: color.info,
    },

    scheduled: {
      bg: color.infoSoft,
      fg: color.info,
    },

    interviewed: {
      bg: color.accentSoft,
      fg: color.accentText,
    },

    hired: {
      bg: color.successSoft,
      fg: color.success,
    },

    rejected: {
      bg: color.alarmSoft,
      fg: color.alarm,
    },

    completed: {
      bg: color.successSoft,
      fg: color.success,
    },

    cancelled: {
      bg: color.neutralSoft,
      fg: color.textLow,
    },

    no_show: {
      bg: color.alarmSoft,
      fg: color.alarm,
    },

    pending: {
      bg: color.neutralSoft,
      fg: color.textLow,
    },

    selected: {
      bg: color.successSoft,
      fg: color.success,
    },

    hold: {
      bg: color.accentSoft,
      fg: color.accentText,
    },
  };

  const { bg, fg } =
    map[kind] ?? {
      bg: color.neutralSoft,
      fg: color.textMid,
    };

  return {
    display: "inline-block",
    background: bg,
    color: fg,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "capitalize",
  };
}