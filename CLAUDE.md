# Daymont — Project CLAUDE.md

## Kickoff (Sprint 01 · 2026-09-23)

| Item | Decision |
|---|---|
| Client | Daymont S.A.S. — "Diseños, Automatizaciones y Montajes", Bogotá, since 1979. Contact: Fernando (Álvaro's cousin) |
| Vertical | Industrial B2B → skill `industrial-b2b-site` |
| Phase | Demo / sales piece for a real client. No payment agreed yet. Deploy to production after server + payment |
| Geography | Colombia · Spanish (es-CO). No Bill 96. Personal data consent under Ley 1581 when real forms go live |
| Stack | Astro 5 static build (pre-rendered HTML) + React islands (client:idle / client:visible) · Three.js via @react-three/fiber · GSAP ScrollTrigger + Lenis · GitHub Pages via GitHub Actions |
| Budget | [CLIENT: to be agreed, COP] |
| Palette | Undecided — 3 options switchable in header (Taller = recommended default, Azul, Acero). Decision pending with client |

## Skills this project uses
- `industrial-b2b-site` (vertical) — benchmark, 3-doors funnel, schema, copy rules
- `construction-lines-blueprint` — animated dashed axes (implemented in `src/scripts/construction.js`)
- `scroll-assembly-sequence` — pinned horizontal scroll + 3D assembly (`src/islands/Assembly.jsx`); image-sequence upgrade path in `docs/video-prompt.md`

## Brand rules (non-negotiable)
- Logos in `brand/` are Álvaro's own drawings. **Never redraw, re-space or simplify them.** Only the fill changes (`--brand` token).
- Tokens: `brand/tokens.json` is the single source of truth → mirrored in `src/styles/global.css` and the Figma file variables.
- Type: Barlow Condensed 900 (display, uppercase) · Barlow (body) · JetBrains Mono (labels, specs, data).
- Data, not adjectives. Never invent specs, clients, stats or certifications — use `[CLIENT: ...]` placeholders.

## Design system locations
- Figma: https://www.figma.com/design/WCcyGWcwqU5x9EpPMg6HUM (Palette variables with 3 modes: Taller / Azul / Acero)
- Claude design system: https://claude.ai/artifact/6vioJ8gi9MCQkt9eGTpeTX (3 themes, logos, Button / DoorCard / ConstructionLine / SpecCard)
- Live demo: https://aframirez177.github.io/daymont/ · Repo: https://github.com/aframirez177/daymont
- Tokens: `brand/tokens.json`
- First exploration (benchmark, palettes, logo studies): `docs/exploracion/daymont-exploracion.html`

## Structure
```
brand/            logos (exact) + tokens.json
public/           favicon, og.png, robots.txt, llms.txt, logo files
src/data/site.js  ALL content (company facts, doors, steps, catalog, solutions, FAQ)
src/layouts/      Base.astro (SEO head, JSON-LD, header, footer, palette switch)
src/pages/        index, estrategia (noindex kickoff), soluciones/[slug] (5 SEO landings)
src/islands/      React: HeroCylinder, Assembly, Configurator, cylinder.jsx (procedural 3D model)
src/scripts/      motion.js (Lenis, reveals, taller sticky, dataLayer), construction.js
```

## Conversion model (3 doors)
A Configurar cilindro → `rfq_submit` · B Reparar (WhatsApp photo) → `door_B` · C Fabricar pieza (drawing/STL) → `door_C`. All CTAs push `cta_click` to `window.dataLayer`.

## Pending from client ([CLIENT])
WhatsApp number (placeholder `573000000000` in `src/data/site.js`), sales email, NIT, client logos with permission, lead times, authorized brands, real shop photos/video, final palette.

## Commands
- `npm run dev` · `npm run build` · `npm run preview`
- Deploy: push to `main` → GitHub Actions → Pages. For a custom domain set `SITE` and `BASE=/` in `.github/workflows/deploy.yml`.
