from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)
    display_name: str | None = Field(default=None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class SocialAuthRequest(BaseModel):
    id_token: str
    display_name: str | None = None
    # Google only: checked against the ID token's `at_hash` claim.
    access_token: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True
