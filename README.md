# Abir Abdullah, Personal Portfolio

A full stack personal portfolio and blogging platform built with Next.js.
It includes a public facing site (projects, blog, gallery, posts, contact)
and a full admin dashboard for managing all of that content, backed by
Supabase.

## Features

Public site:

- Home, About, Projects, Blog, Posts, Gallery, and Contact pages
- Individual project detail pages with an image gallery and linked
  project update posts
- Blog with Markdown content (headings, bold and italic text, lists,
  links, code blocks, and inline images)
- Gallery with albums and a lightbox viewer
- Contact form that emails submissions and stores a copy for the admin
  to review, with spam protection (honeypot field, Cloudflare Turnstile,
  and rate limiting)
- Share buttons on blog and project pages
- SEO: per page metadata, Open Graph and Twitter card images, JSON LD
  structured data, robots.txt, and an image aware sitemap.xml

Admin dashboard (at /admin):

- Full page, Medium style blog editor with a rich text toolbar, inline
  image uploads, and Markdown import (file or pasted text)
- Manage projects, blog posts, short posts, and gallery images and
  albums
- Contact form message inbox
- Cloudinary based image uploads across every content type
- Automatic project update posts generated from GitHub pushes using
  OpenAI (with a Gemini fallback, and a plain text fallback if both are
  unavailable)

## Tech Stack

- Next.js 15 (App Router) and React 19
- TypeScript
- Tailwind CSS v4 with shadcn/ui components
- Supabase (Postgres, auth, row level security)
- Cloudinary for image storage and delivery
- Tiptap for the blog editor, rendered as Markdown
- Resend for transactional email
- Cloudflare Turnstile for bot protection

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment file and fill in real values (see the Environment
Variables section below):

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

The site will be available at http://localhost:3000, and the admin
dashboard at http://localhost:3000/admin/login.

## Environment Variables

All required variables are documented with comments in `.env.example`.
At a high level:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`: Supabase project credentials
- `NEXT_PUBLIC_SITE_URL`: the deployed domain, used for SEO metadata
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`:
  image uploads
- `RESEND_API_KEY`: sending contact form emails
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`: contact form
  bot protection (optional)
- `OPENAI_API_KEY`, `GEMINI_API_KEY`: auto generated project update
  posts from GitHub pushes (optional, Gemini is a fallback)
- `GITHUB_WEBHOOK_SECRET`: verifies incoming GitHub webhook requests
- `JWT_SECRET`: signs the admin session cookie

## Database

The database schema (tables, columns, and relationships) is described
in `initial schema.dbml`. Row level security policies used in Supabase
are noted in code comments near each table's usage, most notably in the
admin dashboard's Database tab, which includes copy paste ready setup
SQL.

## Project Structure

```
app/
  (public)/        Public facing pages (home, about, projects, blog,
                    posts, gallery, contact)
  admin/           Admin dashboard and the full page blog editor
  api/             API routes (admin CRUD, auth, uploads, contact form,
                    GitHub webhook)
components/
  admin/           Admin only components (editors, uploaders, section
                    lists)
  ui/              shadcn/ui primitives
data/              Static, code level content (skills, education,
                    experience, contact info)
lib/               Shared utilities (Supabase clients, auth, Cloudinary
                    helpers, rate limiting)
public/            Static assets
```

## Deployment

This project is built for deployment on Vercel. After connecting the
repository, set every variable from `.env.example` in the project's
environment settings, then deploy. A few features need a one time setup
after deployment:

- Run the setup SQL from the admin dashboard's Database tab in the
  Supabase SQL editor
- Add a GitHub webhook (Settings, Webhooks, Add webhook) pointing to
  `/api/webhooks/github` for any repository that should auto post
  updates
- Submit the sitemap (`/sitemap.xml`) in Google Search Console
