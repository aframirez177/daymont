# Hydraulic cylinder assembly — AI video prompt (for scroll image sequence)

Goal: an 8–10 s, 16:9 video of a Daymont tie-rod hydraulic cylinder assembling itself, to be cut into ~150–180 frames and scrubbed with scroll (upgrade path for `src/islands/Assembly.jsx`). Recommended tools: Veo 3, Kling 2.x, Runway Gen-4, Sora. Generate each keyframe as a still first (image model), then use first/last-frame video generation between consecutive keyframes for maximum consistency.

## Master prompt
Photorealistic industrial product animation. A single tie-rod hydraulic cylinder assembles itself piece by piece along its horizontal axis, centered in frame, on a seamless matte charcoal background (#0E0E0E) with a faint dashed technical-drawing grid. Locked-off camera, three-quarter view from slightly above (15°), 50 mm lens, no camera movement, no cuts. Soft studio key light from top-left, cool rim light from behind, realistic reflections on chrome and honed steel. Parts glide in slowly along the cylinder axis with mechanical precision and settle with a tiny ease-out; no bouncing, no particles, no text. Materials: honed carbon-steel tube, hard-chrome rod, black nitrile seals, machined steel end caps, zinc-plated tie rods with hex nuts, brass ports. Final state is painted safety orange (#F24E1E) with chrome rod exposed. 16:9, 24 fps, 10 seconds, sharp focus throughout, consistent lighting in every frame.

Negative: camera motion, zoom, cuts, people, hands, logos, text, watermark, smoke, sparks, lens flare, depth-of-field blur, extra parts, deformation, melting geometry.

## Keyframes (same camera, same light in all)
| t | Keyframe | Description |
|---|---|---|
| 0.0 s | K1 · Camisa | Only the bare honed steel barrel tube, centered, empty background grid visible. |
| 1.4 s | K2 · Vástago | Chrome piston rod slides in from the right along the axis and stops aligned, rod eye at the right end. |
| 2.8 s | K3 · Pistón y sellos | Machined piston with two black seals slides in from the left inside the barrel and meets the rod. |
| 4.2 s | K4 · Tapas | Front and rear square end caps with brass ports close both ends of the barrel; rear clevis visible. |
| 5.6 s | K5 · Tirantes | Four tie rods slide in from the right through the cap corners; hex nuts spin on and seat. |
| 7.0 s | K6 · Prueba de presión | Assembled bare-steel cylinder; rod extends and retracts once smoothly; a thin orange glow ring pulses around the barrel at the piston position. |
| 8.4 s | K7 · Pintura | Barrel and caps transition to satin safety-orange paint (#F24E1E) from left to right; chrome rod and tie rods stay bright. Hold final frame 1.5 s. |

## Cut into frames
```bash
ffmpeg -i daymont-assembly.mp4 -vf "fps=18,scale=1600:-1" -c:v libwebp -quality 78 public/seq/frame_%04d.webp
ffmpeg -i daymont-assembly.mp4 -vf "fps=12,scale=900:-1"  -c:v libwebp -quality 72 public/seq-m/frame_%04d.webp   # mobile
```
~180 desktop frames × ~70 KB ≈ 12 MB → preload the first 20, lazy-load the rest; draw on a `<canvas>` indexed by the ScrollTrigger progress of `#armado`. Keep the procedural 3D version as the fallback for slow connections.
