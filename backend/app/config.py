from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://debt_tracker:debt_tracker@localhost:5433/debt_tracker"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
