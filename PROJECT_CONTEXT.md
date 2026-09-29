# Shared Project Context

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

Modules already completed:
- [x] Module 0 — Project scaffolding
- [x] Module 1 — Database models, migration, seed data
- [x] Module 2 — Admin authentication
- [x] Module 3 — Admin product management
- [x] Module 4 — Customer product browsing
- [x] Module 5 — Shopping cart
- [x] Module 6 — Checkout & orders
- [x] Module 7 — README, env files, polish
