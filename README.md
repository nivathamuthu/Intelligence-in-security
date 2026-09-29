# Farmer Products Shopping Cart

A small shop for farmer produce. Customers browse active products, keep an anonymous cart, and place an order. An admin signs in to manage the catalog and review orders.

## Technology stack

- Backend: Python, FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic, PostgreSQL, python-jose (JWT), passlib with bcrypt
- Frontend: React (Vite), React Router, Axios, React Context, Tailwind CSS
- Local database: Docker Compose (`postgres:16`)

## Assumptions

- There is no customer login. The cart belongs to a random UUID created in the browser on the first visit, stored in `localStorage` as `cart_session_id`, and sent on every cart and checkout request as the `X-Cart-Session` header.
- Only the admin authenticates. Login returns a JWT access token. The frontend stores it in `localStorage` and sends `Authorization: Bearer`.
- One admin account is created by the seed script. The username is `admin`. The password is whatever you set as `ADMIN_SEED_PASSWORD` in `backend/.env`. The example file uses `admin123`.
- A product image is either an `http(s)` URL or a file uploaded by the admin. Uploads are saved under `backend/static/uploads` and served by FastAPI at `/static/uploads/...`. They are not stored in object storage.
- Checkout does not take payment. A successful order is stored with status `placed`.
- The grand total is always calculated on the server from current product prices. The client never sends a total.
- Order confirmation is public by numeric order id, matching the `SERIAL` primary key in the schema. Knowing an id is enough to open that order.
- Prices are shown in Indian rupees (INR).
- `GET /api/products` and `GET /api/products/{id}` return only `active` products. An admin editing a product calls the same detail route with `?admin=true` and a valid token so inactive products can be loaded.
- Setting a cart line quantity to `0` removes that line. The cart page uses a separate Remove button and does not show a line at quantity 0.
- A product that already appears on an order cannot be deleted. Cart lines for a deleted product are removed with the product.
- On Python 3.14, `psycopg2-binary` 2.9.13 and `bcrypt` 4.0.1 are pinned because older releases have no compatible wheels, and newer bcrypt breaks passlib.
- Docker publishes Postgres on host port 5433. Port 5432 is left for a Postgres install that may already be running on the machine.

## Database setup

From the repository root, with Docker running:

```bash
docker compose up -d
```

That starts Postgres 16 with user `farmer`, password `farmer`, and database `farmer_cart`. The host port is **5433** (container port 5432) so it does not collide with a Postgres instance already listening on 5432. `backend/.env.example` uses the same URL.

To use an existing Postgres instance instead, create the database and user yourself and put that URL in `backend/.env`.

## Backend setup

From `backend/`:

```bash
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\activate
copy .env.example .env
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

macOS / Linux:

```bash
source .venv/bin/activate
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

Edit `.env` before seeding if you want a different admin password or JWT secret. `GET http://localhost:8000/health` should return `{"status":"ok"}`. API docs are at `http://localhost:8000/docs`.

See `NOTES.md` for what the migration and seed script do.

## Frontend setup

From `frontend/`:

```bash
npm install
```

Windows:

```powershell
copy .env.example .env
npm run dev
```

macOS / Linux:

```bash
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:8000` for the API and `http://localhost:5173` for the UI. `VITE_API_BASE_URL` must point at the API.

## Run the whole app

1. `docker compose up -d` from the repository root.
2. Backend: create the virtualenv, copy `.env.example` to `.env`, install requirements, `alembic upgrade head`, `python seed.py`, then start uvicorn on port 8000.
3. Frontend: `npm install`, copy `.env.example` to `.env`, `npm run dev`.
4. Open `http://localhost:5173`.
5. Shop as a customer, then sign in at Admin with username `admin` and the seed password (`admin123` if you kept the example env).

## Business rules

- Customer endpoints only return products with status `active`.
- Cart quantity cannot exceed available stock, and cannot be negative. Removing the last unit removes the line.
- Checkout re-checks stock, computes the total on the server, snapshots the product name and price onto each order line, decrements stock, and clears the cart items.
- Admin and customer forms validate required fields in the browser and again on the server.
