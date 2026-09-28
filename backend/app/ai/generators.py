from app.ai.client import generate_json
from app.ai.prompts import CANDIDATE_SUMMARY_SYSTEM, POST_INTERVIEW_SYSTEM, QUESTIONS_SYSTEM


def generate_candidate_summary(resume_text: str, job_role: str) -> tuple[dict, str, int]:
    user_prompt = f"Job role: {job_role}\n\nResume text:\n{resume_text[:12000]}"
    return generate_json(CANDIDATE_SUMMARY_SYSTEM, user_prompt)


def generate_interview_questions(resume_text: str, job_role: str, count: int = 8) -> tuple[dict, str, int]:
    user_prompt = f"Target job role: {job_role}\nGenerate {count} concise questions.\n\nCandidate resume text (source of candidate-specific facts):\n{resume_text[:12000]}"
    return generate_json(QUESTIONS_SYSTEM, user_prompt)


def generate_post_interview_summary(notes_text: str) -> tuple[dict, str, int]:
    user_prompt = f"Recorded HR interview notes and feedback:\n{notes_text}"
    return generate_json(POST_INTERVIEW_SYSTEM, user_prompt)
