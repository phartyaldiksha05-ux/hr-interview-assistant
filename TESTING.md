# End-to-end test plan

Run these yourself — I verified the backend logic against a real database while
building this, but I can't click through your browser or hear your speakers.

## 1. Start everything
```bash
docker compose up -d              # wait for "healthy"
cd backend && uvicorn app.main:app --reload --port 8000   # separate terminal
cd frontend && npm run dev                                  # separate terminal
```

## 2. Health check
Open http://127.0.0.1:8000/api/v1/health → expect `{"status":"ok","database":"connected"}`

## 3. Candidate + resume
1. In the app, go to **Candidates** → **+ Add candidate**. Fill in a real name/email/role.
2. Click **Upload PDF** on that row, pick any real PDF resume.
3. Check `GET /api/v1/candidates/{id}/resumes` in `/docs` → `parse_status` should be
   `completed` and `extracted_text` should contain real text from the PDF. If it's a
   scanned/image-only PDF, expect `parse_status: "failed"` with a clear error — that's
   correct behavior, not a bug.

## 4. AI summary (needs GROQ_API_KEY set in backend/.env)
`POST /api/v1/ai/candidates/{id}/summary` in `/docs`. With no key set, expect a clean
`status: "failed"` with an "AI not configured" message — not a crash, not fake data.
With a key set, expect `status: "completed"` and structured JSON content.

## 5. Schedule an interview a few minutes out (for fast reminder testing)
Go to **Interviews** → **+ Schedule interview**. Pick your candidate, and set the date/time
to **2-3 minutes from now** in your local clock — this is the practical way to test
reminders without waiting 24 hours.

Check the database directly to confirm all three reminder rows were created:
```bash
docker exec -it hr_postgres psql -U hr_user -d hr_assistant \
  -c "SELECT reminder_type, status, scheduled_for FROM reminders ORDER BY scheduled_for;"
```
Since your interview is only minutes away, all three (24h/1h/15min) should show
`status = skipped` — their fire time is already in the past, so they correctly don't
fire immediately. This is the expected, correct behavior, not a bug.

## 6. Force a reminder to actually fire (without waiting)
To see the alarm UI without waiting real hours, manually flip one reminder to `pending`
with a `scheduled_for` a minute in the past:
```bash
docker exec -it hr_postgres psql -U hr_user -d hr_assistant -c "
  UPDATE reminders SET status='pending', scheduled_for = now() - interval '1 minute'
  WHERE id = (SELECT id FROM reminders ORDER BY created_at DESC LIMIT 1);
"
```
Wait up to `REMINDER_POLL_SECONDS` (60s by default) — the backend scheduler polls on
that interval. Watch the backend terminal log a line like `Delivered 1 reminder(s)`.

## 7. Verify the alarm actually appears
Within ~15s after that (the frontend polls every 15s), you should see:
- A red badge in the top bar ("🔔 1 active")
- A card on the Dashboard under **Active Alerts** matching the mockup style
- If you've granted notification permission (click "Enable browser notifications" in
  the top bar first), a real OS-level browser notification
- A short beep sound (browser tab must have had at least one click/interaction first —
  browsers block autoplay audio otherwise; this is a browser restriction, not a bug)

## 8. Dismiss / acknowledge
Click **Dismiss** on the alert. It should disappear immediately. Confirm in the DB:
```bash
docker exec -it hr_postgres psql -U hr_user -d hr_assistant \
  -c "SELECT status, acknowledged_at FROM reminders ORDER BY created_at DESC LIMIT 1;"
```
Expect `status = acknowledged` with a real timestamp.

## 9. No duplicate delivery
Repeat step 6 is NOT needed to check this — just confirm you only saw the alert once
in step 7, and re-running the scheduler's poll on an already-delivered reminder won't
re-show it (only `pending` reminders get claimed).

## 10. Reschedule
On the Interviews page... (note: reschedule isn't wired into the Interviews UI yet —
test it via `/docs`): `PATCH /api/v1/interviews/{id}` with a new `scheduled_at`. Then:
```bash
docker exec -it hr_postgres psql -U hr_user -d hr_assistant \
  -c "SELECT reminder_type, status, scheduled_for FROM reminders WHERE interview_id='<id>';"
```
Expect 3 fresh rows with `scheduled_for` recomputed from the new time — old rows should
be gone entirely (not just cancelled), since a reschedule replaces them outright.

## 11. Cancel
Click **Cancel** on an interview in the Interviews page. Confirm any `pending`
reminders for it flip to `status = cancelled` in the DB.

## 12. Timezone sanity check
Change your OS/browser timezone (or just note your current one), reload the app, and
confirm the countdown and displayed times still make sense relative to your local
clock — the database only ever stores UTC; the frontend does all local conversion via
`Date`/`Intl`, never a hardcoded offset.

## 13. Persistence
Hard-refresh the browser (Ctrl+Shift+R). Candidates, interviews, and any
already-acknowledged reminders should still reflect the same state — confirming it's
reading from Postgres, not React state.

## Known gaps to expect, not bugs
- Interview questions and post-interview AI summary have working backend endpoints but
  no dedicated frontend screen yet — test via `/docs`.
- Reschedule has no button in the Interviews UI yet — test via `/docs` PATCH.
- Sound may not play until you've clicked somewhere on the page first (browser autoplay policy).
