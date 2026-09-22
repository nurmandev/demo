# Miracle Edem

A focused React and TypeScript technical-evaluation prototype for the flow:

**Voice/Text → OpenAI → controlled tool call → MongoDB reminder → OpenAI response**

The frontend is intentionally one assistant screen. It has no authentication, dashboard, reminder history, or unrelated product features.

## Architecture

- `client/` — React SPA with the assistant conversation and composer.
- `client/services/api.ts` — the only frontend API client; it sends chat and audio requests to the backend.
- `server/config/` — validated environment configuration and a reusable MongoDB connection.
- `server/routes/` and `server/controllers/` — small HTTP adapters for chat and transcription.
- `server/services/` — OpenAI and chat orchestration logic.
- `server/tools/` — explicit tool definitions and validated tool execution.
- `server/repositories/` — MongoDB persistence for conversations and reminders.
- `shared/api.ts` — request and response contracts shared by client and server.

The backend uses Express because it is already part of the starter and keeps the evaluation focused. MongoDB is accessed through the official driver. OpenAI Chat Completions tool calling is isolated in `AiService`; the chat service owns the tool loop and never gives the model arbitrary function access.

## Prerequisites

- Node.js 20+
- pnpm
- A running MongoDB instance or MongoDB Atlas database
- An OpenAI API key with access to the configured chat and transcription models

## Configuration

Copy `.env.example` to `.env` and set real values:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Backend-only OpenAI secret. |
| `MONGODB_URI` | MongoDB connection string. |
| `MONGODB_DATABASE` | Database name used by the app. |
| `PORT` | Production Express port. |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS. |
| `OPENAI_MODEL` | Chat model supporting tool calling. |
| `OPENAI_TRANSCRIPTION_MODEL` | OpenAI audio transcription model. |
| `APP_TIMEZONE` | Timezone instruction supplied to the assistant, default `UTC`. |

Production startup validates all required variables and exits with a clear error if they are missing. The Vite development preview can still load without external credentials, but API calls return a safe configuration error until MongoDB and OpenAI are configured.

## Install and run

```bash
pnpm install
pnpm dev
```

`pnpm dev` serves the SPA and Express API through Vite on port 8080. For the production-style server:

```bash
pnpm build
pnpm start
```

Production startup connects to MongoDB before accepting requests. The server closes the HTTP listener and MongoDB client on `SIGINT` and `SIGTERM`.

## API

### `GET /api/health`

Returns `200` only when required external configuration is present and MongoDB is connected. Otherwise it returns `503` with a degraded status.

```json
{
  "status": "ok",
  "database": "connected"
}
```

### `POST /api/chat`

Validates the message, persists it to a conversation, calls OpenAI, executes only the registered `createReminder` tool when requested, persists the tool result, then asks OpenAI for the final response.

Request:

```json
{
  "message": "Remind me tomorrow at 10 AM to call John.",
  "conversationId": "optional-uuid"
}
```

Response after a real reminder is persisted:

```json
{
  "conversationId": "uuid",
  "message": {
    "role": "assistant",
    "content": "..."
  },
  "action": {
    "type": "reminder_created",
    "id": "uuid",
    "title": "Call John",
    "scheduledAt": "2026-09-22T10:00:00.000Z",
    "status": "active"
  }
}
```

The backend validates tool arguments with Zod, requires an ISO-8601 datetime with an explicit offset, and uses a conversation/tool-call idempotency key to avoid duplicate reminder inserts on retries.

### `POST /api/transcription`

Accepts `multipart/form-data` with an `audio` field. Audio is held in memory only, limited to 10 MB, checked against supported MIME types, and sent to OpenAI transcription. No OpenAI key reaches the browser.

```json
{
  "text": "Remind me tomorrow at 10 AM to call John"
}
```

The frontend records actual microphone audio with `MediaRecorder`, sends it to this endpoint, places the returned transcript in the composer, and lets the user edit it before sending.

## End-to-end tool flow

1. The browser posts the user message to `/api/chat`.
2. The backend stores the user message in MongoDB.
3. OpenAI receives the conversation and the strict `createReminder` schema.
4. If OpenAI requests the tool, the backend validates its JSON arguments.
5. `ReminderRepository` inserts the reminder in MongoDB with an idempotency key.
6. The stored action is sent back to OpenAI as the tool result.
7. OpenAI writes the final natural-language response.
8. The backend returns the final response and the actual stored action.
9. The UI renders the response and action card from that response.

If MongoDB or OpenAI fails, the backend returns a safe structured error and never claims that a reminder was created.

## Security and tradeoffs

- Secrets are loaded only from environment variables and are excluded from git.
- CORS uses the configured origin rather than `*`.
- JSON bodies are limited to 1 MB; audio uploads are limited to 10 MB.
- Generated tool arguments are validated before persistence.
- Only `createReminder` is registered; unknown model-requested tools are rejected.
- User content is not logged as raw payloads.
- This prototype stores a compact conversation record and does not add auth, queues, WebSockets, background jobs, or reminder management.
- The browser uses a request/response lifecycle instead of simulated streaming. The loading state reflects the real pending HTTP request.
- The configured timezone is supplied to OpenAI and all persisted reminder dates are ISO UTC values. For production multi-user timezone support, timezone should become explicit user input or account configuration.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

The automated tests cover request validation, strict reminder argument validation, idempotent reminder persistence, and safe error behavior. Full live acceptance testing requires valid OpenAI credentials and a reachable MongoDB instance.
