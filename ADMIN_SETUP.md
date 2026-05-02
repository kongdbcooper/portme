# Admin Account Setup

This project currently supports login only. It does not support public registration or signup.

## Create The Admin Account

1. Set the database URL in `.env` or `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

2. Optional but recommended: set the initial admin credentials before seeding:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="use-a-strong-password"
```

3. Run the seed command:

```bash
npm run db:seed
```

The seed script upserts one user with `role: 'ADMIN'`. That admin can log in at `/login`.

## Change Or Promote An Admin

There is no UI for creating users in this version. To change admin credentials, update the `users` table directly or adjust `ADMIN_EMAIL` / `ADMIN_PASSWORD` and rerun the seed script.

If future registration is added, new accounts should keep the default Prisma role `USER`. A user can only edit the website after an existing admin or database operator explicitly changes that account to `ADMIN`.

## Admin-Only Editing Rules

- `/admin/*` pages are protected by `src/proxy.jsx` and rechecked in `src/app/admin/layout.jsx`.
- Website-changing API routes call `requireAdmin()` from `src/lib/auth.jsx`.
- Inline text editing on public pages uses `EditableBlock`, which first checks `/api/auth/me` and only renders edit controls for `ADMIN`.
- Media uploads use `/api/upload/presign`, which also requires `ADMIN`.


npm install @smithy/node-http-handler