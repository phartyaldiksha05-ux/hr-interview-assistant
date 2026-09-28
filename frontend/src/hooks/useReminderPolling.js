import { useCallback, useEffect, useRef, useState } from "react";
import { remindersApi } from "../api/reminders";

const NOTIFIED_REMINDERS_KEY = "meetwise_notified_reminders";
const SOUND_ENABLED_KEY = "meetwise_reminder_sound";

function readNotifiedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_REMINDERS_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

function readSoundPreference() {
  try {
    return localStorage.getItem(SOUND_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

async function claimReminderNotification(reminderId, seenIds) {
  if (seenIds.current.has(reminderId)) return false;
  const claim = () => {
    const notifiedIds = readNotifiedIds();
    if (notifiedIds.has(reminderId)) {
      seenIds.current.add(reminderId);
      return false;
    }
    notifiedIds.add(reminderId);
    seenIds.current.add(reminderId);
    try {
      localStorage.setItem(NOTIFIED_REMINDERS_KEY, JSON.stringify([...notifiedIds].slice(-500)));
    } catch {
      // In-app reminders remain available when browser storage is blocked.
    }
    return true;
  };

  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("meetwise-reminder-notifications", claim);
  }
  return claim();
}

const SOUND_DATA_URI =
  "data:audio/wav;base64,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";

/**
 * Polls GET /reminders/due every `intervalMs` and keeps the current set of
 * delivered-but-unacknowledged reminders in state. New reminders (by id, not seen
 * before) trigger a browser notification + a short sound; already-seen ones are shown
 * again on refresh (e.g. after a page reload) but don't re-fire the browser
 * notification/sound, so the same alarm isn't repeated every poll.
 */
export function useReminderPolling(intervalMs = 15_000) {
  const [reminders, setReminders] = useState([]);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference);
  const seenIds = useRef(readNotifiedIds());

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      // Some browsers/contexts (non-HTTPS, embedded webviews) throw here.
      // The app must keep working via the in-app banner regardless.
    }
  }, []);

  const playSound = useCallback(() => {
    if (!soundEnabled || permission !== "granted") return;
    try {
      const audio = new Audio(SOUND_DATA_URI);
      audio.volume = 0.4;
      audio.play().catch(() => {
        /* Autoplay can be blocked before any user interaction — non-fatal. */
      });
    } catch {
      /* Never let a sound failure break the app. */
    }
  }, [permission, soundEnabled]);

  const notifyNew = useCallback(
    (reminder) => {
      const title =
        reminder.reminder_type === "at_time"
          ? "Interview is starting"
          : reminder.reminder_type === "15_minute"
          ? "🔴 Interview in 15 minutes"
          : reminder.reminder_type === "1_hour"
          ? "🔔 Interview in 1 hour"
          : "🔔 Interview reminder";
      const localTime = new Date(reminder.interview_scheduled_at).toLocaleString();
      const body = `${reminder.candidate_name} — ${reminder.candidate_role} · ${localTime}${reminder.meeting_link ? ` · ${reminder.meeting_link}` : ""}`;

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(title, { body });
        } catch {
          /* Notification construction can fail in some contexts; in-app banner still shows. */
        }
      }
      playSound();
    },
    [playSound]
  );

  const poll = useCallback(async () => {
    try {
      const due = await remindersApi.due();
      setReminders(due);
      for (const reminder of due) {
        if (await claimReminderNotification(reminder.id, seenIds)) notifyNew(reminder);
      }
    } catch {
      // A single failed poll shouldn't crash the app or clear existing alerts;
      // just try again on the next interval.
    }
  }, [notifyNew]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [poll, intervalMs]);

  const acknowledge = useCallback(async (reminderId) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    try {
      await remindersApi.acknowledge(reminderId);
    } catch {
      // Re-poll will restore it if the acknowledge actually failed server-side,
      // rather than leaving the UI stuck on an optimistic removal.
      poll();
    }
  }, [poll]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((enabled) => {
      const next = !enabled;
      try {
        localStorage.setItem(SOUND_ENABLED_KEY, String(next));
      } catch {
        // The choice remains active for this session if storage is unavailable.
      }
      return next;
    });
  }, []);

  return { reminders, permission, requestPermission, acknowledge, soundEnabled, toggleSound };
}
