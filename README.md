# FE-nextJS

Base frontend project using Next.js (Pages Router), TypeScript, and Tailwind CSS.

## Purpose

This project is the web client shell. Business-specific features were removed, and only reusable application foundations are kept.

## Core Structure

```text
FE-nextJS/
  pages/
    _app.tsx           # Global providers and auth gate
    _document.tsx      # HTML document wrapper
    index.tsx          # Base authenticated home page
    login.tsx          # Authentication entry page
    404.tsx            # Not-found page
    api/health.ts      # FE health endpoint
  src/
    auth/              # Auth types, context, login API, storage
    config/            # Runtime configuration (API URL)
    utils/             # HTTP client helpers and shared utilities
    styles/            # Global styles
```

## Runtime Flow

1. User opens FE on `http://localhost:3000`.
2. `AuthProvider` in `pages/_app.tsx` restores session from local storage.
3. If user is not authenticated, `AuthGate` redirects to `/login`.
4. Login form calls backend auth endpoint through `NEXT_PUBLIC_API_URL`.
5. Access token and profile are persisted in local storage.
6. Authenticated user lands on `/` and can interact with backend APIs.

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

- `NEXT_PUBLIC_API_URL`: Backend base URL (example: `http://localhost:8081`)

When calling the backend directly from the browser, the backend must allow CORS for the FE origin.

## Commands

```bash
yarn
yarn dev
yarn build
yarn start
```
