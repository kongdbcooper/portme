# Portme

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file from template:

```bash
cp .env.example .env.local
```

3. Fill required variables in `.env.local`:
   - `DATABASE_URL`
   - `SESSION_SECRET` (must be at least 32 chars)

4. Run migrations / seed (optional):

```bash
npm run db:migrate
npm run db:seed
```

5. Start development server:

```bash
npm run dev
```

## Production checks

Before deploying, verify build passes:

```bash
npm run build
```

If `SESSION_SECRET` is missing, build fails while collecting page data for API routes.
