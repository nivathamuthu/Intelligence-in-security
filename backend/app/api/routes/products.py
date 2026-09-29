from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_optional_admin
from app.core.database import get_db
from app.models.admin import Admin
from app.models.product import Product
from app.schemas.product import (
    ImageUploadRead,
    ProductCreate,
    ProductRead,
    ProductStatusUpdate,
    ProductStockUpdate,
    ProductUpdate,
)
from app.api.uploads import save_upload
from app.services import product_service
from app.services.errors import AppError

router = APIRouter()


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


def _apply_filters(query, category: str | None, search: str | None):
    if category and category.strip():
        query = query.filter(Product.category == category.strip())
    if search and search.strip():
        escaped = search.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(Product.name.ilike(f"%{escaped}%", escape="\\"))
    return query


@router.get("/categories", response_model=list[str])
def list_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(Product.category)
        .filter(Product.status == "active")
        .distinct()
        .order_by(Product.category.asc())
        .all()
    )
    return [row[0] for row in rows]


@router.post("/upload", response_model=ImageUploadRead)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    _: Admin = Depends(get_current_admin),
):
    image_url = await save_upload(request, file)
    return ImageUploadRead(image_url=image_url)


@router.get("", response_model=list[ProductRead])
def list_products(
    admin: bool = Query(default=False),
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_admin: Admin | None = Depends(get_optional_admin),
):
    if admin and current_admin is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    query = db.query(Product)
    if not admin:
        query = query.filter(Product.status == "active")
    query = _apply_filters(query, category, search)
    return query.order_by(Product.name.asc()).all()


@router.post("", response_model=ProductRead, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    return product_service.create_product(db, payload)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    admin: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_admin: Admin | None = Depends(get_optional_admin),
):
    product = _get_product_or_404(db, product_id)
    if admin:
        if current_admin is None:
            raise HTTPException(status_code=401, detail="Not authenticated.")
        return product
    if product.status != "active":
        raise HTTPException(status_code=404, detail="Product not found.")
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    product = _get_product_or_404(db, product_id)
    return product_service.update_product(db, product, payload)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    product = _get_product_or_404(db, product_id)
    try:
        product_service.delete_product(db, product)
    except AppError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/{product_id}/status", response_model=ProductRead)
def update_status(
    product_id: int,
    payload: ProductStatusUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    product = _get_product_or_404(db, product_id)
    return product_service.set_status(db, product, payload)


@router.patch("/{product_id}/stock", response_model=ProductRead)
def update_stock(
    product_id: int,
    payload: ProductStockUpdate,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    product = _get_product_or_404(db, product_id)
    return product_service.set_stock(db, product, payload)
