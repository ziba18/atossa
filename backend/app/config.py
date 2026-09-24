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
    llm_model: str = "openai/gpt-oss-20b"
    # gpt-oss is a reasoning model: without this it spends the whole token cap thinking and
    # returns an empty reply. Set to "" for providers/models that don't accept the parameter.
    llm_reasoning_effort: str = "low"

    class Config:
        env_file = ".env"


settings = Settings()
