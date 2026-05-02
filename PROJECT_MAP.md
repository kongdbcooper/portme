# Project Map

This document explains how the main folders and files work together. It is intentionally kept outside runtime code so documentation can improve without changing app behavior.

## Root

- `AGENTS.md`: Local agent rules. It requires reading Next.js docs from `node_modules/next/dist/docs/` before changing Next.js code.
- `package.json`: Scripts and dependencies for Next.js, React, Prisma, Cloudflare R2 uploads, auth, validation, and tests.
- `package-lock.json`: Locked dependency graph used by `npm install`.
- `next.config.mjs`: Next.js config, image remote patterns, CSP/security headers, and R2 media/connect permissions.
- `eslint.config.mjs`: ESLint setup used by `npm run lint`.
- `jsconfig.json`: Path aliases such as `@/`.
- `postcss.config.js`, `tailwind.config.js`, `src/app/globals.css`: Styling pipeline and Tailwind design tokens.
- `prisma.config.js`: Prisma CLI configuration and database URL loading.
- `README.md`, `CLAUDE.md`: Project notes.
- `.env`, `.env.local`, `.env.example`: Local environment values. These are ignored by git via `.gitignore`.

## Prisma

- `prisma/schema.prisma`: Database models for `User`, `Product`, `SiteSetting`, `Video`, and A/B test events.
- `prisma/seed.jsx`: Creates the initial admin account, starter settings, and sample products.
- `prisma/migrations/**/migration.sql`: Database schema history generated from Prisma.
- `prisma/migrations/migration_lock.toml`: Prisma migration provider lock.

## Core Libraries

- `src/lib/auth.jsx`: Reads the session cookie and exposes `requireAdmin()` for admin-only routes.
- `src/lib/session.jsx`: Creates, verifies, refreshes, and deletes JWT session cookies.
- `src/lib/prisma.jsx`: Creates the Prisma client using the PostgreSQL adapter.
- `src/lib/settings.jsx`: Cached public site settings used by the landing page and public layout.
- `src/lib/r2.jsx`: Cloudflare R2 client, upload validation, presigned upload URL creation, and object deletion.
- `src/lib/upload-client.jsx`: Browser helper that requests a presigned URL, then uploads directly to R2.
- `src/lib/ab-test.jsx`: A/B event tracking and admin stats helpers.

## Routing And Protection

- `src/proxy.jsx`: Runs before page requests. It protects `/admin` and redirects logged-in users away from `/login`.
- `src/app/layout.jsx`: Root app shell, global metadata, fonts, analytics, and global CSS.
- `src/app/(public)/layout.jsx`: Public site layout. Loads cached settings and passes logo settings into Navbar/Footer.
- `src/app/admin/layout.jsx`: Admin-only layout. Rechecks `ADMIN` role server-side before rendering dashboard pages.
- `src/app/(auth)/layout.jsx`: Auth page layout for `/login`.

## Public Pages

- `src/app/(public)/page.jsx`: Landing page composition. Loads settings, videos, products, and A/B variant.
- `src/app/robots.jsx`: Generates `robots.txt`.
- `src/app/sitemap.jsx`: Generates `sitemap.xml`.
- `src/app/not-found.jsx`, `src/app/loading.jsx`: App-level fallback states.

## Admin Pages

- `src/app/admin/page.jsx`: Dashboard overview and recent product stats.
- `src/app/admin/settings/page.jsx`: Admin media settings for site logo and hero background.
- `src/app/admin/products/page.jsx`: Product list, filters, and admin product actions.
- `src/app/admin/products/new/page.jsx`: Product creation page.
- `src/app/admin/products/[id]/edit/page.jsx`: Product edit page.
- `src/app/admin/products/DeleteProductButton.jsx`: Product delete client action.
- `src/app/admin/videos/page.jsx`: Video management and batch upload page.
- `src/app/admin/videos/new/page.jsx`: Single video creation page.
- `src/app/admin/videos/[id]/edit/page.jsx`: Video edit page using async Next.js route params.
- `src/app/admin/videos/[id]/edit/DeleteVideoButtonClient.jsx`: Video delete client action.
- `src/app/admin/ab-test/page.jsx`: Admin-only A/B testing stats view.

## API Routes

- `src/app/api/auth/login/route.jsx`: Validates credentials and creates a session.
- `src/app/api/auth/logout/route.jsx`: Deletes the session cookie.
- `src/app/api/auth/me/route.jsx`: Returns current auth status for client components such as inline editing.
- `src/app/api/settings/route.jsx`: Public settings read API and admin-only inline text update fallback.
- `src/app/api/admin/settings/route.jsx`: Admin-only settings save API. Revalidates cached settings and deletes old R2 media keys.
- `src/app/api/upload/presign/route.jsx`: Admin-only endpoint that returns short-lived R2 PUT URLs.
- `src/app/api/upload/route.jsx`: Admin-only server upload fallback.
- `src/app/api/products/route.jsx`: Public active-product listing; `admin=true` requires admin; product creation requires admin.
- `src/app/api/products/[id]/route.jsx`: Product get/update/delete. Update and delete require admin and clean old R2 image keys.
- `src/app/api/videos/route.jsx`: Public active-video listing; video creation requires admin.
- `src/app/api/videos/[id]/route.jsx`: Video update/delete. Both require admin and clean old R2 video keys.
- `src/app/api/ab-test/route.jsx`: Public event tracking and admin-only stats.

## Layout Components

- `src/components/layout/BrandLogo.jsx`: Shared logo renderer. Uses uploaded `site_logo_url` when available and falls back to the letter mark.
- `src/components/layout/Navbar.jsx`: Public navigation, section tracking, mobile menu, and shared logo.
- `src/components/layout/Footer.jsx`: Public footer links, brand column, and shared logo.

## Admin Components

- `src/components/admin/Sidebar.jsx`: Admin navigation and logout control.
- `src/components/admin/ImageUploader.jsx`: Admin image uploader for products and settings. Uses presigned R2 upload flow.
- `src/components/admin/ProductForm.jsx`: Product create/edit form. Saves uploaded image URL and R2 key.
- `src/components/admin/VideoForm.jsx`: Single video create/edit form. Uses presigned R2 upload flow.
- `src/components/admin/VideoUploadTable.jsx`: Batch video upload and save table. Uses presigned R2 upload flow.
- `src/components/admin/EditableBlock.jsx`: Inline text editor shown only to admin users on public pages.

## Public Sections

- `src/components/sections/HeroSection.jsx`: Hero UI and editable hero copy/background.
- `src/components/sections/ProductSection.jsx`: About/projects section and editable text blocks.
- `src/components/sections/VideoSection.jsx`: Public video carousel and modal player.
- `src/components/sections/ContactSection.jsx`: Contact and showcase section with editable text blocks.

## Analytics

- `src/components/analytics/GoogleAnalytics.jsx`: Loads GA4 when `NEXT_PUBLIC_GA_ID` is configured.

## Current Auth Model

- The app supports login only. There is no registration route or signup page.
- Only `ADMIN` users can access `/admin` and all website-changing API routes.
- Future user accounts can be added later because the Prisma schema already has `USER`, but users must not receive admin-only API access unless promoted to `ADMIN`.
