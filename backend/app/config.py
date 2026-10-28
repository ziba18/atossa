from pydantic_settings import BaseSettings

from app.services.secret_check import check_secret


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    # Set REQUIRE_STRONG_SECRET=1 once the live SECRET_KEY is known to pass; until then a weak one only logs a warning.
    require_strong_secret: bool = False
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    # Comma-separated allowed CORS origins; "*" keeps the previous behaviour.
    cors_origins: str = "*"
    # Set HIDE_API_DOCS=1 in production to switch off /docs, /redoc and /openapi.json.
    hide_api_docs: bool = False
    # Expected audiences for verifying social sign-in identity tokens.
    apple_bundle_id: str = "com.attosa.app"
    google_web_client_id: str = ""
    # Basket Buddy ("Groceries Mate", a separate app) signs in with Apple/Google through this
    # server too; see routers/basket_buddy.py. Its data stays in its own Supabase project, so
    # the server needs that project's secret (service_role) key to create sessions there.
    basket_supabase_url: str = "https://uwqmhhbxthnpgcbgvgqh.supabase.co"
    basket_supabase_secret_key: str = ""
    basket_apple_bundle_id: str = "com.zibazamani.basketbuddy"
    basket_google_web_client_id: str = ""
    # Basket Buddy's own Google OAuth clients (public IDs, Google Cloud project basket-buddy-505719).
    # Always accepted as audiences, next to BASKET_GOOGLE_WEB_CLIENT_ID: tokens can be issued for
    # the web (server) client or a platform client (iOS, Android/Play signing key).
    basket_google_known_client_ids: str = (
        "26319592248-opmaj600n8u25t50n1uggm95d2c2agup.apps.googleusercontent.com,"
        "26319592248-u75rpg95amvomqf00e8g2dot96al2q9t.apps.googleusercontent.com,"
        "26319592248-ii3skt18ducek3c9hkohuvjnsbg9v8hh.apps.googleusercontent.com"
    )
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
check_secret(settings.secret_key, strict=settings.require_strong_secret)
