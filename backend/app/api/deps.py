import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import InvalidTokenError, decode_access_token
from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import get_user_by_id

# tokenUrl is just what shows in /docs' "Authorize" button — the actual login
# endpoint is POST /api/v1/auth/login (JSON body), not this OAuth2 form flow.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_error
    try:
        user_id = decode_access_token(token)
        user = get_user_by_id(db, uuid.UUID(user_id))
    except (InvalidTokenError, ValueError):
        raise credentials_error
    if user is None or not user.is_active:
        raise credentials_error
    return user
