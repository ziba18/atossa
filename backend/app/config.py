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
    # Chat provider: any OpenAI-compatible /chat/completions API. Defaults to Groq's free
    # tier; point LLM_BASE_URL at a self-hosted server (e.g. Ollama) to keep data in-house.
    llm_api_key: str = ""
    llm_base_url: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.1-8b-instant"

    class Config:
        env_file = ".env"


settings = Settings()
