from sqlalchemy.orm import Session, joinedload

from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.common import money
from app.schemas.order import CheckoutRequest
from app.services.errors import AppError


def checkout(db: Session, session_id: str, payload: CheckoutRequest) -> Order:
    cart = (
        db.query(Cart)
        .options(joinedload(Cart.items).joinedload(CartItem.product))
        .filter(Cart.session_id == session_id)
        .first()
    )
    if not cart or not cart.items:
        raise AppError("Your cart is empty.")

    product_ids = [item.product_id for item in cart.items]
    locked = {
        product.id: product
        for product in db.query(Product).filter(Product.id.in_(product_ids)).with_for_update().all()
    }

    prepared: list[tuple[CartItem, Product]] = []
    for item in cart.items:
        product = locked.get(item.product_id)
        if not product or product.status != "active":
            name = item.product.name if item.product else "An item"
            raise AppError(f"{name} is no longer available. Please update your cart.")
        if item.quantity > product.available_quantity:
            raise AppError(
                f"Only {product.available_quantity} units of {product.name} are left in stock. "
                "Please update your cart."
            )
        prepared.append((item, product))

    total = money(0)
    snapshots = []
    for item, product in prepared:
        unit = money(product.price)
        subtotal = money(unit * item.quantity)
        total = money(total + subtotal)
        snapshots.append((item, product, unit, subtotal))

    order = Order(
        session_id=session_id,
        customer_name=payload.customer_name,
        customer_email=str(payload.customer_email),
        customer_phone=payload.customer_phone,
        customer_address=payload.customer_address,
        total_amount=total,
        status="placed",
    )
    db.add(order)
    db.flush()

    for item, product, unit, subtotal in snapshots:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=unit,
                quantity=item.quantity,
                subtotal=subtotal,
            )
        )
        product.available_quantity -= item.quantity

    for item in list(cart.items):
        db.delete(item)

    db.commit()
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order.id)
        .one()
    )


def list_orders(db: Session) -> list[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .all()
    )


def get_order(db: Session, order_id: int) -> Order | None:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
