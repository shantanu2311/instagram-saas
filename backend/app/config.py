from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://igcreator:igcreator_dev@localhost:5432/igcreator"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # AI provider keys
    openai_api_key: str | None = None
    ideogram_api_key: str | None = None
    bfl_api_key: str | None = None
    minimax_api_key: str | None = None
    runway_api_key: str | None = None

    # S3 / object storage
    s3_bucket: str | None = None
    s3_region: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    s3_endpoint: str | None = None

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env"}


settings = Settings()


def get_settings() -> Settings:
    return settings
