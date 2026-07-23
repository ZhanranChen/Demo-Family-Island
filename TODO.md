# TODO.md

Didn't exist before this change — seeded here, scoped to what's
immediately next. Broader roadmap phases still live in `README.md`.

## Island renderer
- [ ] Replace placeholder SVGs in `public/assets/island/**` with real
      transparent PNG/WebP artwork (needs an external image-generation or
      illustration pipeline — not available in this environment).
- [ ] Swap `/island`'s data source from `MOCK_ISLAND_OBJECTS` back to
      `getIslandData(familyId)` (already implemented in
      `features/island/api.ts`) once real placeholder-vs-real-art parity
      is acceptable to ship.
- [ ] Wire `MemoryDetailCard` to actually reopen that day's shared
      `entries` (keyed by `object.memoryId`), not just show the date.
- [ ] Only animate *newly* unlocked objects on live updates — right now
      every object animates in together on page load; distinguishing
      "already seen" from "just unlocked" needs either a client-side seen-
      set or a realtime subscription telling the page what's new.
- [ ] Decide whether to add optional `position_x` / `position_y` override
      columns to `family_decorations` for manual/curated placement (see
      DESIGN.md "What's stored vs. computed").
- [ ] Re-run `npm run lint` and `npm run typecheck` locally — not run in
      this pass, no network access to `npm install` in this environment.

## Not part of this change
- Voice / photo check-ins (Phase 4)
- Journal UI (Phase 5)
