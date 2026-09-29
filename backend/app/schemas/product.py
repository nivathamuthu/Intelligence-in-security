from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _clean_required(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("must not be blank")
    return cleaned


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=255)
    farmer_name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    available_quantity: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=1000)
    status: Literal["active", "inactive"] = "active"

    @field_validator("name", "category", "farmer_name")
    @classmethod
    def required_text(cls, value: str) -> str:
        return _clean_required(value)

    @field_validator("description", "image_url")
    @classmethod
    def optional_text(cls, value: str | None) -> str | None:
        return _clean_optional(value)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=255)
    farmer_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    available_quantity: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=1000)
    status: Literal["active", "inactive"] | None = None

    @field_validator("name", "category", "farmer_name")
    @classmethod
    def required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return _clean_required(value)

    @field_validator("description", "image_url")
    @classmethod
    def optional_text(cls, value: str | None) -> str | None:
        return _clean_optional(value)


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    farmer_name: str
    description: str | None
    price: Decimal
    available_quantity: int
    image_url: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class ProductStockUpdate(BaseModel):
    available_quantity: int = Field(ge=0)


class ProductStatusUpdate(BaseModel):
    status: Literal["active", "inactive"] | None = None


class ImageUploadRead(BaseModel):
    image_url: str
