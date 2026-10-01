from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DATABASE_URL: str
    CORS_ORIGINS: str = "http://localhost:5173"

    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    UPLOAD_DIR: str = "uploads"
    REMINDER_POLL_SECONDS: int = 60

    SECRET_KEY: str = "change-this-in-production-to-a-random-64-char-string"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Email / SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Meetwise AI HR Interview Assistant"
    SMTP_USE_TLS: bool = True
    RESEND_API_KEY: str = ""

    # Email OTP
    OTP_EXPIRE_MINUTES: int = 10
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_RESENDS: int = 5

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()