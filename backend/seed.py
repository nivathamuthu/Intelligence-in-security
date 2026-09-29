"""Seed one admin and sample farmer products.

Run from the backend directory after `alembic upgrade head`:

    python seed.py
"""

from decimal import Decimal

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.admin import Admin
from app.models.product import Product

PRODUCTS = [
    {
        "name": "Heirloom Tomatoes",
        "category": "Vegetables",
        "farmer_name": "Meera Patel",
        "description": "Vine-ripened heirloom tomatoes, picked the same morning. Good for salads and chutney.",
        "price": Decimal("80.00"),
        "available_quantity": 40,
        "image_url": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Palak Bunch",
        "category": "Vegetables",
        "farmer_name": "Ravi Deshmukh",
        "description": "Tender spinach leaves, washed and bunched. Best used within two days.",
        "price": Decimal("35.00"),
        "available_quantity": 25,
        "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Farm Carrots",
        "category": "Vegetables",
        "farmer_name": "Anita Rao",
        "description": "Sweet orange carrots with the tops trimmed. Sold by the half kilo.",
        "price": Decimal("45.00"),
        "available_quantity": 60,
        "image_url": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Alphonso Mangoes",
        "category": "Fruits",
        "farmer_name": "Sunil Naik",
        "description": "Seasonal Ratnagiri Alphonso mangoes. Ripe, fragrant, and ready to eat.",
        "price": Decimal("220.00"),
        "available_quantity": 18,
        "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Robusta Bananas",
        "category": "Fruits",
        "farmer_name": "Lakshmi Iyer",
        "description": "A hand of ripe robusta bananas from a small coastal grove.",
        "price": Decimal("55.00"),
        "available_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Fresh Figs",
        "category": "Fruits",
        "farmer_name": "Joseph Thomas",
        "description": "Soft black figs. This batch is currently sold out.",
        "price": Decimal("180.00"),
        "available_quantity": 0,
        "image_url": "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Farm Cow Milk 1L",
        "category": "Dairy",
        "farmer_name": "Harpreet Singh",
        "description": "Fresh full-cream cow milk in a one-litre bottle. Keep chilled.",
        "price": Decimal("62.00"),
        "available_quantity": 30,
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Malai Paneer 200g",
        "category": "Dairy",
        "farmer_name": "Fatima Khan",
        "description": "Soft malai paneer made the same day. 200 gram pack.",
        "price": Decimal("120.00"),
        "available_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Stone-ground Atta 5kg",
        "category": "Grains",
        "farmer_name": "Karan Gill",
        "description": "Whole-wheat atta ground on a stone chakki. Five kilogram bag.",
        "price": Decimal("280.00"),
        "available_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Basmati Rice 1kg",
        "category": "Grains",
        "farmer_name": "Asha Devi",
        "description": "Aged basmati with long grains. One kilogram pack.",
        "price": Decimal("150.00"),
        "available_quantity": 35,
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
        "status": "active",
    },
    {
        "name": "Organic Turmeric",
        "category": "Spices",
        "farmer_name": "Nalini Menon",
        "description": "Sun-dried turmeric fingers. Hidden from the shop while the next harvest is graded.",
        "price": Decimal("90.00"),
        "available_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80",
        "status": "inactive",
    },
]


def main() -> None:
    password = settings.ADMIN_SEED_PASSWORD
    if not password:
        raise SystemExit("Set ADMIN_SEED_PASSWORD in backend/.env before running seed.py.")

    db = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if admin is None:
            db.add(Admin(username="admin", password_hash=hash_password(password)))
            print("Created admin user 'admin'.")
        else:
            print("Admin user 'admin' already exists; left the password unchanged.")

        if db.query(Product).count() == 0:
            db.add_all(Product(**row) for row in PRODUCTS)
            print(f"Inserted {len(PRODUCTS)} sample products.")
        else:
            print("Products already exist; skipped product seed.")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
