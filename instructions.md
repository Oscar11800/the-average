# THE AVERAGE
## A cinematic interactive demonstration of Quetelet's 1844 Scottish soldier dataset

---

## 0. One-paragraph elevator pitch

*The Average* is a single-page, scroll-then-scrub web experience that recreates Adolphe Quetelet's famous thought experiment — that a population of 5,738 Scottish soldiers is, in effect, 5,738 imperfect "copies" of one ideal Scotsman — using the actual 1817 chest-circumference data Quetelet cited in his 1846 *Lettres*. The user scrubs a cinematic timeline; Vitruvian-style soldier silhouettes are drawn onto aged vellum one by one, scale and stack as the population grows, and eventually dissolve into a histogram whose shape is overlaid with the mathematically exact normal curve fit to the real data. No explicit philosophical commentary is delivered; the visual itself stages the argument from Theodore Porter's *The Rise of Statistical Thinking* (pp. 100–109) about whether the spread is "error around an ideal" or "the reality of variation." The viewer decides.

---

## 1. Intellectual foundation (why this project exists)

This piece is the visual performance of a specific argument from Theodore M. Porter, *The Rise of Statistical Thinking, 1820–1900* (Princeton UP, 1986), Chapter 4, "The Errors of Art and Nature," pp. 100–109.

**The core argument being staged:** Quetelet's 1844/1846 discovery that human chest measurements fit the astronomical error curve was interpreted by him as proof that nature was *trying* to produce one ideal type (*l'homme moyen* / the *homme type*) and that real individuals were merely flawed "copies" of that archetype, scattered around it by accidental perturbing causes in the same way repeated measurements of a single star scatter around its true position. He even compared the 5,738 soldiers to a thousand sculptors' copies of the ancient Gladiator statue. His successors (Galton, Maxwell) would later invert this interpretation: the spread *is* the phenomenon, not error around a true value.

**What the artifact does with this:** It performs Quetelet's thought experiment *exactly as he framed it* — soldiers as copies of an ideal — and lets the viewer watch the ideal emerge from the data. By refusing to commentate, the piece leaves the viewer to feel the tension themselves: is the mean real, or is it just what the data happens to pile around?

---

## 2. The Dataset

The chest circumference data for 5,738 Scottish militiamen was originally published in the *Edinburgh Medical and Surgical Journal*, vol. 13 (1817), p. 260, in an article by a correspondent known only as "A. M." Quetelet reproduced and analyzed it in his 1846 *Lettres à S.A.R. le Duc Régnant de Saxe-Coburg et Gotha*. The table below is the version Quetelet used and is the one Porter refers to on p. 107.

**Fetch this dataset at runtime from the canonical Rdatasets mirror.** This is a well-known historical dataset maintained in R's `HistData` package under the name `Chest`. Fetch it from:

```
https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/master/csv/HistData/Chest.csv
```

The CSV has two columns: `chest` (circumference in inches, integers 33–48) and `count` (number of soldiers at that measurement). Parse it at load time and normalize it into the shape:

```typescript
// lib/data.ts
export interface ChestBin {
  chest: number;
  count: number;
}

// Fetched and parsed at runtime from Rdatasets/HistData/Chest.csv
// Source: Edinburgh Medical and Surgical Journal, vol. 13 (1817), p. 260
// As reproduced in Quetelet, Lettres sur la théorie des probabilités (Brussels, 1846)
export async function fetchSoldierData(): Promise<ChestBin[]> { ... }
```

Fetch client-side on app mount inside a `useEffect` in `TheAverage.tsx`. Since GitHub Pages serves a fully static bundle with no build-time server, there is no SSR or build-time data fetching available — the fetch must happen in the browser. The Rdatasets raw URL supports CORS so this works without a proxy. Show a minimal loading state (e.g., a faint *"loading data…"* in the caption area) while the fetch is in flight; it resolves in under a second on a normal connection.

Derived constants to compute once from the fetched data and reuse:
- `TOTAL` — sum of all counts (should equal 5,738)
- `MEAN` — compute from data (should be ≈ 39.83 inches)
- `STD_DEV` — compute from data using population formula (should be ≈ 2.05 inches)
- `MIN_CHEST`, `MAX_CHEST` — min/max chest values in the data

The theoretical normal curve overlay must be `N(MEAN, STD_DEV)` computed from the fetched data — not hand-tuned. If the fetch fails, surface a clear error state rather than falling back to any hardcoded values.

---

## 3. The core experience (what happens on screen)

The entire experience lives on a **single page**. There is no navigation, no routes, no login. One canvas, one scrub bar, one journey.

### 3.1 Opening state (scrub position = 0 soldiers)

- Vellum-textured background fills the viewport.
- Centered: a single Vitruvian-style line-drawing figure of a soldier, rendered in sepia ink. This figure is labeled with a faint annotation: *"l'homme type."*
- Below the figure: a period-styled caption in serif italic: *"Of the Scottish soldier, 1817."*
- Below the caption: the scrub bar, with a playhead at position 0.
- Below the scrub bar: two small counters in monospace: `n = 0 / 5,738` and `μ = — inches`.

No histogram axes are visible yet. Just the ideal man alone on the vellum.

### 3.2 The scrub journey (0 → 5,738)

As the user drags the playhead to the right, soldiers are "generated" and drawn onto the vellum. Each soldier's chest circumference is a sample drawn (without replacement, pre-shuffled at load time) from the 1817 frequency table.

The rendering strategy **morphs through three phases** based on n, and these transitions are the core visual story:

#### Phase 1: Individuals (n = 1 to ~50)
- Each soldier appears as a full Vitruvian-style line-drawing figure.
- Figures are positioned along a soft grid, scaled to be clearly visible.
- Each figure's chest region is subtly wider or narrower in proportion to its sampled chest circumference — not wildly cartoonish, but perceptible. A 36" soldier is visibly slighter than a 42" one.
- As new soldiers appear, they fade in with a subtle ink-bleed animation (0.3s ease-out).
- The original "ideal" figure remains centered and slightly dimmer, like a ghost.

#### Phase 2: Shrinking crowd (n ≈ 50 to ~800)
- As the population grows past ~50, all figures begin to shrink smoothly.
- Figures reorganize into columns aligned to chest-size bins (33" on left, 48" on right).
- An x-axis begins to fade in beneath them, labeled in inches.
- The taller the column grows, the smaller each figure becomes — the figures are trying to fit vertically within the column's allotted space.
- Ideal figure at center starts to fade further.

#### Phase 3: Histogram emergence (n ≈ 800 to 5,738)
- Figures shrink to become indistinguishable marks, then merge into solid histogram bars.
- Each bar's height tracks the running count in its chest-size bin, perfectly in sync with the data.
- A y-axis fades in (count).
- The ideal figure at center fades out completely.
- At n ≈ 2000 (arbitrary but "when the shape is clear"), the theoretical normal curve overlay begins to fade in, drawn as a smooth sepia ink line on top of the histogram, computed from `N(MEAN, STD_DEV)` of the 1817 data.
- By n = 5,738, the histogram exactly matches the 1817 table and the normal curve sits atop it.

### 3.3 Final state (scrub position = 5,738)

- The full histogram is rendered in sepia bars.
- The theoretical normal curve is drawn as an elegant ink stroke on top.
- Counters read: `n = 5,738 / 5,738`, `μ = 39.83 inches`, and a new one appears: `σ = 2.05 inches`.
- The original ideal figure is gone.
- In the bottom margin, a single citation appears in small italic serif: *"After A. Quetelet, Lettres sur la théorie des probabilités (Brussels, 1846), pp. 400–403. Data: Edinburgh Medical & Surgical Journal, 13 (1817), 260."*

The viewer can scrub back and forth freely. The experience is fully reversible.

### 3.4 Playback affordances

- **Scrub bar:** primary control. Drag the playhead anywhere along its length.
- **Play/pause button:** auto-plays from current position at a default speed (takes ~45 seconds end-to-end at 1x).
- **Speed control:** a small set of buttons or a secondary slider: 0.5x, 1x, 2x, 5x.
- **Keyboard:** spacebar toggles play/pause; left/right arrows scrub by ±100 soldiers.
- Scrubbing never skips ahead in the data — the soldier sequence is pre-determined at load, so scrubbing back and forth shows/hides the same soldiers in the same positions. This determinism is important: if a teacher pauses at n=500 on Monday and again on Friday, they see the same 500 soldiers.

---

## 4. Visual design specification

### 4.1 Aesthetic north star
Leonardo da Vinci's *Vitruvian Man*, rendered on aged vellum. Think Renaissance anatomical manuscript. The entire composition should feel like a living page from a 15th-century codex that happens to be animated.

### 4.2 Color palette (exact values)
```
--vellum-base:     #F4E8D0   /* aged parchment background */
--vellum-shadow:   #E8D9B8   /* subtle vignette / texture shadows */
--ink-primary:     #3B2A1A   /* main sepia ink */
--ink-secondary:   #6B4E2E   /* lighter sepia for annotations */
--ink-faded:       #A08865   /* ghosted / dimmed elements */
--accent-red:      #8B2E1F   /* sparingly, for the normal curve overlay and key numerals */
```

Background must have a subtle vellum texture — either a noise layer, a subtle radial gradient for vignetting, or a tileable parchment SVG. Do not use a stock photograph of parchment. Keep it tasteful and performant.

### 4.3 Typography
- **Display / captions:** a serif with Renaissance character. Recommended: **EB Garamond** (Google Fonts) in italic for captions, roman for counters. Fallback: Cormorant Garamond.
- **Counters / data readouts:** a monospaced serif. Recommended: **JetBrains Mono** or **IBM Plex Mono** at small sizes for `n`, `μ`, `σ`.
- **Annotations on figures:** handwritten-feeling italic. Recommended: a subtle italic variant of the serif, not a script font (no Lucida Handwriting).

### 4.4 The soldier figure (SVG)
Create a single master SVG of a Vitruvian-style soldier figure — standing, front-facing, with arms slightly outstretched in a shortened Vitruvian pose. Rendered as fine sepia line-art, no fill. The figure's chest should have an SVG path whose width can be parametrically stretched via a `data-chest-inches` attribute that scales the torso's horizontal dimension by a small factor (e.g., ±6% across the 33"–48" range, so variation is visible but not grotesque).

Design guidance:
- Line weight: ~1px at base scale, scaling with viewport
- Style: faint circle and square behind figure (Vitruvian geometry), drawn even fainter
- No face details — leave it as a geometric abstraction
- Reuse a single `<symbol>` via `<use>` tags for performance

### 4.5 The normal curve
- Drawn as a single smooth SVG path using D3's `d3.line()` with `curveBasis` or `curveCatmullRom` interpolation
- Sample at 200 points across the x-range (32–49 inches) for smoothness
- Color: `--accent-red` at 0.8 opacity
- Stroke width: 2px
- Animate the curve in by drawing it left-to-right using `stroke-dasharray` / `stroke-dashoffset` over ~2 seconds when it first appears

### 4.6 Layout
- The visualization occupies a central vertical band, max-width ~900px, centered on the page.
- Generous vellum margins on all sides — do not fill the viewport edge-to-edge.
- The scrub bar sits below the visualization, styled as an ink-drawn rectangle with an ink-blot playhead.
- Counters sit just below the scrub bar.
- Small citation in the footer.
- Responsive: below 768px width, everything scales down proportionally. Touch-scrubbing on mobile must work.

---

## 5. Technical specification

### 5.1 Stack
- **Framework:** Vite 5+ with React 18+ (plain SPA — no SSR, no App Router)
- **Language:** TypeScript (strict mode)
- **Rendering:** React 18+ for UI, D3 v7+ for scales and math, SVG for all visual output
- **Animation:** Framer Motion for UI transitions; `requestAnimationFrame` + D3 for the scrub-driven soldier/histogram rendering
- **Styling:** Tailwind CSS v3 (via PostCSS) + a small CSS module for custom vellum texture
- **Fonts:** Google Fonts `<link>` in `index.html` for EB Garamond and JetBrains Mono (no `next/font`)
- **Deployment:** GitHub Pages via the `gh-pages` npm package; `npm run deploy` runs `vite build && gh-pages -d dist`

### 5.2 Project structure
```
the-average/
├── index.html              # Entry point; Google Fonts <link> tags here
├── src/
│   ├── main.tsx            # ReactDOM.createRoot, mounts <App />
│   ├── App.tsx             # Thin shell; renders <TheAverage />
│   ├── index.css           # Tailwind directives + vellum texture + color vars
│   ├── components/
│   │   ├── TheAverage.tsx  # Root component, orchestrates state + data fetch
│   │   ├── SoldierCanvas.tsx  # SVG canvas, renders soldiers + histogram + curve
│   │   ├── SoldierFigure.tsx  # Reusable Vitruvian soldier SVG
│   │   ├── ScrubBar.tsx    # The timeline control
│   │   ├── Counters.tsx    # n, μ, σ readouts
│   │   └── Citation.tsx    # Bottom citation
│   └── lib/
│       ├── data.ts         # fetchSoldierData() + derived constants
│       ├── sampling.ts     # Pre-shuffled soldier sequence generator
│       ├── stats.ts        # mean, stdDev, normalPDF helpers
│       └── phases.ts       # Phase boundary constants + phase-detection logic
├── public/
│   └── vellum-texture.svg  # Tileable background (optional, can be CSS-only)
├── vite.config.ts          # base: '/the-average/' for GitHub Pages sub-path
└── package.json            # deploy script: "gh-pages -d dist"
```

**Critical GitHub Pages config:** set `base: '/the-average/'` in `vite.config.ts` so asset paths resolve correctly when served from `https://<username>.github.io/the-average/`. If deploying to a custom domain or a root `github.io` site, set `base: '/'` instead.

### 5.3 Data flow

**On page load (fully client-side — no SSR):**
1. `useEffect` in `TheAverage.tsx` fires once on mount; calls `fetchSoldierData()` which fetches and parses the Rdatasets CSV (see Section 2). While in-flight, render a minimal loading state. On error, surface a clear message.
2. Once resolved, compute `MEAN`, `STD_DEV`, `TOTAL` from the fetched data table.
3. Generate a deterministic pre-shuffled array of 5,738 chest values. Use a seeded PRNG (e.g., [seedrandom](https://www.npmjs.com/package/seedrandom) with seed `"quetelet-1846"`) so the sequence is the same for every visitor. The array is constructed by:
   - Expanding the frequency table into a flat array of 5,738 chest values (3 copies of 33, 18 copies of 34, ...)
   - Shuffling with the seeded PRNG (Fisher-Yates)
4. Store this as a `useMemo`'d constant in `TheAverage.tsx`

**During scrubbing:**
1. `scrubPosition` (0 to 5,738) is the single source of truth, held in state
2. The visible soldier set is `soldiers.slice(0, scrubPosition)`
3. Derived values recomputed on each scrub change:
   - Running mean of visible chest values
   - Histogram bin counts (a simple tally over the slice)
   - Current phase (PHASE_1 if n ≤ 50, PHASE_2 if n ≤ 800, PHASE_3 otherwise)

**For performance:**
- At n > 800, stop rendering individual `<use>` figures. Render only the histogram bars.
- Between n = 50 and n = 800, render individual figures but with a simplified single-path SVG and reduced-detail Vitruvian geometry.
- Use `d3-scale` for all coordinate math, cached via `useMemo`.

### 5.4 Phase transition logic

```typescript
// lib/phases.ts
export const PHASE_BOUNDARIES = {
  INDIVIDUALS_END: 50,
  SHRINKING_END: 800,
  CURVE_APPEARS: 2000,
};

export function getPhase(n: number): 'INDIVIDUALS' | 'SHRINKING' | 'HISTOGRAM' {
  if (n <= PHASE_BOUNDARIES.INDIVIDUALS_END) return 'INDIVIDUALS';
  if (n <= PHASE_BOUNDARIES.SHRINKING_END) return 'SHRINKING';
  return 'HISTOGRAM';
}

// Smooth blending factor between phases (for opacity crossfades)
export function getPhaseBlend(n: number): {
  individualsOpacity: number;
  histogramOpacity: number;
  curveOpacity: number;
} {
  // ... smooth interpolation between phases
}
```

Use smooth interpolation (not hard cutoffs) for opacities between phases so the morph feels continuous.

### 5.5 The scrub bar

- Built from scratch with a `<div>` track and an `<div>` playhead, styled to look ink-drawn.
- Handles `pointerdown` / `pointermove` / `pointerup` for both mouse and touch.
- Converts x-pixel position to `scrubPosition` (0 to 5,738).
- Updates state via `setScrubPosition` on every pointer move while dragging.
- Also supports play/pause via `requestAnimationFrame`: when playing, advance `scrubPosition` by `(5738 / (45 * 60)) * speedMultiplier` per frame at 60fps (so ~45s at 1x).

### 5.6 Stats helpers

```typescript
// lib/stats.ts
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[], mu: number): number {
  if (values.length === 0) return 0;
  const variance = values.reduce((acc, v) => acc + (v - mu) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function normalPDF(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}
```

### 5.7 Accessibility notes
- Scrub bar has `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label="Population size"`.
- Keyboard support on the scrub bar: ←/→ move by 100, Shift+←/→ move by 1000, Home/End jump to 0/5738.
- Respect `prefers-reduced-motion`: if set, disable the ink-bleed fade-ins (snap instead) and shorten curve-draw animation.
- Provide a small "Skip animation" link that jumps to n=5738 for users who prefer to see the end state.

### 5.8 Performance targets
- 60fps scrubbing on a mid-range laptop
- Initial bundle under 200KB (excluding fonts)
- Lighthouse performance score ≥ 90

---

## 6. Build order (for the week)

**Day 1 — Foundation**
- `npm create vite@latest the-average -- --template react-ts`; install dependencies (d3, framer-motion, seedrandom, tailwind, gh-pages)
- Configure Tailwind (PostCSS), set `base: '/the-average/'` in `vite.config.ts`, add Google Fonts `<link>` to `index.html`
- Set up color CSS variables, vellum background in `index.css`
- Create `src/lib/data.ts` with `fetchSoldierData()`; write a quick smoke-test in the browser console confirming MEAN ≈ 39.83, STD_DEV ≈ 2.05
- Write `src/lib/stats.ts` and `src/lib/sampling.ts` with seeded shuffle; verify deterministic output
- Add `"deploy": "vite build && gh-pages -d dist"` to `package.json` scripts; do a test deploy to confirm GitHub Pages serves the placeholder page correctly

**Day 2 — The soldier figure**
- Design `SoldierFigure.tsx` as a parameterized SVG
- Test rendering at various chest sizes to verify visual variation is tasteful (±6%)
- Build a static test page showing 20 soldiers side by side at different chest sizes

**Day 3 — The canvas and phase 1**
- Build `SoldierCanvas.tsx` with SVG viewBox and D3 scales
- Implement Phase 1 (individuals): render up to 50 soldiers with ink-bleed fade-in
- Wire up a temporary slider (not the final scrub bar yet) to drive n
- Verify positioning, scaling, and fade animations feel right

**Day 4 — Phases 2 and 3**
- Implement Phase 2: soldiers reorganize into columns, shrink with n
- Implement Phase 3: figures merge into histogram bars; bars grow with running bin counts
- Implement the normal curve overlay with stroke-dasharray draw-in animation
- Tune phase boundary smoothness (opacity crossfades)

**Day 5 — The scrub bar and playback**
- Build `ScrubBar.tsx` with pointer handlers
- Implement play/pause via requestAnimationFrame
- Add speed controls (0.5x / 1x / 2x / 5x)
- Add keyboard support
- Wire everything together

**Day 6 — Polish**
- Build `Counters.tsx` with elegant monospace readouts
- Build `Citation.tsx` in the footer
- Add subtle ghost of ideal figure in Phase 1
- Refine ink-bleed animation, vellum texture, margins, typography kerning
- Test on mobile / tablet / desktop; fix responsive breakpoints
- Accessibility pass (keyboard, aria labels, reduced motion)

**Day 7 — Deploy and share**
- Run `npm run deploy` to build and push `dist/` to the `gh-pages` branch; confirm live at `https://<username>.github.io/the-average/`
- Write a 200-word README explaining the piece and linking to Porter
- Share with classmates

---

## 7. What success looks like

A viewer who has read Porter arrives at the page. They see a single ghostly figure labeled *l'homme type* on vellum. They drag the scrubber. Soldiers begin to appear — each one slightly different, each one a Vitruvian echo of the ideal. The figures multiply, shrink, reorganize. The histogram emerges without announcement. The red normal curve glides across the top, matching the data. The ideal figure fades away.

The viewer has just seen Quetelet's claim — that 5,738 Scottish soldiers are 5,738 flawed copies of one ideal man — performed before them, using his actual data. No text has told them what to feel. But they will feel the tension that Porter describes: is the ideal real, or did it only ever exist as the center of a distribution?

That question is the whole point. The artifact asks it by not asking it.

---

## 8. Appendix: one-shot prompt for Claude

> I'm building a Vite + React + D3 interactive data visualization called "The Average," deployed to GitHub Pages. Read instructions.md in this folder and implement the full project end-to-end. Fetch the 1817 Scottish soldier chest circumference data client-side on mount from the Rdatasets CSV as described in Section 2 — do not hardcode the values. Follow the visual specification in Section 4 (Vitruvian Man on vellum, sepia ink, EB Garamond + JetBrains Mono). Follow the technical specification in Section 5 (Vite + React SPA, TypeScript strict, Framer Motion, seeded deterministic shuffle, `base: '/the-average/'` in vite.config.ts). Build in the order described in Section 6, but commit working code at every step rather than trying to build everything at once. The single source of truth for state is `scrubPosition` (0 to 5,738), and scrubbing must be deterministic, reversible, and 60fps. No explicit philosophical text should be added — the piece is pure visualization over real historical data, per Section 1. When in doubt, favor restraint: this is a Renaissance manuscript, not a dashboard.
