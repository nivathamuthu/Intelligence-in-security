from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.api.routes.cart import get_cart_session
from app.core.database import get_db
from app.models.admin import Admin
from app.schemas.order import CheckoutRequest, OrderRead
from app.services import order_service
from app.services.errors import AppError

router = APIRouter()


@router.post("/checkout", response_model=OrderRead, status_code=201)
def checkout(
    payload: CheckoutRequest,
    session_id: str = Depends(get_cart_session),
    db: Session = Depends(get_db),
):
    try:
        return order_service.checkout(db, session_id, payload)
    except AppError as exc:
        db.rollback()
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("", response_model=list[OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return order_service.list_orders(db)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order
