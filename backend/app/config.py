from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    # Expected audiences for verifying social sign-in identity tokens.
    apple_bundle_id: str = "com.attosa.app"
    google_web_client_id: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
