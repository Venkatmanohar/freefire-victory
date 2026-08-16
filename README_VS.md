# FREEFIRE VICTORY — VS CODE SETUP

## 1. Open
Extract the ZIP and open the extracted folder in VS Code.

## 2. Install
Run in the VS Code terminal:
`npm install`

## 3. Run
Run:
`npm start`

The project contains:
- `apps/player` — player/app preview
- `apps/web` — public website
- `apps/admin` — admin panel
- `backend` — API server
- `database/schema.sql` — PostgreSQL schema

## Important
The HTML previews are UI previews. For production payments, OTP/email/SMS verification,
UPI gateway/webhooks, authentication, database credentials, HTTPS, and deployment secrets,
connect real provider credentials and server-side integrations before production use.
Never put payment secrets in frontend HTML/JS.
