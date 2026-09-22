# Miracle Edem

A focused React and TypeScript technical-evaluation application featuring:

**Register/Login → Better Auth Session → AI Assistant → Voice/Text → Google Gemini → controlled tool call → MongoDB reminder (user-isolated) → Google Gemini response**

---

## Authentication

Authentication is implemented using **Better Auth** with the official MongoDB adapter (`better-auth/adapters/mongodb`).

- **Registration Flow (`/register`)**: Users register with Full Name, Email, Password, and Confirm Password. Validation runs on both frontend and backend. Creates real users in MongoDB.
- **Login Flow (`/login`)**: Secure credential verification via Better Auth (`signIn.email`). Generates real session tokens managed via secure cookies.
- **Session Management**: Checked via `useSession()`. Protects the AI Assistant workspace—unauthenticated users are automatically redirected to `/login`.
- **Logout**: Handled via `signOut()`, terminating the session and clearing cookies.
- **Data Isolation**: Reminders stored in MongoDB are explicitly scoped to the authenticated `userId` derived from the verified session.

---

## Architecture

- `client/` — React SPA with the assistant conversation, voice conversation modal, register, and login pages.
- `client/lib/auth-client.ts` — Better Auth client (`createAuthClient`) providing `signIn`, `signUp`, `signOut`, and `useSession`.
- `client/services/api.ts` — Frontend API client for chat and audio transcription with `credentials: "include"`.
- `server/auth.ts` — Better Auth configuration with MongoDB adapter.
- `server/middleware/auth.ts` — `requireAuth` middleware validating Better Auth session cookies on protected endpoints like `POST /api/chat`.
- `server/config/` — Environment validation and shared MongoDB connection.
- `server/routes/` and `server/controllers/` — Small HTTP adapters for authentication, chat, and audio transcription.
- `server/services/` — Google Gemini tool calling and chat orchestration.
- `server/tools/` — Explicit tool definitions (`createReminder`) and execution.
- `server/repositories/` — MongoDB persistence for conversations and user-associated reminders.
- `shared/api.ts` — Request and response contracts shared by client and server.

---

## Prerequisites

- Node.js 20+
- pnpm
- A running MongoDB instance or MongoDB Atlas database
- A Google Gemini API key with access to the configured Gemini model

---

## Configuration

Copy `.env.example` to `.env` and set real values:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth session encryption. |
| `BETTER_AUTH_URL` | Base URL for authentication endpoints (e.g. `http://localhost:8080` or production domain). |
| `GEMINI_API_KEY` | Backend-only Google Gemini secret key. |
| `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_DATABASE` | Database name used by the app. |
| `PORT` | Production Express port. |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS with credentials. |
| `GEMINI_MODEL` | Gemini model supporting tool calling (default: `gemini-flash-latest`). |
| `APP_TIMEZONE` | Timezone instruction supplied to the assistant (default: `UTC`). |

---

## Install and Run

```bash
pnpm install
pnpm dev
```

`pnpm dev` serves the SPA and Express API through Vite on port 8080. For the production server:

```bash
pnpm build
pnpm start
```

---

## API Endpoints

### `GET /api/health`
Returns `200` only when configuration is valid and MongoDB is connected.

### `ALL /api/auth/*`
Better Auth endpoint handler for registration (`/sign-up/email`), login (`/sign-in/email`), logout (`/sign-out`), and session checking (`/get-session`).

### `POST /api/chat` *(Protected)*
Requires an authenticated Better Auth session cookie. Associates created reminders with the authenticated user ID.

### `POST /api/transcription`
Accepts `multipart/form-data` with audio for Google Gemini speech-to-text.

---

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```
