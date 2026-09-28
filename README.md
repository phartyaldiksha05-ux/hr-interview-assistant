# Meetwise AI — HR Interview Assistant

**An AI-assisted workspace for organizing candidates, preparing interviews, and keeping hiring workflows in one place.**

[**Live Application**](https://hr-interview-assistant-six.vercel.app/) · [**Backend API Documentation**](https://hr-interview-assistant.onrender.com/docs) · [**GitHub Repository**](https://github.com/phartyaldiksha05-ux/hr-interview-assistant)

> **Project status:** Actively developed by a three-member team. Some features listed in the roadmap are not yet available in the live application.

## Overview

Meetwise AI helps HR teams manage candidates, organize interviews, and use AI to support interview preparation. AI-generated material is intended to assist recruiters—not to make autonomous hiring decisions.

## Current Features

- HR registration and login
- Candidate management and candidate profiles
- Resume upload and extraction workflows
- AI-assisted interview preparation using Groq
- Interview scheduling, notes, and HR reminder workflows
- Dashboard for managing hiring activities

**Note:** The team is reviewing and testing existing workflows end to end. A listed feature may still be under improvement.

## Live Deployment

| Component | Platform | Link |
| --- | --- | --- |
| Frontend | Vercel | [Open Meetwise AI](https://hr-interview-assistant-six.vercel.app/) |
| Backend | Render | [API Documentation](https://hr-interview-assistant.onrender.com/docs) |
| Database | Neon PostgreSQL | Private; no public database link |
| Source code | GitHub | [hr-interview-assistant](https://github.com/phartyaldiksha05-ux/hr-interview-assistant) |

The Render Free instance may take time to respond after inactivity.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| Database | PostgreSQL, SQLAlchemy, Alembic |
| AI | Groq API |
| Authentication | JWT, bcrypt |
| Scheduling | APScheduler (current implementation) |
| Hosting | Vercel, Render, Neon |
| Planned email delivery | Resend or another transactional email provider |

## Team

| Member | Role | Responsibilities |
| --- | --- | --- |
| **Diksha Phartyal** | AI & Backend Lead | AI workflows, backend integration, database migrations, deployment, and end-to-end testing |
| **Anjali** | Authentication & Security | Email OTP verification, account security, password reset, and authentication tests |
| **Siddharth** | Interview Emails & HR Reminders | Candidate interview emails, rescheduling/cancellation messages, HR-only reminders, and delivery tests |

Responsibilities describe the next development phase and may evolve as the project progresses.

## Development Roadmap

- [ ] Verify HR email ownership during registration using OTP
- [ ] Add OTP expiry, retry limits, and resend cooldown
- [ ] Implement secure password reset
- [ ] Send candidates interview invitation emails
- [ ] Send candidates rescheduling and cancellation emails
- [ ] Keep interview reminders exclusive to HR
- [ ] Improve reliability of scheduled HR reminders
- [ ] Move private resume files to persistent, access-controlled storage
- [ ] Complete end-to-end regression and security testing

**Notification policy:** Candidates receive interview-related emails only; scheduled reminders are for HR users.

## Run Locally

### Prerequisites

- Python 3.11
- Node.js and npm
- A PostgreSQL database
- Required environment variables for database access, authentication, and AI services

### Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Create a local backend `.env` using the configuration variables expected by the application. Do not commit `.env` or API keys.

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend's `VITE_API_BASE_URL` to match the backend API base path used by the frontend API client.

## GitHub Collaboration

Each team member works on a separate feature branch and opens a pull request into `main`:

- `feature/ai-backend` — Diksha
- `feature/auth-otp` — Anjali
- `feature/interview-emails` — Siddharth

Before merging, review the code, run relevant tests, and check that existing candidate and interview workflows still work. Coordinate changes to shared email utilities and database migrations to avoid merge conflicts.

## Security & Privacy

- Never commit `.env` files, passwords, database URLs, API keys, or JWT secrets.
- Use test candidate data during development.
- Limit access to resumes and candidate information to authorized HR users.
- Do not automatically send internal interview notes or AI assessments to candidates.
- Obtain HR confirmation before sending candidate interview emails.

## License

No license has been specified yet. Please contact the project maintainers before reusing the source code.
