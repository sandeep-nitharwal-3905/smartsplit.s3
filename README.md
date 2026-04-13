# SmartSplit

Supabase-backed rebuild of SmartSplit with modular services and realtime expense tracking.

## Setup
- Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project.
- Apply `supabase/schema.sql` in the Supabase SQL editor to create tables and enable realtime.
- Install dependencies: `npm install`.
- Run the dev server: `npm run dev`.

## Mobile PWA Push Notifications
- This app now supports Web Push notifications for installed PWA users.
- Required client env var: `VITE_VAPID_PUBLIC_KEY`.
- Required server env vars (deployment only): `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Generate VAPID keys once:

```bash
npx web-push generate-vapid-keys
```

- Add these values in your deployment provider (for example Vercel project settings).
- After deploying, users can enable notifications from the dashboard using the "Enable mobile notifications" button.

## Architecture
- `src/modules/supabase/` holds the Supabase client.
- `src/modules/data/` contains domain services (auth, groups, expenses, friends, settlements, profiles).
- `src/App.tsx` keeps UI logic and consumes the services; homepage lives in `src/components/HomePage.tsx`.

## Notes
- Google sign-in uses Supabase OAuth and redirects back to the app; the auth listener restores session.
- Realtime updates rely on `supabase_realtime` publication (added in `schema.sql`).