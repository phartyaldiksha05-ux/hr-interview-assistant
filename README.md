# Meetwise --- HR Interview Assistant

Meetwise is a full-stack HR Interview Assistant designed to help HR
teams manage candidates, resumes, interviews, interview notes,
reminders, and AI-assisted interview workflows from one workspace.

> **Current-state note:** This README documents the project based on the
> supplied project files and current implementation details. Unsupported
> backend details are intentionally not presented as implemented facts.

## Product Overview

Meetwise centralizes the interview lifecycle:

-   Candidate management
-   Resume upload and handling
-   Interview scheduling, rescheduling, and cancellation
-   Interview status management
-   Interview notes and feedback
-   AI-assisted candidate briefing
-   AI-generated interview questions
-   Post-interview AI summaries
-   Interview reminders
-   Browser notification controls
-   Interview scheduling email notifications

## Key Features

### Candidate Management

-   Add and manage candidates
-   Search candidates
-   Edit candidate information
-   Archive and restore candidates
-   View candidate details
-   Track contact information and job role

### Resume Management

-   Upload candidate resumes
-   Track resume processing/extraction status
-   View and download resumes

### Interview Management

-   Schedule interviews
-   Reschedule interviews
-   Cancel interviews
-   Mark interviews as completed
-   Mark interviews as no-show
-   Add interview notes and feedback
-   View interview details
-   Track interview status

### AI Features

Meetwise includes AI-assisted workflows for:

-   Candidate briefing / AI summary
-   Interview question generation
-   Post-interview AI summary
-   Interview-related insights

AI provider/model details should be treated as configuration-dependent
unless explicitly confirmed by the backend source.

### Notifications

-   Interview scheduling email notifications through EmailJS
-   Existing in-app reminder system
-   Browser notification controls
-   Sound/reminder preferences
-   Future Web Push notification support

## Current Architecture

``` text
                         ┌─────────────────────────┐
                         │       HR / Recruiter    │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │ React + Vite Frontend   │
                         │ • Workspace             │
                         │ • Candidates            │
                         │ • Interviews            │
                         │ • AI UI                 │
                         │ • Reminder UI           │
                         └────────────┬────────────┘
                                      │
                                  HTTP / API
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     FastAPI Backend     │
                         │ • Auth                  │
                         │ • Candidate APIs        │
                         │ • Resume APIs           │
                         │ • Interview APIs        │
                         │ • AI workflows          │
                         │ • Reminder processing   │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │        Database         │
                         └─────────────────────────┘
```

The frontend also contains browser-side integrations for EmailJS and
browser notification controls.

## Technology Stack

### Frontend

-   React
-   Vite
-   React Router
-   JavaScript / JSX
-   CSS
-   Browser Notification APIs / notification service integration
-   EmailJS browser SDK

### Backend

-   Python
-   FastAPI
-   APScheduler / existing reminder scheduling architecture

### Database

The backend uses a database configured through `DATABASE_URL`. The exact
database engine/schema should be verified from the backend source before
documenting it as a fixed implementation detail.

### AI

The application contains AI-assisted candidate and interview workflows.
Exact provider/model configuration should be taken from the actual
project environment/backend configuration.

### Optional Development / Team Tools

Slack, Jira, and similar tools may be used for development/team
collaboration, but they are **not core Meetwise product dependencies**.

## Project Structure

The supplied frontend follows a React/Vite organization with
pages/components, authentication, API/service integrations, and
reminder-related hooks/services.

``` text
Meetwise/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── backend/
│   ├── ...
│   └── ...
│
└── README.md
```

> The complete backend tree and exact backend entrypoint were not
> included in the supplied files, so backend filenames are intentionally
> not invented here.

## Authentication

Meetwise uses an email/password-based authentication flow in the
supplied frontend.

The frontend uses authentication context/protected application areas to
restrict workspace functionality to authenticated users.

**Important:** There is no OTP verification flow documented as a current
feature in the supplied implementation. Do not describe Meetwise as
having OTP-based registration unless that functionality is actually
added.

## Candidate Management

The candidate workflow supports:

1.  Creating/managing candidate records
2.  Searching candidates
3.  Editing candidate details
4.  Viewing candidate profiles
5.  Archiving candidates
6.  Restoring archived candidates
7.  Accessing resume information
8.  Viewing interview-related information
9.  Generating AI-assisted candidate briefings

Typical candidate details include:

-   Name
-   Email
-   Phone
-   Job role
-   Resume
-   Interview information

## Resume Management

Meetwise provides resume handling as part of the candidate workflow.

Current frontend functionality includes:

-   Resume upload
-   Resume processing/extraction status
-   Resume viewing/downloading
-   Resume-related candidate information

## Interview Management

``` text
Candidate
   │
   ▼
Schedule Interview
   │
   ├──► Reschedule
   ├──► Cancel
   │
   ▼
Interview
   │
   ├──► Complete
   └──► No-show
   │
   ▼
Notes / Feedback
   │
   ▼
AI Post-Interview Summary
```

Interview management includes scheduling, rescheduling, cancellation,
completion, no-show status, notes, feedback, details, and reminders.

## AI Features

### Candidate Briefing

HR can generate an AI-assisted briefing for a candidate to help prepare
for an interview.

### Interview Question Generation

Meetwise can generate interview questions for an interview/candidate
context.

### Post-Interview Summary

After an interview, AI can assist with summarizing interview information
and feedback.

### AI Design Principle

AI is intended to assist HR rather than replace human hiring decisions.
Human review remains part of the hiring workflow.

## EmailJS Interview Notification Flow

The supplied frontend imports the EmailJS browser SDK and uses it from
the interview scheduling workflow.

Therefore, the currently verified flow is:

``` text
HR schedules interview
        │
        ▼
Meetwise Frontend
        │
        ▼
EmailJS Browser SDK
        │
        ▼
Candidate receives interview scheduling email
```

### Important Implementation Note

Do **not** describe the current implementation as:

``` text
Meetwise Backend → EmailJS → Candidate
```

unless the backend source confirms that EmailJS is called from the
backend.

The supplied frontend demonstrates browser-side EmailJS integration.
This README intentionally documents the verified path rather than
inventing a backend email service.

## Current Reminder Architecture

Meetwise already has an existing reminder architecture for upcoming
interviews.

The reminder system is responsible for:

-   Detecting upcoming interview reminders
-   Showing in-app reminders
-   Maintaining reminder state/counts
-   Supporting reminder-related preferences
-   Supporting browser notification controls where enabled

The intended architecture is:

``` text
Interview Data
      │
      ▼
Existing Reminder Scheduler
      │
      ▼
Reminder Processing
      │
      ▼
Meetwise Frontend
      │
      ├──► In-app reminder
      └──► Browser notification (where supported/enabled)
```

The existing reminder system should remain the central scheduling
mechanism.

## Planned Web Push Architecture

Web Push should **not** introduce a second independent scheduler.

``` text
Existing Interview Reminder Scheduler
                 │
                 ▼
        Existing Reminder Event
                 │
                 ▼
        Web Push Delivery Layer
                 │
                 ▼
       HR Browser / Device
                 │
                 ▼
       System Notification
```

The intended flow is:

``` text
Meetwise Backend
       │
       ▼
Existing Reminder System
       │
       ▼
Web Push
       │
       ▼
HR's Browser / Device
       │
       ▼
Notification even when Meetwise tab is closed*
```

\*Subject to browser permissions, service-worker support, OS
notification settings, and device/browser availability.

### Current Web Push Status

Browser notification controls/push-related integration are present in
the supplied frontend.

However, the complete backend-to-browser Web Push delivery
implementation was not available in the supplied backend files for
verification. Therefore, full multi-device Web Push delivery should be
treated as a **planned/future capability until the backend delivery
implementation is verified**.

## Local Development Setup

### Prerequisites

Install:

-   Node.js
-   npm
-   Python 3.x
-   pip
-   Git

Make sure the required database and external services are available
according to the project's environment configuration.

## Backend Setup

``` bash
cd backend
```

Create a virtual environment:

### Windows

``` bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

``` bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

``` bash
pip install -r requirements.txt
```

Configure the backend environment variables.

Start FastAPI using the project's actual application entrypoint:

``` bash
uvicorn <module>:app --reload
```

> Replace `<module>` with the actual backend entrypoint used by the
> project. The exact entrypoint was not supplied for verification.

## Frontend Setup

``` bash
cd frontend
npm install
```

Create the required frontend environment file and configure the required
variables.

Start the development server:

``` bash
npm run dev
```

Vite will display the local development URL in the terminal.

## Environment Variables

### Backend

Example placeholders:

``` env
DATABASE_URL=
SECRET_KEY=
```

Additional AI/database/service variables should be added according to
the actual backend configuration. Do not invent variable names that are
not used by the codebase.

### Frontend

The supplied frontend uses EmailJS configuration values similar to:

``` env
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

For future Web Push support:

``` env
VITE_VAPID_PUBLIC_KEY=
```

Backend Web Push configuration may include:

``` env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_CLAIMS_EMAIL=
```

Only add Web Push variables when the backend Web Push implementation is
actually enabled.

## Security & Secrets

Never commit secrets to Git.

Do not commit:

``` text
.env
.env.local
.env.production
```

Sensitive configuration can include:

-   Database credentials
-   Application secret keys
-   AI API keys
-   Email/service credentials
-   VAPID private keys
-   Third-party service credentials

Use environment variables or a secure secret manager.

### Production Security Checklist

-   Use HTTPS
-   Protect API endpoints
-   Validate uploaded files
-   Restrict upload size/type
-   Protect database credentials
-   Rotate exposed secrets
-   Configure CORS carefully
-   Never expose private server credentials to the frontend
-   Keep VAPID private keys server-side

## Git / GitHub Workflow

Recommended workflow:

``` text
Create Feature Branch
        │
        ▼
Develop / Test
        │
        ▼
Commit
        │
        ▼
Push
        │
        ▼
Pull Request / Review
        │
        ▼
Merge
```

Example:

``` bash
git checkout -b feature/interview-reminders
git add .
git commit -m "Add interview reminder improvements"
git push origin feature/interview-reminders
```

Keep commits focused and descriptive.

Do not commit `.env`, API keys, passwords, private credentials,
generated secrets, or unnecessary build artifacts.

## Testing Checklist

### Authentication

-   [ ] Registration works
-   [ ] Login works
-   [ ] Protected workspace routes require authentication
-   [ ] Logout works
-   [ ] Invalid credentials are handled correctly

### Candidates

-   [ ] Candidate creation works
-   [ ] Candidate search works
-   [ ] Candidate editing works
-   [ ] Candidate archive works
-   [ ] Candidate restore works
-   [ ] Candidate details display correctly

### Resumes

-   [ ] Resume upload works
-   [ ] Resume processing/extraction status is correct
-   [ ] Resume view/download works
-   [ ] Invalid file handling works

### Interviews

-   [ ] Interview scheduling works
-   [ ] Candidate scheduling email works
-   [ ] Rescheduling works
-   [ ] Cancellation works
-   [ ] Completion works
-   [ ] No-show status works
-   [ ] Notes/feedback save correctly

### AI

-   [ ] Candidate briefing works
-   [ ] Interview question generation works
-   [ ] Post-interview summary works
-   [ ] AI failures are handled gracefully

### Reminders

-   [ ] Upcoming interview reminders appear
-   [ ] In-app reminder UI works
-   [ ] Reminder count/state is correct
-   [ ] Browser notification permission behavior is correct
-   [ ] Sound preference behaves correctly

### Web Push --- Future

-   [ ] Service worker registered
-   [ ] Push subscription created
-   [ ] Subscription stored securely
-   [ ] Backend can send push
-   [ ] Browser receives push
-   [ ] Notification appears when tab is closed
-   [ ] Permission denial is handled
-   [ ] Expired subscriptions are handled

## Deployment Architecture

A production deployment can follow this general architecture:

``` text
                    Internet
                       │
             ┌─────────▼─────────┐
             │ Frontend Hosting  │
             │ React + Vite      │
             └─────────┬─────────┘
                       │
                       │ HTTPS / API
                       ▼
             ┌───────────────────┐
             │ Backend Hosting   │
             │ FastAPI           │
             │ Reminder System   │
             └─────────┬─────────┘
                       │
             ┌─────────▼─────────┐
             │     Database      │
             └───────────────────┘

Additional integrations:

Frontend ─────► EmailJS
Backend ──────► AI / External Services
Backend ──────► Web Push (planned)
```

Exact production providers should be configured according to the actual
deployment environment.

## Production Considerations

### Backend

-   Configure production environment variables
-   Run behind HTTPS
-   Configure CORS
-   Add production logging
-   Add error handling
-   Configure database connections appropriately
-   Monitor reminder jobs
-   Ensure scheduler behavior is safe across multiple backend instances

### Frontend

-   Configure production API URL
-   Configure EmailJS production settings
-   Test browser permissions
-   Test responsive layouts
-   Test notification behavior

### Database

-   Use production credentials
-   Enable backups
-   Restrict public access where possible
-   Monitor performance

### Notifications

-   Validate reminder timing
-   Handle timezones correctly
-   Handle browser notification permissions
-   Clean up expired push subscriptions
-   Never expose private Web Push/VAPID keys

## Current Project Direction

Meetwise is being developed as an HR-focused interview workflow platform
rather than only a candidate CRUD application.

The current direction focuses on:

1.  Candidate management
2.  Resume handling
3.  Interview lifecycle management
4.  AI-assisted interview preparation
5.  AI-assisted post-interview analysis
6.  Existing interview reminders
7.  Email notifications
8.  Future reliable browser/device notifications

The product should remain simple for HR users while progressively
automating repetitive interview tasks.

## Future Improvements

### Web Push

-   Full backend Web Push delivery
-   Service worker notification handling
-   Multi-device subscriptions
-   Push subscription lifecycle management

### Interview Workflow

-   Interview templates
-   Interviewer assignment
-   Panel interviews
-   Calendar integrations
-   Automated follow-ups

### AI

-   Better candidate-job matching
-   Structured interview scoring assistance
-   Interview transcript analysis
-   Skill-gap analysis
-   More detailed post-interview insights
-   Configurable AI evaluation criteria

### Analytics

-   Hiring funnel analytics
-   Interview completion metrics
-   Candidate conversion metrics
-   Interviewer feedback analytics

### Security

-   Stronger authentication controls
-   Role-based access control
-   Audit logs
-   Improved file validation
-   More comprehensive API security

## Project Philosophy

### 1. Keep HR in control

AI should assist recruiters and interviewers, not make final hiring
decisions automatically.

### 2. Reuse existing infrastructure

New capabilities should extend the current architecture instead of
introducing unnecessary duplicate systems.

For example, Web Push should reuse the existing reminder scheduler
rather than creating another scheduler.

### 3. Keep the product focused

Slack, Jira, and similar tools may support development/team
collaboration, but they are not core product requirements.

### 4. Prefer reliable workflows

Interview scheduling, reminders, candidate records, and interview status
should remain predictable and auditable.

### 5. Keep sensitive data secure

Credentials, private keys, database passwords, and API secrets belong in
secure environment configuration rather than source control.

## License

No license file was included in the supplied project files.

Until a license is explicitly added to the repository, do not claim that
Meetwise is MIT, Apache-2.0, GPL, or another open-source licensed
project.

A license should be added intentionally if the project is going to be
distributed publicly.

## Current-State Verification Notes

The following points are intentionally documented conservatively:

-   The frontend is React + Vite.
-   React Router/protected application areas are present.
-   Candidate management, resume handling, interview lifecycle
    management, reminders, and AI-related UI/workflows are present in
    the supplied frontend.
-   EmailJS is integrated through the browser-side EmailJS SDK in the
    supplied interview scheduling workflow.
-   Browser notification/push-related frontend integration is present.
-   The complete backend Web Push delivery implementation was not
    available for verification.
-   The exact backend entrypoint and complete backend folder structure
    were not supplied.
-   OTP verification is not documented as a current feature.
-   Slack/Jira are not core Meetwise dependencies.
-   No specific production hosting provider is asserted unless confirmed
    by repository/deployment configuration.

This approach keeps the README aligned with the actual project instead
of inventing architecture that is not present.

## Summary

Meetwise is a full-stack HR Interview Assistant focused on making
candidate and interview management easier while adding practical AI
assistance.

Its core workflow is:

``` text
Candidate
   │
   ▼
Resume
   │
   ▼
Interview Scheduling
   │
   ├──► Email Notification
   ├──► Existing Reminder System
   ├──► AI Interview Preparation
   │
   ▼
Interview
   │
   ▼
Notes / Feedback
   │
   ▼
AI Summary
   │
   ▼
Future: Web Push Notification Delivery
```

The long-term direction is to build a reliable, AI-assisted interview
workspace while keeping the architecture simple, secure, and
maintainable.
