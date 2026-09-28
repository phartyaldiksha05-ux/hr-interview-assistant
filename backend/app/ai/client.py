"""The only module that imports the Groq SDK. Everything else calls generators.py."""
import json
import time

from groq import Groq

from app.config import settings


class AIConfigError(Exception):
    """Raised when no API key is configured. Callers should surface this as a clear
    'AI not configured' error rather than pretending generation worked."""


class AIGenerationError(Exception):
    pass


def _get_client() -> Groq:
    if not settings.GROQ_API_KEY:
        raise AIConfigError(
            "GROQ_API_KEY is not set. Add it to backend/.env to enable AI features."
        )
    return Groq(api_key=settings.GROQ_API_KEY)


def generate_json(system_prompt: str, user_prompt: str) -> tuple[dict, str, int]:
    """Calls the LLM and asks for JSON-only output. Returns (parsed_json, model_name, latency_ms).
    Raises AIConfigError if no key is set, AIGenerationError on any other failure
    (bad JSON, API error, timeout) — callers must not fabricate a fallback result."""
    client = _get_client()
    start = time.monotonic()
    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt + "\n\nRespond with ONLY valid JSON, no markdown fences, no commentary."},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise AIGenerationError(f"LLM request failed: {exc}") from exc

    latency_ms = int((time.monotonic() - start) * 1000)
    raw = response.choices[0].message.content or ""
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AIGenerationError(f"LLM did not return valid JSON: {exc}") from exc

    return parsed, settings.GROQ_MODEL, latency_ms
