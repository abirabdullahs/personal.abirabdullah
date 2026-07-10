# Personal Portfolio Website — Full A-Z Working Document

---

## 1. High-Level Architecture

```
┌─────────────────┐        ┌──────────────────┐        ┌───────────────┐
│   Frontend       │  API   │   Backend         │  SQL   │   Database     │
│  (Public site +  │ <────> │  (REST/GraphQL,    │ <────> │  (Supabase)    │
│   Admin panel)   │        │   Auth, Upload)    │        │                │
└─────────────────┘        └──────────────────┘        └───────────────┘
        │                          │
        │                          └── Image storage (Cloudinary)
        │
        └── Hardcoded static data (education, skills, achievements,
            experiences, technologies) — bundled at build time
```

| Layer | Choice | Notes |
|---|---|---|
| **Frontend** | Next.js (React) | Server-side rendering for SEO (blogs/projects need to be crawlable), static generation for hardcoded sections |
| **Backend** | Next.js API routes | For a solo portfolio, keeping it monolithic (Next.js full-stack) is simplest |
| **Database** | **Supabase** | Matches the final DBML |
| **Image hosting** | **Cloudinary** | Don't store images as binary in DB — upload to Cloudinary, store only the URL in DB fields like `image_url` |
| **Auth** | Single admin session | No multi-user complexity |

---

## 2. Two Zones of the Website

| Zone | Who Sees It | Data Source |
|---|---|---|
| **Public site** | Everyone | Mix of hardcoded data + DB data |
| **Admin panel** (`/admin`) | Only you, after login | DB data (create/edit/delete) |

The public site is what visitors browse. The admin panel is a private dashboard only you use to manage projects, posts, blogs, and gallery — hardcoded sections (education, skills, etc.) are **not** editable from admin; you edit those directly in code.

---

## 3. Authentication Flow (Admin Login)

1. `/admin/login` page — simple email + password form.
2. On submit → API checks credentials against `admin` table (`email`, hashed `password`).
3. Password stored using bcrypt hash — never plain text.
4. On success → issue a session (JWT in httpOnly cookie, or session-based via NextAuth).
5. All `/admin/*` routes and all write APIs (`POST`, `PUT`, `DELETE`) check for a valid session — if not logged in, redirect to `/admin/login`.
6. Public `GET` routes (viewing projects/blogs/gallery) need **no auth** — anyone can read.
7. Logout clears the session cookie.

> Since it's just you, no "forgot password" flow, no roles/permissions system needed — keep it minimal.

---

## 4. Hardcoded Content (Lives in Code, Not DB)

These are edited directly in source files (e.g. a `data/` folder with `.ts`/`.json` files) and redeployed when changed:

| File | Shape |
|---|---|
| `data/education.ts` | Array of `{ institution, degree, department, start_year, end_year, cgpa, description }` |
| `data/skills.ts` | Array of `{ name, category, icon, level }` |
| `data/achievements.ts` | Array of `{ title, description, issuer, date, certificate_link }` |
| `data/experiences.ts` | Array of `{ company_name, position, employment_type, work_mode, start_date, end_date, description, documents: [{ type, title, google_drive_link }] }` |
| `data/technologies.ts` | Mapping of tech name → icon (used to render the `tech_stack` array stored in `projects.tech_stack`) |

These render on Home/About pages via a simple `.map()` — no API call, no loading state, instant load, great for SEO.

---

## 5. Database-Driven Content (Lives in DB, Editable via Admin Panel)

- **Projects** (+ images) — CRUD from admin
- **Posts** (project updates + standalone posts) — CRUD from admin
- **Blogs** (+ categories, tags) — CRUD from admin, likely with a rich text/markdown editor
- **Gallery** (albums + images) — CRUD from admin, mainly image upload + captions
- **Admin profile** — your own bio/about/contact info, editable from an admin "Settings" page (so you don't need to redeploy just to change your phone number or bio)

---

## 6. Page-by-Page Breakdown (Public Site)

### 6.1 Home Page (`/`)
- Fetches: `admin` (bio, headline, avatar) — DB
- Hardcoded: skills (top few), achievements (top few), experiences (latest)
- Fetches: latest `projects` (e.g. featured ones), latest `posts`, latest `blogs` — DB
- All sections are read-only previews with "View all →" links to their full pages

### 6.2 About Page (`/about`)
- `admin.about` (long paragraph) — DB
- `education` — hardcoded
- `skills` (full list, grouped by category) — hardcoded

### 6.3 Projects Page (`/projects`)
- **List view:** cards from `projects` table (name, short_description, first image, tech_stack badges)
- **Click →** `/projects/[slug]` detail page:
  - All `project_images` (carousel/gallery)
  - `tech_stack` rendered as badges (icon looked up from hardcoded `technologies` map)
  - `live_link`, `github_repo` buttons
  - "Project Updates" section → `posts` where `project_id` matches, each with its `post_images`, sorted by `created_at`

### 6.4 Gallery Page (`/gallery`)
- `gallery_albums` (if used) as folders, or flat `gallery_images` grid
- Lightbox/modal view on click, showing `image_name`/`caption`

### 6.5 Posts Page (`/posts`)
- All `posts`, both linked and unlinked to a project (`project_id` nullable)
- If linked, show a small "part of [Project Name]" tag linking back to the project
- Sorted by `created_at`, `pinned` posts shown first

### 6.6 Blogs Page (`/blogs`)
- **List:** `blogs` where `status = published`, sorted by `published_at`
- Filter by `blog_categories` / `tags`
- **Click →** `/blogs/[slug]` detail page: full `content` (rendered markdown/HTML), `reading_time`, `views` (increment on load)

### 6.7 Admin Panel (`/admin/*`, private)
- `/admin/login` — auth
- `/admin/dashboard` — overview stats (total projects, posts, blogs, views)
- `/admin/projects` — list/create/edit/delete projects + upload images
- `/admin/posts` — list/create/edit/delete posts, optionally attach to a project
- `/admin/blogs` — list/create/edit/delete blogs, manage categories/tags
- `/admin/gallery` — upload/organize gallery images
- `/admin/settings` — edit your own `admin` profile info (bio, contact, resume link, etc.)

---

## 7. Image Upload Flow

1. Admin selects image in a form (project/post/blog/gallery).
2. Frontend uploads directly to **Cloudinary** (signed upload) — or via a backend API route that forwards it.
3. Cloudinary returns a public URL.
4. That URL is saved into the relevant `image_url` field in DB (`project_images`, `post_images`, `gallery_images`, `blogs.featured_image`, etc.)
5. Public pages just render `<img src={image_url} />` — no binary data ever touches your DB.

---

## 8. Request Flow Example — Visitor Views a Project

```
Visitor → GET /projects/my-app
   → Server fetches `projects` row by slug
   → Server fetches related `project_images`
   → Server fetches related `posts` (project updates) + their `post_images`
   → tech_stack (JSON array) parsed, matched against hardcoded technologies.ts for icons
   → Page rendered (SSR/SSG) with all data → sent to browser
```

---

## 9. Request Flow Example — You Publish a New Blog

```
You → Login at /admin/login → session cookie set
   → Go to /admin/blogs/new
   → Write content (markdown editor), upload featured_image
   → Submit → POST /api/blogs (auth-checked)
   → Server: generates slug from title, calculates reading_time,
     inserts row into `blogs`, links selected categories/tags
   → Blog now live at /blogs/[slug]
```

---

## 10. Tech Stack Recommendation (Summary)

| Layer | Suggestion |
|---|---|
| Frontend / Backend | Next.js (App Router) |
| Styling | Tailwind CSS |
| Database | **Supabase** |
| Image Storage | **Cloudinary** |
| Auth | NextAuth (Credentials provider) or custom JWT |
| Hosting | Vercel (frontend + backend) + Supabase (DB) |
| Rich Text Editor (blogs) | Tiptap or MDX |

---

## 11. Summary: What's Dynamic vs Static

| Type | Examples | Where It Lives |
|---|---|---|
| **Static (hardcoded)** | Education, Skills, Achievements, Experiences, Technologies list | Code (`data/*.ts`), redeploy to change |
| **Dynamic (DB + Admin CRUD)** | Projects, Project Images, Posts, Blogs, Blog Categories/Tags, Gallery | Database, edit anytime via `/admin` without redeploy |
| **Semi-dynamic** | Your own bio/contact info (`admin` table) | DB, editable via `/admin/settings` |

This keeps the site fast (static parts pre-rendered), SEO-friendly, and low-maintenance (you're not building CRUD UI for things that barely ever change), while still giving you full control over the parts that update often (projects, blog, gallery, updates).

---

## 12. UI / Design System

**Theme:** shadcn/ui — supports both dark and light mode.

### Component List
- Navigation Menu
- Button
- Card
- Badge
- Avatar
- Dialog
- Sheet (mobile menu)
- Tabs
- Accordion
- Tooltip
- Toast / Sonner
- Form
- Input
- Textarea
- Select
- Skeleton
- Separator
- Breadcrumb *(optional)*

### Admin Panel Components
- Table
- Dropdown Menu
- Pagination
- Alert Dialog
- Calendar *(if needed)*

### Final Tech Recommendation
- ✅ Next.js (App Router)
- ✅ Tailwind CSS
- ✅ shadcn/ui
- ✅ Lucide Icons
- ✅ Framer Motion (light animation)
- ✅ Dark / Light Mode
