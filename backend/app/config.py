from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str

    MONEROO_API_KEY: str = ""
    MONEROO_WEBHOOK_SECRET: str = ""

    RUNPOD_API_KEY: str = ""
    RUNPOD_TEMPLATE_ID: str = ""
    RUNPOD_GPU_TYPE: str = "NVIDIA GeForce RTX 3060"

    WORKER_TOKEN: str = "change-me"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "*"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
