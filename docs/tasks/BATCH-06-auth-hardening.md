# Batch 6: Auth Hardening

## Tasks
- TASK-050 — Email verification
- TASK-051 — Google OAuth

## Critical Context (from codebase analysis)
- Current `auth.service.ts` has NO email verification
- `resetPassword()` does O(n) bcrypt compare on ALL users — MUST FIX
- Password validation is weak (only 6+ chars, no complexity)
- Refresh token has no rotation (30-day static)
- Tokens stored in localStorage (XSS risk — consider httpOnly cookies later)

## Scope

### TASK-050: Email Verification
**Agent roles:** backend, frontend, architect
**Depends on:** Auth module (COMPLETED), Email module (COMPLETED)

**Backend:**
- Add to User entity: `emailVerified: boolean` (default false), `emailVerificationToken: string | null`
- On register: generate 6-digit code, send verification email, set `emailVerified = false`
- New endpoint: `POST /auth/verify-email` (accepts code)
- New endpoint: `POST /auth/resend-verification`
- NON-BLOCKING approach: user can use app without verification for 7 days
- After 7 days: social features (friends, challenges) require verified email
- Show banner on dashboard "Verify your email to unlock all features"
- Fix `findWithActiveResetToken()` — store token hash with userId index instead of scanning all users

**Frontend:**
- Verification code input page after registration
- Resend button with 60-second cooldown
- Yellow banner on dashboard for unverified users
- Redirect to verification if trying to access social features without verified email

**Security fixes included:**
- Strengthen password: min 8 chars, 1 uppercase, 1 number
- Fix reset token lookup: encode userId in token payload
- Add refresh token rotation on each use

**Risks:**
- Email delivery in dev uses console logging (EmailService). Need RESEND_API_KEY for real emails.
- Migration needed for new User fields

### TASK-051: Google OAuth
**Agent roles:** backend, frontend, architect
**Depends on:** TASK-050 (email verification field must exist)

**Backend:**
- Install `passport-google-oauth20`
- Add `googleId: string | null` to User entity
- `GET /auth/google` — redirect to Google consent
- `GET /auth/google/callback` — handle OAuth callback
- Account merge logic: if email already registered → link Google to existing account
- If new email → create account with `emailVerified: true`
- Generate JWT tokens same as regular login

**Frontend:**
- "Sign in with Google" button on login page
- "Sign in with Google" button on register page
- "Link Google Account" in Settings page
- Handle OAuth redirect flow (callback URL)

**Risks:**
- Need Google Cloud Console project + OAuth credentials
- Callback URL must be configured for both localhost and production domain
- Account merge edge cases: what if Google email differs from registered email?

## Estimated Effort: 8-12 hours
## Build verification: full test suite + manual OAuth flow test
