from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.admin import Admin

bearer_scheme = HTTPBearer(auto_error=False)


def _admin_from_credentials(
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
) -> Admin | None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        return None
    try:
        subject = decode_access_token(credentials.credentials)
        admin_id = int(subject)
    except (ValueError, TypeError):
        return None
    return db.get(Admin, admin_id)


def get_optional_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin | None:
    """Return the admin when a valid bearer token is present; otherwise None.

    Invalid tokens are treated as anonymous so public product browsing still works
    if a stale admin token is sitting in the browser.
    """
    return _admin_from_credentials(credentials, db)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Admin:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Not authenticated.")
    admin = _admin_from_credentials(credentials, db)
    if admin is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return admin
