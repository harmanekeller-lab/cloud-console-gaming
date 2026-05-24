"""JWT verification for Supabase (Lovable Cloud) tokens — HS256."""
from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from .config import settings


def verify_supabase_jwt(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except JWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}")
    if not payload.get("sub"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No subject in token")
    return payload


CurrentUser = Depends(verify_supabase_jwt)
