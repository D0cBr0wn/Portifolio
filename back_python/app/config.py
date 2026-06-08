from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER_SECRET = "change_me_in_production_use_32b!"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite+aiosqlite:///./dev.db"
    jwt_secret: str = _PLACEHOLDER_SECRET
    admin_email: str = "admin@example.com"
    smtp_host: str = "localhost"
    smtp_port: int = 25
    smtp_user: str = ""
    smtp_password: str = ""

    @model_validator(mode="after")
    def validate_jwt_secret(self) -> "Settings":
        if self.jwt_secret == _PLACEHOLDER_SECRET:
            raise ValueError(
                "JWT_SECRET must be set to a unique secret in production"
            )
        return self


settings = Settings()
