from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.common import money
from app.services.errors import AppError


def get_or_create_cart(db: Session, session_id: str) -> Cart:
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.session_id == session_id)
        .first()
    )
    if cart:
        return cart
    cart = Cart(session_id=session_id)
    try:
        db.add(cart)
        db.commit()
    except IntegrityError:
        db.rollback()
    return (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.session_id == session_id)
        .one()
    )


def serialize_cart(cart: Cart) -> dict:
    lines = []
    total = Decimal("0.00")
    for item in sorted(cart.items, key=lambda row: row.id):
        product = item.product
        unit = money(product.price)
        subtotal = money(unit * item.quantity)
        total = money(total + subtotal)
        lines.append(
            {
                "id": item.id,
                "product_id": product.id,
                "product_name": product.name,
                "category": product.category,
                "farmer_name": product.farmer_name,
                "image_url": product.image_url,
                "unit_price": unit,
                "available_quantity": product.available_quantity,
                "status": product.status,
                "quantity": item.quantity,
                "subtotal": subtotal,
            }
        )
    return {
        "id": cart.id,
        "session_id": cart.session_id,
        "items": lines,
        "grand_total": money(total),
    }


def _reload(db: Session, cart_id: int) -> Cart:
    return (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.id == cart_id)
        .one()
    )


def add_item(db: Session, session_id: str, product_id: int, quantity: int) -> dict:
    if quantity <= 0:
        raise AppError("Quantity must be greater than zero.")
    product = db.get(Product, product_id)
    if not product or product.status != "active":
        raise AppError("This product is not available.")
    cart = get_or_create_cart(db, session_id)
    item = next((row for row in cart.items if row.product_id == product_id), None)
    new_quantity = (item.quantity if item else 0) + quantity
    if new_quantity > product.available_quantity:
        raise AppError(
            f"Only {product.available_quantity} units of {product.name} are available."
        )
    if item:
        item.quantity = new_quantity
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        cart = get_or_create_cart(db, session_id)
        item = next((row for row in cart.items if row.product_id == product_id), None)
        if not item:
            raise AppError("Could not add this product to the cart. Please try again.")
        new_quantity = item.quantity + quantity
        if new_quantity > product.available_quantity:
            raise AppError(
                f"Only {product.available_quantity} units of {product.name} are available."
            )
        item.quantity = new_quantity
        db.commit()
    return serialize_cart(_reload(db, cart.id))


def update_item(db: Session, session_id: str, item_id: int, quantity: int) -> dict:
    if quantity < 0:
        raise AppError("Quantity cannot be negative.")
    cart = get_or_create_cart(db, session_id)
    item = next((row for row in cart.items if row.id == item_id), None)
    if not item:
        raise AppError("That item is not in your cart.", status_code=404)
    if quantity == 0:
        db.delete(item)
        db.commit()
        return serialize_cart(_reload(db, cart.id))
    product = item.product
    if product.status != "active":
        raise AppError(f"{product.name} is no longer available.")
    if quantity > product.available_quantity:
        raise AppError(
            f"Only {product.available_quantity} units of {product.name} are available."
        )
    item.quantity = quantity
    db.commit()
    return serialize_cart(_reload(db, cart.id))


def remove_item(db: Session, session_id: str, item_id: int) -> dict:
    cart = get_or_create_cart(db, session_id)
    item = next((row for row in cart.items if row.id == item_id), None)
    if not item:
        raise AppError("That item is not in your cart.", status_code=404)
    db.delete(item)
    db.commit()
    return serialize_cart(_reload(db, cart.id))
