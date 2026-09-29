from decimal import Decimal

from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=0)


class CartLineRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    category: str
    farmer_name: str
    image_url: str | None
    unit_price: Decimal
    available_quantity: int
    status: str
    quantity: int
    subtotal: Decimal


class CartRead(BaseModel):
    id: int
    session_id: str
    items: list[CartLineRead]
    grand_total: Decimal
