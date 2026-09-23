# Daymont — sitio web (demo Sprint 01)

Rediseño demo para **Daymont S.A.S.**, que fabrica cilindros hidráulicos y neumáticos en Bogotá desde 1979.

- **Demo en vivo:** https://aframirez177.github.io/daymont/
- **Estrategia / kickoff:** https://aframirez177.github.io/daymont/estrategia/ (página interna, no indexada)
- **Design system en Figma:** https://www.figma.com/design/WCcyGWcwqU5x9EpPMg6HUM
- **Design system en Claude:** https://claude.ai/artifact/6vioJ8gi9MCQkt9eGTpeTX

## Stack
- Astro 5, que genera el HTML estático en el build, con islas React para las partes interactivas.
- Three.js vía @react-three/fiber. El cilindro es un modelo procedural, así que no hay archivos 3D que descargar.
- GSAP ScrollTrigger + Lenis para el scroll.
- GitHub Actions → GitHub Pages.

## Desarrollo
```bash
npm install
npm run dev
```

## Paletas
Hay 3 propuestas (Taller, Azul y Acero) que se cambian desde el header. Los valores están en `brand/tokens.json` y en `src/styles/global.css`.

Ver `CLAUDE.md` para las reglas de marca y los datos pendientes del cliente.
