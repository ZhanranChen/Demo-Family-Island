# DESIGN.md

This file didn't exist before this change — created now per the island
rendering rework. It covers the island renderer only; broader product
design decisions (colors, typography, why-this-tech-stack) still live in
`README.md`.

## Island rendering architecture (current)

### Why the previous approach changed
The original `/island` renderer was one SVG file with a `switch` on
decoration *category*, so every tree looked identical, positions were a
flat array index with no semantic meaning, and adding a new look required
editing shared code rather than dropping in an asset. It read as flat
clip art rather than a composed scene.

### Component hierarchy
```
IslandScene (responsive aspect-ratio canvas, owns "which object is selected")
├── IslandBase            — one persistent background image, always present
├── IslandObject × N      — one per unlocked object, absolutely positioned
│                            by percentage, Next/Image + Framer Motion
└── MemoryDetailCard       — opens on tap, shows the date an object was earned
```

### Asset registry
`features/island/lib/assetRegistry.ts` maps a symbolic `assetKey` (e.g.
`tree_pine_01`) to `{ src, width, height }`. Every component reads through
this registry — nothing else in the render path holds a literal file path.
Replacing a placeholder with real artwork is: drop the new file in
`public/assets/island/<category>/`, update its registry entry. No
component changes.

### Placement zones
`features/island/lib/placementZones.ts` defines five named regions as
percentage bounding boxes (`northGrove`, `centralHome`, `flowerMeadow`,
`waterfront`, `animalArea`), each object type mapped to one zone. For real
unlocked objects, `positionWithinZone()` produces a deterministic scatter
point plus a `zIndex` derived from `positionY` — objects lower on screen
stack above objects higher up, which reads correctly for the soft
isometric perspective without hand-tuning each one.

The one prototype scene in `lib/mockIslandObjects.ts` is hand-placed
instead, since the point of a first composition is deliberate layout
(cabin as focal point, open space reserved for growth) — see that file's
header comment for why it isn't run through the auto-scatter.

### How a decoration gets created in the first place
Unchanged by this rework: `supabase/migrations/0003_island_growth.sql`'s
trigger picks the next catalog decoration (deterministic, not random —
same Nth unlock always yields the same decoration) and inserts a
`family_decorations` row the instant a day unlocks. The renderer described
below only decides *how that row is drawn*, not *whether/when it exists*.

### What's stored vs. computed
`positionX/Y`, `scale`, `rotation`, and `zIndex` are **not** database
columns. They're computed in `api.ts` from `objectType` + the object's
running index within its category, via the same zone logic above. This
keeps the existing schema (`decorations`, `family_decorations`) unchanged.
If curated/manual placement is ever needed (a family drags an object to a
preferred spot), the natural extension is nullable `position_x`,
`position_y` columns on `family_decorations` that override the computed
default when present — not a schema rewrite.

### Unlock animation
New objects animate in via Framer Motion: `opacity 0→1`, `scale 0.7→1`,
a slight upward `y` rise, spring easing, no bounce or confetti — matching
the "cozy, not game-like" product tone. `useReducedMotion()` disables this
for anyone with that OS preference.

### Interaction
Tapping/clicking an object opens `MemoryDetailCard` with the date it was
earned. It does not yet reopen that day's actual shared entries — that
needs a query into `entries` keyed by the object's `memoryId`
(`check_in_days.id`), deliberately out of scope for this pass.

### Known placeholder-asset limitation
Every asset in the registry currently points at a hand-labeled placeholder
SVG under `public/assets/island/**` — flat, clearly marked "placeholder"
in the file itself, not final art. There is no image-generation tooling in
this environment to produce the intended premium isometric PNG/WebP set;
see `BUGS.md`.
