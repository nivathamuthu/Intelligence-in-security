# Farmer Products Shopping Cart — Cursor Module-by-Module Build Plan

Built from: *Full Stack Developer Assessment — Farmer Products Shopping Cart System (React.js + FastAPI)*

## How to use this document

Don't paste the whole thing into Cursor at once. Work through it in order:

1. Start a **new repo** and, in your editor, create a file `PROJECT_CONTEXT.md` at the repo root with the "Shared Project Context" block below. Keep it updated as you finish each module (check items off).
2. For each module, open a **fresh Cursor Composer/Agent chat**, paste the **Shared Project Context** block first, then the module's prompt right after it.
3. After Cursor finishes a module: run the app, manually test the acceptance criteria listed, fix anything broken, `git commit`, then move to the next module.
4. Never let Cursor jump ahead to a later module's scope — if it tries to (e.g. building cart logic while you're on the auth module), tell it to stop and stay in scope.

This keeps every Cursor session small, verifiable, and grounded in what's actually been built — instead of one giant unsupervised generation pass.

---

## Shared Project Context (paste at the top of every module prompt)

```
PROJECT: Farmer Products Shopping Cart System

Stack:
- Backend: Python, FastAPI, SQLAlchemy 2.0 (ORM), Pydantic v2, Alembic (migrations),
  PostgreSQL, python-jose (JWT), passlib[bcrypt] (password hashing), uvicorn.
- Frontend: React.js (Vite), functional components + hooks only, React Router v6,
  Axios, React Context API for auth/cart state, Tailwind CSS for styling.
- No customer authentication. Only the Admin logs in. The customer side is
  fully public/anonymous. The shopping cart is identified by a random
  session id (UUID) generated in the browser on first visit, stored in
  localStorage as "cart_session_id", and sent on every cart request as an
  "X-Cart-Session" header.

Repo layout (do not deviate from this structure):
project-root/
  backend/
    app/
      main.py
      core/
        config.py        # loads settings from .env via pydantic-settings
        database.py       # SQLAlchemy engine + session dependency
        security.py       # password hashing, JWT create/verify
      models/             # SQLAlchemy models, one file per entity
      schemas/            # Pydantic request/response schemas
      api/
        deps.py           # get_db, get_current_admin dependencies
        routes/
          auth.py
          products.py
          cart.py
          orders.py
      services/           # business logic (stock checks, totals, etc.)
    alembic/
    alembic.ini
    requirements.txt
    seed.py
    .env.example
  frontend/
    src/
      api/
        client.js          # axios instance, base URL from import.meta.env
        auth.js
        products.js
        cart.js
        orders.js
      context/
        AuthContext.jsx
        CartContext.jsx
      components/
      pages/
        admin/
          LoginPage.jsx
          ProductListPage.jsx
          AddProductPage.jsx
          EditProductPage.jsx
        customer/
          ProductListingPage.jsx
          ProductDetailsPage.jsx
          CartPage.jsx
          CheckoutPage.jsx
      routes/
        AppRoutes.jsx
        AdminProtectedRoute.jsx
      App.jsx
      main.jsx
    .env.example
    package.json
  README.md
  docker-compose.yml   # postgres service only, for local dev

Business rules that apply everywhere (do not violate in any module):
- Only products with status "active" are ever returned to customer-facing endpoints.
- A customer can never add/update cart quantity beyond a product's available stock.
- Quantity can never go negative; removing the last unit removes the cart line.
- Grand total is always computed server-side (never trust a client-sent total).
- On successful checkout, stock is decremented and the cart is cleared.
- All forms (admin and customer) validate required fields and sane types/ranges
  both client-side (immediate feedback) and server-side (source of truth).

Database schema (already finalized — implement exactly this in Module 1, then
only ever ADD to it in later migrations, never redesign it):

admins
  id            SERIAL PK
  username      VARCHAR UNIQUE NOT NULL
  password_hash VARCHAR NOT NULL
  created_at    TIMESTAMP DEFAULT now()

products
  id                 SERIAL PK
  name               VARCHAR NOT NULL
  category           VARCHAR NOT NULL
  farmer_name        VARCHAR NOT NULL
  description        TEXT
  price              NUMERIC(10,2) NOT NULL CHECK (price > 0)
  available_quantity INTEGER NOT NULL CHECK (available_quantity >= 0)
  image_url          VARCHAR
  status             VARCHAR NOT NULL DEFAULT 'active'  -- 'active' | 'inactive'
  created_at         TIMESTAMP DEFAULT now()
  updated_at         TIMESTAMP DEFAULT now()

carts
  id           SERIAL PK
  session_id   VARCHAR UNIQUE NOT NULL
  created_at   TIMESTAMP DEFAULT now()

cart_items
  id         SERIAL PK
  cart_id    INTEGER FK -> carts.id
  product_id INTEGER FK -> products.id
  quantity   INTEGER NOT NULL CHECK (quantity > 0)
  UNIQUE (cart_id, product_id)

orders
  id             SERIAL PK
  session_id     VARCHAR NOT NULL
  customer_name  VARCHAR NOT NULL
  customer_email VARCHAR NOT NULL
  customer_phone VARCHAR
  customer_address VARCHAR
  total_amount   NUMERIC(10,2) NOT NULL
  status         VARCHAR NOT NULL DEFAULT 'placed'
  created_at     TIMESTAMP DEFAULT now()

order_items
  id             SERIAL PK
  order_id       INTEGER FK -> orders.id
  product_id     INTEGER FK -> products.id
  product_name   VARCHAR NOT NULL   -- snapshot at time of order
  unit_price     NUMERIC(10,2) NOT NULL  -- snapshot at time of order
  quantity       INTEGER NOT NULL
  subtotal       NUMERIC(10,2) NOT NULL

Modules already completed: <UPDATE THIS LIST BEFORE EACH NEW SESSION>
- [ ] Module 0 — Project scaffolding
- [ ] Module 1 — Database models, migration, seed data
- [ ] Module 2 — Admin authentication
- [ ] Module 3 — Admin product management
- [ ] Module 4 — Customer product browsing
- [ ] Module 5 — Shopping cart
- [ ] Module 6 — Checkout & orders
- [ ] Module 7 — README, env files, polish
```

---

## Module 0 — Project Scaffolding

**Paste into Cursor (after the context block above):**

```
Set up the project skeleton exactly per the repo layout in the context above.
Do not implement any business logic yet — just working scaffolding.

Backend:
- FastAPI app in app/main.py with CORS enabled for http://localhost:5173.
- app/core/config.py using pydantic-settings, reading DATABASE_URL,
  JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRE_MINUTES, ALLOWED_ORIGINS from .env.
- app/core/database.py with SQLAlchemy engine, SessionLocal, and a get_db
  dependency generator.
- A GET /health endpoint returning {"status": "ok"}.
- requirements.txt with fastapi, uvicorn[standard], sqlalchemy, psycopg2-binary,
  alembic, pydantic-settings, python-jose[cryptography], passlib[bcrypt],
  python-multipart.
- Initialize alembic (empty, no models yet).
- backend/.env.example with placeholder values for every setting above.

Frontend:
- Vite + React project in frontend/.
- Install and configure Tailwind CSS.
- react-router-dom set up in src/routes/AppRoutes.jsx with placeholder routes
  for every page listed in the repo layout (each page can just render its
  own name for now).
- src/api/client.js: an axios instance with baseURL from
  import.meta.env.VITE_API_BASE_URL.
- frontend/.env.example with VITE_API_BASE_URL=http://localhost:8000.
- A minimal shared layout/header with nav links to Admin Login and Product
  Listing (placeholders are fine).

docker-compose.yml at repo root with a single postgres:16 service, exposing
5432, with env vars matching backend/.env.example's DATABASE_URL.
```

**Acceptance criteria:**
- `docker compose up -d` starts Postgres.
- `uvicorn app.main:app --reload` runs and `GET /health` returns 200.
- `npm run dev` starts the frontend and all placeholder routes render without errors.

---

## Module 1 — Database Models, Migration, Seed Data

**Paste into Cursor:**

```
Module 0 (scaffolding) is done and working. Now implement the database layer.

- Create SQLAlchemy models in app/models/ for admins, products, carts,
  cart_items, orders, order_items — matching the schema in the context above
  exactly (field names, types, constraints, relationships/foreign keys).
- Create Pydantic schemas in app/schemas/ for each entity: a Create schema,
  an Update schema (all fields optional), and a Read/response schema.
- Generate an Alembic migration that creates all these tables, and confirm
  `alembic upgrade head` applies cleanly against the docker-compose Postgres.
- Write backend/seed.py, a standalone script that:
  - creates one admin user (username "admin", password from an
    ADMIN_SEED_PASSWORD env var, hashed with bcrypt),
  - inserts at least 8 sample products across at least 3 categories
    (e.g. Vegetables, Fruits, Dairy, Grains), most "active" and at least
    one "inactive", with realistic names, farmer names, prices and stock.
- Add a short section to a NOTES.md (create if missing) describing how to
  run the migration and the seed script.
```

**Acceptance criteria:**
- `alembic upgrade head` creates all 6 tables with correct columns/constraints.
- `python seed.py` populates the admin + sample products without errors.
- You can inspect the DB (e.g. via `psql` or a GUI) and see the seeded rows.

---

## Module 2 — Admin Authentication

**Paste into Cursor:**

```
Modules 0–1 are done: scaffolding + DB models/seed exist and work. Now build
admin authentication only. Do not touch product/cart/order logic.

Backend:
- POST /api/auth/login accepting {username, password}, verifying against
  the admins table with passlib bcrypt, returning a JWT access token
  (subject = admin id, expiry from JWT_EXPIRE_MINUTES) on success and a
  401 with a clear error message on failure.
- app/api/deps.py: get_current_admin dependency that decodes the bearer
  token from the Authorization header and raises 401 if missing/invalid/expired.
- Apply proper request validation (username/password required, non-empty).

Frontend:
- src/context/AuthContext.jsx: holds the token (persisted in localStorage),
  a login(username, password) function calling the API, a logout()
  function, and an isAuthenticated flag.
- src/pages/admin/LoginPage.jsx: a form with validation (both fields
  required), calls AuthContext.login, shows a clear error message on
  failed login, and redirects to the Product List page on success.
- src/routes/AdminProtectedRoute.jsx: redirects to /admin/login if not
  authenticated; wrap all admin routes with it in AppRoutes.jsx.
- Axios client attaches the stored token as an Authorization: Bearer header
  automatically when present.
```

**Acceptance criteria:**
- Logging in with the seeded admin credentials returns a token and redirects
  into the admin area.
- Wrong credentials show an inline error, no redirect.
- Visiting an admin page while logged out redirects to the login page.
- Refreshing the browser keeps the admin logged in (token persisted).

---

## Module 3 — Admin Product Management

**Paste into Cursor:**

```
Modules 0–2 are done: scaffolding, DB, and admin auth all work. Now build
full product management, protected by get_current_admin. Do not touch
customer-facing pages or cart/order logic.

Backend (all under /api/products, all except the public GET ones require
a valid admin bearer token):
- POST /api/products — create a product (validate: name/category/farmer_name
  required, price > 0, available_quantity >= 0).
- GET /api/products?admin=true — list ALL products (active and inactive),
  for the admin product list. Support optional ?category= and ?search=
  filters for consistency with the customer endpoint built later.
- GET /api/products/{id} — full product details.
- PUT /api/products/{id} — update product fields.
- DELETE /api/products/{id} — delete a product.
- PATCH /api/products/{id}/status — toggle active/inactive.
- PATCH /api/products/{id}/stock — set available_quantity directly
  (validate >= 0).

Frontend (admin pages, behind AdminProtectedRoute):
- ProductListPage.jsx: table of all products (name, category, farmer,
  price, stock, status), with buttons/toggles to activate/deactivate,
  inline stock update, edit, and delete (with a confirm step before delete).
- AddProductPage.jsx: form for all product fields (image as either a URL
  input or a file upload — file upload can just be stored in a local
  backend "static/uploads" folder served as a static route), client-side
  validation matching backend rules, clear success/error feedback.
- EditProductPage.jsx: same form pre-filled with the existing product,
  same validation.
```

**Acceptance criteria:**
- Creating, editing, deleting, activating/deactivating, and updating stock
  all work end-to-end from the UI and persist to the DB.
- Trying to save a product with price <= 0 or a negative quantity is
  blocked with a validation message, both client- and server-side.
- All these endpoints reject requests without a valid admin token.

---

## Module 4 — Customer Product Browsing

**Paste into Cursor:**

```
Modules 0–3 are done. Now build the public, unauthenticated customer
browsing experience. Do not touch cart or checkout logic yet.

Backend:
- GET /api/products (public, no auth) — returns ONLY status="active"
  products. Support ?search= (case-insensitive match on product name) and
  ?category= (exact match) query params, combinable.
- GET /api/products/{id} (public) — full details of a single product;
  return 404 if it doesn't exist, and treat an inactive product as not
  found for this public endpoint.
- GET /api/products/categories (public) — distinct list of categories
  among active products, for populating the filter dropdown.

Frontend:
- ProductListingPage.jsx: responsive grid of product cards (image, name,
  category, farmer name, price, stock indicator), a search input (debounced),
  and a category filter dropdown, both driving the API query params. Show a
  clear "no results" state.
- ProductDetailsPage.jsx: full product info, quantity selector capped at
  available stock, "Add to Cart" button (can be wired to a stub for now
  if CartContext doesn't exist yet — real wiring happens in Module 5).
```

**Acceptance criteria:**
- Only active products ever appear to the customer, even if inactive ones
  exist in the DB.
- Search and category filter work independently and combined.
- Product details page correctly shows stock and blocks selecting more
  than available.

---

## Module 5 — Shopping Cart

**Paste into Cursor:**

```
Modules 0–4 are done. Now build the cart, identified by the X-Cart-Session
header (a UUID the frontend generates once and stores in localStorage).
Do not touch checkout/order logic yet.

Backend (all under /api/cart, all read the X-Cart-Session header and
create the cart row on first use if it doesn't exist yet):
- POST /api/cart/items {product_id, quantity} — add to cart. If the product
  is already in the cart, increase quantity instead of duplicating. Reject
  (400) if quantity <= 0, product is inactive, or requested quantity
  exceeds available stock (accounting for what's already in the cart).
- PUT /api/cart/items/{item_id} {quantity} — set quantity. Reject if it
  would exceed available stock or go below 1 (quantity 0 should instead
  be handled via the remove endpoint, or you can treat 0 as "remove").
- DELETE /api/cart/items/{item_id} — remove a line from the cart.
- GET /api/cart — return all cart lines with product details, unit price,
  line subtotal, and a server-computed grand_total.

Frontend:
- src/context/CartContext.jsx: generates/stores the session id, exposes
  addToCart, updateQuantity, removeItem, and the current cart + grand total,
  syncing with the backend on each action.
- Wire the "Add to Cart" button on ProductDetailsPage (and add one on each
  product card in ProductListingPage) to CartContext.addToCart, with a
  visible confirmation (toast or inline message).
- CartPage.jsx: list of cart lines with quantity steppers (respecting max
  stock), remove buttons, line subtotals, and the grand total, plus a
  "Proceed to Checkout" button. Show a clear empty-cart state.
- A persistent cart icon/badge in the header showing item count.
```

**Acceptance criteria:**
- Adding more than available stock is blocked with a clear message, both
  when adding fresh and when increasing an existing line's quantity.
- Quantity can never reach 0 or negative while still shown as a line item.
- Grand total shown in the UI always matches what GET /api/cart returns.
- Cart survives a page refresh (same browser/session).

---

## Module 6 — Checkout & Orders

**Paste into Cursor:**

```
Modules 0–5 are done, including a fully working cart. Now build checkout.

Backend:
- POST /api/orders/checkout {customer_name, customer_email, customer_phone,
  customer_address} — reads the current cart via X-Cart-Session, and:
  1. Re-validates stock for every line (in case it changed since it was
     added), rejecting with a clear error if any item now exceeds stock.
  2. Computes the grand total server-side.
  3. Creates an order + order_items (snapshotting product name and price
     at time of order).
  4. Decrements available_quantity on each product by the ordered quantity.
  5. Clears the cart (deletes its cart_items).
  6. Returns the created order (id, items, total, status) as confirmation.
  Reject checkout with a clear error if the cart is empty, and validate
  customer_name/email are required and email looks like an email.
- GET /api/orders (admin, protected) — list of past orders for reference.
- GET /api/orders/{id} (public) — a single order, for the confirmation page.

Frontend:
- CheckoutPage.jsx: order summary (from CartContext) plus a form for
  customer name, email, phone, address, with validation, a "Place Order"
  button that calls checkout, disables itself while submitting, and shows
  a clear error if checkout fails (e.g. stock changed).
- On success, navigate to an order confirmation view showing the order
  number, items, and total, and clear the local cart state.
```

**Acceptance criteria:**
- A full purchase flow — browse, add to cart, checkout — reduces the
  product's available_quantity by the correct amount in the DB.
- Checkout is rejected if another customer/admin action dropped stock
  below the cart's requested quantity in the meantime.
- The cart is empty after a successful checkout.
- Grand total on the confirmation page matches the sum of line subtotals.
```

---

## Module 7 — README, Env Files, and Final Polish

**Paste into Cursor:**

```
All functional modules (0–6) are complete and working end-to-end. This is
a polish pass only — do not add new features.

- Write a complete README.md at the repo root covering: project overview,
  technology stack, backend setup (venv, install, .env, migrate, seed, run),
  frontend setup (install, .env, run), database setup (docker-compose or
  manual Postgres), steps to run the whole app locally end-to-end, and an
  "Assumptions" section covering: no customer login (anonymous session-based
  cart), image upload stored locally vs. URL, single hardcoded admin account
  from seed data, and any other assumption you made along the way.
- Ensure backend/.env.example and frontend/.env.example are complete and
  accurate for every setting actually used in the code.
- Review every page for basic responsiveness (mobile width ~375px)
  and fix any obvious layout breakage.
- Add consistent loading and error states across pages that call the API
  (no silent failures, no unhandled promise rejections).
- Do a final pass ensuring all business rules from the spec are enforced:
  only active products shown to customers, stock never negative, grand
  total always server-computed, stock updated after checkout.
- Double-check CORS, .gitignore (exclude .env, node_modules, __pycache__,
  venv), and that the repo has no secrets committed.
```

**Acceptance criteria:**
- A reviewer can clone the repo, follow the README exactly, and get the
  full app running with no undocumented steps.
- No console errors in the browser or server during a full walkthrough.

---

## Deliverables checklist (from the assessment brief)

- [ ] GitHub repository, pushed and public/shared as required
- [ ] README.md (see Module 7)
- [ ] Database migration files (Alembic) or an equivalent SQL script
- [ ] `.env.example` for both backend and frontend
- [ ] Screenshots (optional but easy to add — a few from admin + customer flows)

## Workflow reminder between modules

1. Run the app, walk through that module's acceptance criteria by hand.
2. `git add -A && git commit -m "Module N: <short description>"`.
3. Update the checklist in `PROJECT_CONTEXT.md`.
4. Start a new Cursor chat for the next module so context stays small and focused.
