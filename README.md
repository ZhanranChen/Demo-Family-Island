# Family Island — App Scaffold

A production-oriented Next.js 15 starting point for Family Island: the daily
check-in loop, private journal, and island growth mechanic described in the
architecture doc. This scaffold implements the **plumbing** (auth wiring,
data-access layer, DB schema + RLS, design system, dark mode) and a working
**Phase 2 slice** (text-only check-in) so the rest of the roadmap has a real
foundation to build on rather than empty folders.

## Getting started

See also: `DESIGN.md` (island renderer architecture), `TODO.md`, `BUGS.md`.

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL + anon key
# Run supabase/migrations/0001_init.sql against that project (via the SQL
# editor, or `supabase db push` if you're using the CLI locally)
npm run dev
```

---

## Why these choices

### Next.js 15 + App Router, not Pages Router
Server Components let the check-in status and island state be fetched
directly in a `page.tsx` with no client-side loading spinner or API round
trip — important for a "small daily ritual" app where every bit of friction
matters. Server Actions (`features/*/actions.ts`) replace hand-rolled API
routes for simple writes like submitting an entry, so there's one fewer
layer between a form and the database for the common case.

### TypeScript in strict mode, with `noUncheckedIndexedAccess`
This project touches a lot of "is everyone checked in yet" array/lookup
logic. That flag forces `array[i]` and `record[key]` accesses to be treated
as possibly-`undefined`, which catches the exact class of off-by-one bug
that would otherwise quietly unlock a day too early or too late.

### Tailwind CSS v4, CSS-first config
Tokens (colors, fonts, the custom `pebble` radius) live in an `@theme` block
in `globals.css` instead of a `tailwind.config.ts`. There's one fewer file
to keep in sync, and the tokens sit next to the CSS that consumes them.
Dark mode is repointed from v4's default `prefers-color-scheme` media query
to a `.dark` class via `@custom-variant`, because the product needs a
user-toggleable switch (`next-themes`), not just OS-level following.

### Supabase, with three separate client entry points
`lib/supabase/{client,server,middleware}.ts` are three different files
rather than one "smart" client, because a browser Supabase client and a
server one manage the auth session through fundamentally different
mechanisms (`document.cookie` vs. Next's `cookies()`). Making the choice
explicit at the import site (`@/lib/supabase/client` vs. `.../server`)
means it's impossible to accidentally use the wrong one and get a silent
auth bug.

### Authorization lives in Postgres (RLS), not in application code
Every feature's `api.ts` is deliberately a thin, boring mapping layer — it
does **not** re-check "does this user belong to this family?" because
`supabase/migrations/0001_init.sql` already enforces that with Row Level
Security policies. Two consequences worth knowing:
- If you add a new way to read data (an admin script, a cron job, a future
  mobile app hitting the same Supabase project), you inherit correct
  authorization automatically instead of having to remember to re-implement
  a check.
- The **"no peeking before everyone's checked in"** rule is enforced by the
  `entries` SELECT policy itself (you can only see other members' entries
  once `check_in_days.status = 'unlocked'`), not by the UI simply choosing
  not to render data it already fetched. A network tab inspection can't
  leak tomorrow's — or rather, today's still-locked — entries.

### The unlock is a database trigger, not app logic
`check_and_unlock_day()` in the migration fires after every entry insert
and flips the day to `unlocked` (and increments island growth) the moment
the entry count matches the family size. This was a deliberate choice over
checking-and-updating from the Next.js server action: two family members
submitting in the same instant is a real scenario for this product (everyone
opening the app at 8pm together), and a read-then-write race in application
code could double-increment growth or miss an unlock. A single atomic
trigger closes that race by construction.

### `journal_entries` has no `family_id` column at all
This is the one privacy decision worth calling out explicitly: the private
journal isn't "an entry with a private flag" — it's a structurally separate
table with no foreign key back to any family. It is architecturally
impossible for a future feature (an "family highlights" query, a careless
`select *`) to join journal content into anything family-visible, because
the join has nothing to key on.

### Feature-first folder structure, not layer-first
```
src/
├── app/            # routes only — thin, mostly data-fetch + compose
├── features/        # check-in/, island/, journal/ — each owns its
│                    # types, data-access (api.ts), server actions,
│                    # and components
├── components/      # ui/ (Button, Card — no feature knowledge),
│                    # theme/, layout/ — shared across features
└── lib/              # supabase clients, env validation, cn()
```
A `grep`-style question like "everything about journaling" has one answer:
`src/features/journal/`. This scales better than a `components/ / hooks/ /
services/` split once the app has several independent verticals (check-in,
island, journal all growing at different rates), since most changes only
ever touch one feature folder plus maybe `lib/`.

### `import "server-only"` at the top of every `api.ts`
A one-line guard that turns "a Client Component accidentally imported a
module that touches the Supabase server client / service role key" from a
runtime security incident into a build failure. Cheap insurance.

### Design tokens: "sand" (light) / "dusk" (dark), honey accent, moss secondary
Named for the light they evoke — midday sun on sand, dusk over water —
rather than generic `background`/`accent`, so the intent stays legible
while editing `globals.css` six months from now. The honey accent and the
`rounded-pebble` shape (used on buttons and cards) are the one deliberately
distinctive signature this scaffold leans on, kept restrained everywhere
else so it doesn't compete with the content families are actually sharing.

### `next-themes` for dark mode, not a hand-rolled context
It handles the two annoying parts correctly out of the box: reading
`prefers-color-scheme` on first load, and writing the class to `<html>`
*before* hydration via an inline script so there's no light-mode flash for
users with dark mode set. `ThemeToggle` guards against the resulting
server/client mismatch with a `mounted` check rather than suppressing the
warning at the component level.

### `env.ts` validates env vars with `zod` at import time
Only `NEXT_PUBLIC_*` values are parsed here — `SUPABASE_SERVICE_ROLE_KEY` is
intentionally never routed through a module that could end up bundled for
the client. Failing fast with a clear `ZodError` at boot beats a cryptic
network error the first time a Supabase call happens to run.

---

## What's stubbed vs. real

| Area | Status |
|---|---|
| DB schema + RLS + unlock trigger | Real, matches the architecture doc |
| Supabase client wiring (browser/server/middleware) | Real |
| Text check-in (submit, status, unlock trigger) | Real, end-to-end |
| Magic-link auth (`/login`, `/auth/callback`) | Real, end-to-end |
| Family onboarding (`/join-family`, create/join by invite code) | Real, end-to-end |
| Island visualization (`/island`) | Asset-driven renderer rebuilt — see `DESIGN.md`. Currently shows a hand-composed prototype scene with placeholder SVG assets; real family data wiring is implemented but not yet switched on (`TODO.md`) |
| `database.types.ts` | Hand-written stub — replace with `npm run gen:types` once a real Supabase project exists |
| Voice / photo composers | Not built — Phase 4 |
| Journal UI | Not built — Phase 5 |

### Island visualization, specifically
See `DESIGN.md` for the full architecture (asset registry, placement
zones, what's stored vs. computed). The short version: it's now an
asset-driven renderer (Next/Image + a registry of symbolic asset keys)
composing a persistent base layer with individually-positioned object
images, replacing the earlier single hand-drawn SVG approach.

## Next step
Voice and photo check-ins (Phase 4) are next — the composer, status pills,
and submit action already exist for text; this is mostly extending that
same pattern to two new media types plus Supabase Storage upload, so it's
a good "connect the pipes" task versus 3's heavier design surface area.
- **`sendMagicLink`** (`features/auth/actions.ts`) — passwordless over
  password auth, since it removes an entire support burden (forgotten
  passwords) for a once-a-day app.
- **`/auth/callback/route.ts`** — has to be a Route Handler, not a page,
  because exchanging the magic-link code for a session requires *writing*
  a cookie, and only Route Handlers and middleware can do that in the App
  Router.
- **`create_family` / `join_family`** are Postgres functions
  (`security definer`), not plain inserts from the server action. A
  brand-new user has no `family_members` row yet, so plain RLS can't let
  them `SELECT` a family to join by invite code, or safely insert into two
  tables (`families` + `family_members`) that must succeed or fail
  together. Scoping the privilege escalation to two small, specific
  functions is safer than opening a blanket INSERT policy on those tables.
- A profile row is created automatically via an `on_auth_user_created`
  trigger on `auth.users` — the client never has to remember a second
  "now create my profile" call after signup.

## Next step
The island visualization (Phase 3) is next — it's the piece with the most
real design surface area (the illustration itself, how decorations lay
out and animate in), so it's worth planning the visual approach together
before writing the component.
