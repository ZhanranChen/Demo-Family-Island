# BUGS.md

Didn't exist before this change. Known limitations of the island renderer
as of this pass — not bugs in the sense of "broken," but honest gaps
between what's built and what's described in DESIGN.md/TODO.md as final.

- **Placeholder art, not final art.** Every asset in
  `assetRegistry.ts` points at a flat, hand-labeled SVG. They exist to
  prove the layering/positioning system works, not as shippable visuals.
- **`/island` currently renders mock data**, not a signed-in family's real
  decorations — see `TODO.md`.
- **Every object animates in together on each page load**, not just newly
  unlocked ones — there's no "have I seen this before" tracking yet.
- **`next.config.ts` has `dangerouslyAllowSVG: true`.** Safe today since
  every SVG served is our own static placeholder file, not user content —
  but this should be revisited (and likely removed) once real WebP/PNG
  assets replace the placeholders.
- **Not verified against a real build.** This environment has no network
  access to run `npm install`, so `npm run lint` / `npm run typecheck` /
  `npm run build` have not actually been run against this code. Please run
  them locally before merging — see TODO.md.
- **Overlap prevention is zone-based, not collision-checked.** Objects
  within the same zone are spread deterministically but nothing actively
  detects or resolves close calls between two specific objects; a zone
  with many objects could still produce visually tight clusters.
