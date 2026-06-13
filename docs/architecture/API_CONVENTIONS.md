# API Response Conventions

## Base URL

All endpoints are prefixed with `/api/v1`.

## Single Resource

Returns the resource directly as a JSON object.

Example: `GET /habits/:id` returns `{ id, title, category, ... }`

## Resource List

Returns an array directly (no wrapper object).

Example: `GET /habits` returns `[{ id, title, ... }, ...]`

## Create / Update

Returns the created or updated resource as a JSON object.

Example: `POST /habits` returns `{ id, title, ... }`
Example: `PATCH /habits/:id` returns `{ id, title, ... }`

## Delete

Returns `204 No Content` with an empty body.

Example: `DELETE /habits/:id` returns no body.

## Auth Endpoints

`POST /auth/register` and `POST /auth/login` return `{ accessToken, refreshToken, user }`.
`POST /auth/logout` returns `204 No Content`.
`GET /auth/me` returns the user profile object.

## Message Responses

Some endpoints return a simple message object.

Example: `POST /auth/forgot-password` returns `{ message: "..." }`
Example: `POST /auth/verify-email` returns `{ verified: boolean }`

## Errors

NestJS default exception format:

```json
{
  "statusCode": 400,
  "message": "Validation failed" | ["field must be ...", ...],
  "error": "Bad Request"
}
```

Validation errors return `message` as a string array.

## Timestamps

ISO 8601 format (e.g., `"2026-03-28T12:00:00.000Z"`).

## Money

Number with up to 2 decimal places (e.g., `2.50`).

## Response DTOs

Controllers use `*ResponseDto.fromEntity()` static methods to transform entities into response objects, stripping internal fields (password hashes, internal IDs, etc.).

## Rate Limiting

Auth endpoints use `@Throttle()` decorators:
- Register: 3 requests per 60s
- Login: 5 requests per 60s
- Refresh: 10 requests per 60s
- Forgot password: 1 request per 300s
- Resend verification: 1 request per 60s
