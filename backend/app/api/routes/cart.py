import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartRead
from app.services import cart_service
from app.services.errors import AppError

router = APIRouter()


def get_cart_session(x_cart_session: str | None = Header(default=None, alias="X-Cart-Session")) -> str:
    if not x_cart_session or not x_cart_session.strip():
        raise HTTPException(status_code=400, detail="Missing X-Cart-Session header.")
    try:
        return str(uuid.UUID(x_cart_session.strip()))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cart session.")


def _run(db: Session, action):
    try:
        return action()
    except AppError as exc:
        db.rollback()
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("", response_model=CartRead)
def get_cart(
    session_id: str = Depends(get_cart_session),
    db: Session = Depends(get_db),
):
    cart = cart_service.get_or_create_cart(db, session_id)
    return cart_service.serialize_cart(cart)


@router.post("/items", response_model=CartRead)
def add_cart_item(
    payload: CartItemCreate,
    session_id: str = Depends(get_cart_session),
    db: Session = Depends(get_db),
):
    return _run(db, lambda: cart_service.add_item(db, session_id, payload.product_id, payload.quantity))


@router.put("/items/{item_id}", response_model=CartRead)
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    session_id: str = Depends(get_cart_session),
    db: Session = Depends(get_db),
):
    return _run(db, lambda: cart_service.update_item(db, session_id, item_id, payload.quantity))


@router.delete("/items/{item_id}", response_model=CartRead)
def delete_cart_item(
    item_id: int,
    session_id: str = Depends(get_cart_session),
    db: Session = Depends(get_db),
):
    return _run(db, lambda: cart_service.remove_item(db, session_id, item_id))
