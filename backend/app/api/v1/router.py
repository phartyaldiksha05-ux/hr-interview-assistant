from fastapi import APIRouter

from app.api.v1 import ai, auth, candidates, dashboard, health, interviews, notes, questions, reminders, resumes

api_router = APIRouter()
api_router.include_router(health.router)   # no auth — used for uptime checks
api_router.include_router(auth.router)     # no auth — register/login themselves
api_router.include_router(candidates.router)
api_router.include_router(interviews.router)
api_router.include_router(reminders.router)
api_router.include_router(resumes.router)
api_router.include_router(ai.router)
api_router.include_router(questions.router)
api_router.include_router(notes.router)
api_router.include_router(dashboard.router)
