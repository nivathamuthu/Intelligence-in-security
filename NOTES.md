# Database migration and seed

Run these from the `backend` directory, after Postgres is up and `backend/.env` exists.

```bash
alembic upgrade head
python seed.py
```

`alembic upgrade head` creates the six tables from `alembic/versions/001_initial_schema.py`: admins, products, carts, cart_items, orders, and order_items.

`python seed.py` creates the admin user `admin` when it is missing. The password is `ADMIN_SEED_PASSWORD` from `.env` (the example value is `admin123`), stored as a bcrypt hash. If the products table is empty, the script inserts sample produce across Vegetables, Fruits, Dairy, and Grains, plus one inactive Spices product. Running it again does not duplicate those rows.
