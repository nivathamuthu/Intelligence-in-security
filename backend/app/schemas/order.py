import re
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CheckoutRequest(BaseModel):
    customer_name: str = Field(min_length=1, max_length=255)
    customer_email: EmailStr
    customer_phone: str | None = Field(default=None, max_length=20)
    customer_address: str | None = Field(default=None, max_length=500)

    @field_validator("customer_name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Name is required.")
        return cleaned

    @field_validator("customer_phone", "customer_address", mode="before")
    @classmethod
    def blank_to_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return value

    @field_validator("customer_phone")
    @classmethod
    def phone_shape(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not re.fullmatch(r"[0-9+\-().\s]{7,20}", value):
            raise ValueError("Enter a valid phone number.")
        if len(re.sub(r"\D", "", value)) < 7:
            raise ValueError("Enter a valid phone number.")
        return value


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    customer_name: str
    customer_email: str
    customer_phone: str | None
    customer_address: str | None
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemRead]
