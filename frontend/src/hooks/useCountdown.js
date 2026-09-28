import { useEffect, useState } from "react";

/**
 * Returns a live "In 1h 12m" / "In 45m" / "Starting now" / "Completed" string for a
 * given ISO timestamp, recomputed every 30s from the real clock. Never hardcodes a
 * fixed offset — always diffs the target time against `new Date()` at render time.
 */
export function useCountdown(isoTimestamp) {
  const [label, setLabel] = useState(() => formatCountdown(isoTimestamp));

  useEffect(() => {
    setLabel(formatCountdown(isoTimestamp));
    const id = setInterval(() => setLabel(formatCountdown(isoTimestamp)), 30_000);
    return () => clearInterval(id);
  }, [isoTimestamp]);

  return label;
}

export function formatCountdown(isoTimestamp) {
  const target = new Date(isoTimestamp).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0 && diffMs > -60 * 60 * 1000) return "Starting now";
  if (diffMs <= -60 * 60 * 1000) return "Completed";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `In ${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `In ${minutes}m`;
}

export function formatLocalDateTime(isoTimestamp) {
  const d = new Date(isoTimestamp);
  return {
    date: d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}
