from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductStatusUpdate, ProductStockUpdate, ProductUpdate
from app.services.errors import AppError


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, payload: ProductUpdate) -> Product:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(product, field, value)
    product.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(product)
    return product


def set_stock(db: Session, product: Product, payload: ProductStockUpdate) -> Product:
    product.available_quantity = payload.available_quantity
    product.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(product)
    return product


def set_status(db: Session, product: Product, payload: ProductStatusUpdate) -> Product:
    if payload.status is None:
        product.status = "inactive" if product.status == "active" else "active"
    else:
        product.status = payload.status
    product.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    try:
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(
            "This product appears on an existing order and cannot be deleted.",
            status_code=409,
        ) from None
