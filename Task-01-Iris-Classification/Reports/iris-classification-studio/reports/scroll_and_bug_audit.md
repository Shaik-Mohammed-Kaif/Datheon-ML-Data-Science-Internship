# Scroll Performance, UI Bug & Responsiveness Audit Report

**Project:** Iris Classification — From Exploratory Data Analysis to Machine Learning  
**Presenter:** S. Mohammed Kaif (Data Science | Machine Learning | Data Analytics)  
**Scope:** Full 20-slide React + TypeScript + Vite + Tailwind CSS + Plotly.js application, modals, navigation chrome, print stylesheets, and standalone HTML export.

---

## 1. Executive Summary

A codebase-wide scroll performance, responsiveness, and UI correctness audit was executed across all 20 slides, modal dialogs, interactive visualizations, navigation controls, print media rules, and standalone HTML exports. All confirmed scroll traps, horizontal overflow regressions, GPU compositor bottlenecks, unmemoized Plotly re-renders, scroll-reset race conditions, and print/modal UX bugs were resolved without introducing global `overflow-x: hidden` workarounds or extra dependencies.

Post-fix automated verification in headless Chromium (`Playwright`) across 7 viewports (`1920×1080`, `1440×900`, `1280×720`, `1024×768`, `768×1024`, `390×844`, `360×800`) confirmed **0 horizontal overflows**, **0 nested scroll traps**, **0 broken Plotly canvases**, **0 console/page/network errors**, verified interactive widgets, verified `@media print` switching, and verified standalone HTML rendering.

---

## 2. Confirmed Bugs & Root Causes

| # | Severity | Symptom / Affected Area | Root Cause |
|---|----------|-------------------------|------------|
| 1 | High | **Wheel scrolling felt sluggish / conflicting & janky on multi-card slides** (`src/index.css`) | Global `html { scroll-behavior: smooth; }` fought native wheel/trackpad momentum scrolling, while multiple `.glass-panel` and `.glass-panel-dark` cards per slide applied `backdrop-filter: blur(14px/16px)` layers that forced heavy GPU compositing repaints on every scroll frame. |
| 2 | High | **Unintended vertical scrollbars (`7px` overflow) on Slides 01 & 20 across desktop/tablet (`1920×1080`, `1440×900`, `1280×720`, `1024×768`, `768×1024`)** (`SlidesPart1.tsx`, `SlidesPart4.tsx`) | `min-h-[calc(100vh-5.75rem)]` (92px deduction) exceeded available viewport height after adding the 58px sticky header plus `<main>` top/bottom padding (`32px`, `90px`–`99px` total), leaving Slides 01 and 20 `7px` taller than `innerHeight`. |
| 3 | High | **Nested vertical scroll traps on Slides 03 & 16** (`SlidesPart1.tsx`, `SlidesPart3.tsx`) | `Slide03Question` used `h-full overflow-y-auto` and `Slide16ConfusionMatrix` capped its error sample table with `max-h-[250px] overflow-y-auto`, swallowing mouse-wheel/touch scroll events inside inner containers. |
| 4 | High | **Horizontal overflow on mobile (`390×844` and `360×800`) on Slides 05, 07, and 15** (`SlidesPart2.tsx`, `SlidesPart3.tsx`) | Grid items containing tables and controls lacked `min-w-0` (`minmax(0, 1fr)` track sizing), and wide tables in Slides 07, 11, 12, and 15 lacked `overflow-x-auto` containers. Slide 05 expanded to `414px` width, Slide 07 to `361px`, and Slide 15 to `368px`. |
| 5 | Medium | **Plotly resize thrashing, wheel hijacking & unnecessary full `Plotly.react` redraws** (`PlotlyChart.tsx`, `SlidesPart2.tsx`, `SlidesPart3.tsx`, `SlidesPart4.tsx`) | `PlotlyChart` ran duplicate `Plotly.Plots.resize()` after `Plotly.react`, stacked Plotly's built-in `responsive: true` handler alongside a `ResizeObserver` + non-passive `window.resize` listener without width/height diff guards, lacked `Plotly.purge()` cleanup on unmount, and created unmemoized layout objects on interactive slides (e.g., Slides 13 and 16). |
| 6 | Medium | **Scroll reset side effects, modal scroll bleed, and keyboard conflicts** (`App.tsx`, `OverviewModal.tsx`, `PrintReportModal.tsx`) | `window.scrollTo` was triggered synchronously inside `setCurrentSlide` state updaters; `OverviewModal` and `PrintReportModal` did not lock `document.body.style.overflow` or isolate overscroll (`overscroll-contain`), and arrow shortcuts remained active while modals were open. |
| 7 | Medium | **Print dialog UX & fullscreen scroll scope** (`App.tsx`, `index.css`) | `handleOpenPrint` called `window.print()` synchronously before `PrintReportModal` could render its preview/instructions; CSS lacked explicit `@page` print rules; fullscreen targeted a wrapper `<div>` rather than `document.documentElement`. |
| 8 | Low | **Presentation animation layout jitter & excessive transition scope** (`index.css`, `PresentationChrome.tsx`, `SlidesPart1.tsx`) | `slideReveal` translated `translateY(10px)` during slide entry; arrows and buttons used `transition-all` instead of scoped `transition-[colors,transform]` / `transition-colors`; `BotanicalImage` omitted `decoding="async"`. |
| 9 | Low | **Standalone HTML export parity & defensive guards** (`exportStandaloneHtml.ts`, `README.md`) | Standalone export omitted the full 20-slide outline, section jump selector, `overflow-x-auto` table wrapper, `scrollZoom: false` config, OLS `den > 0` division guard, and explicit `@page` print rules; `README.md` referenced an outdated `bottom dock` control label. |

---

## 3. Files Modified & Fixes Implemented

- **`src/index.css`**: Removed `html { scroll-behavior: smooth; }`; replaced costly `backdrop-filter` blur passes on `.glass-panel` / `.glass-panel-dark` with crisp solid-translucent fills; changed `slideReveal` keyframe to an opacity-only 180ms transition; added `@page { size: A4; margin: 14mm; }` to `@media print`.
- **`src/components/PlotlyChart.tsx`**: Removed duplicate `Plotly.Plots.resize()` call; disabled Plotly's redundant `responsive: true` loop and replaced it with a dimension-diffed (`> 1px`) `ResizeObserver` scheduled via canceled `requestAnimationFrame`; added `{ passive: true }` on `window.resize`; set `scrollZoom: false` in Plotly config; applied `touchAction: 'pan-y'`; added `min-w-0` wrapper sizing; added `Plotly.purge(el)` unmount cleanup.
- **`src/components/BotanicalImage.tsx`**: Added `decoding="async"` on `<img>` elements.
- **`src/components/PresentationChrome.tsx`**: Replaced `transition-all` with `transition-[colors,transform] duration-150`; removed blur from floating mobile pill bar and tightened spacing (`bottom-2.5`).
- **`src/components/OverviewModal.tsx` & `src/components/PrintReportModal.tsx`**: Added `document.body.style.overflow = 'hidden'` lock/restoration in `useEffect` cleanup; added `overscroll-contain`, `max-h-[88dvh]`, `min-w-0`, and backdrop click-to-close; added `break-inside-avoid` to print report cards.
- **`src/components/SlidesPart1.tsx`**: Replaced `Slide01Cover` height with `md:min-h-[calc(100dvh-6.25rem)]`; removed `h-full overflow-y-auto` trap from `Slide03Question`; added `min-w-0` to grid containers and scoped CSS transitions to `transition-colors`.
- **`src/components/SlidesPart2.tsx`**: Added `min-w-0` across Slide 05/06/07/09 grid tracks; wrapped Slide 07 schema table in `overflow-x-auto` and refined vertical padding; memoized `donutLayout`, `scatterLayout`, and `heatmapLayout` (`useMemo<Partial<Plotly.Layout>>`).
- **`src/components/SlidesPart3.tsx`**: Added `min-w-0` across Slide 11–16 grid columns; wrapped tables on Slides 11, 12, and 15 in `overflow-x-auto`; tightened Slide 13 decision-tree mobile indentation (`ml-2.5 pl-2.5 sm:ml-5 sm:pl-4`); removed `max-h-[250px] overflow-y-auto` nested scroll container on Slide 16; memoized `boundaryLayout`, `importanceLayout`, `comparisonLayout`, `perClassLayout`, and `cmLayout`.
- **`src/components/SlidesPart4.tsx`**: Memoized `alignmentLayout`, refined Slide 17 vertical spacing, added `min-w-0` to columns, and updated `Slide20ThankYou` to `md:min-h-[calc(100dvh-6.25rem)]` with `S. Mohammed Kaif` attribution.
- **`src/App.tsx`**: Moved slide-change scroll reset into `useEffect([currentSlide])` (`if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'auto' })`); blocked slide-navigation keyboard shortcuts while modals are open; updated `handleOpenPrint` to open `PrintReportModal` cleanly; switched fullscreen target to `document.documentElement.requestFullscreen()` so fullscreen scrolling stays consistent.
- **`src/utils/exportStandaloneHtml.ts`**: Embedded all 20 slide outlines (`SLIDES_META`), added sticky section jump selector, `overflow-x-auto` table wrapper, `scrollZoom:false`, `S. Mohammed Kaif` presenter attribution, zero-variance OLS guard (`den > 0`), and `@page` print styling.
- **`README.md`**: Corrected shortcut hint wording from `bottom dock` to `top bar`.

---

## 4. Verification Results

### 4.1 Multi-Viewport Playwright Audit (All 20 Slides)

| Viewport | Scope Checked | Horizontal Overflows | Desktop/Landscape Vertical Overflow | Nested Scroll Traps | Broken Plots | Mobile Sticky Chrome Ratio | Result |
|---|---|---|---|---|---|---|---|
| `1920×1080` (Desktop) | Slides 01–20 | 0 | 0 | 0 | 0 | N/A | PASS |
| `1440×900` (Laptop) | Slides 01–20 | 0 | 0 | 0 | 0 | N/A | PASS |
| `1280×720` (Compact Laptop) | Slides 01–20 | 0 | 0 | 0 | 0 | N/A | PASS |
| `1024×768` (Landscape Tablet) | Slides 01–20 | 0 | 0 | 0 | 0 | N/A | PASS |
| `768×1024` (Portrait Tablet) | Slides 01–20 | 0 | Allowed (multi-card stack) | 0 | 0 | 5.8% max | PASS |
| `390×844` (Mobile) | Slides 01–20 | 0 | Allowed (scrollable column) | 0 | 0 | 12.9% max (`≤15%`) | PASS |
| `360×800` (Small Mobile) | Slides 01–20 | 0 | Allowed (scrollable column) | 0 | 0 | 13.6% max (`≤15%`) | PASS |

- **Console / Page / Failed Network Errors:** `0` console errors, `0` uncaught page errors, `0` failed requests.

### 4.2 Interactive, Scroll, Modal & Export QA (Headless Chromium)

- **Wheel Scroll & Reset (`390×844` Slide 06 → Slide 07):** Mouse wheel scrolled smoothly (`scrollY: 450`), advancing slide reset `window.scrollY === 0`.
- **Rapid Navigation & Controls:** `ArrowRight × 8` + `ArrowLeft × 8`, side arrow clicks, `Home`/`End`, and Slide 20 presenter attribution (`S. Mohammed Kaif`, zero personal email) verified cleanly.
- **Interactive Analytics Slides:** Verified `Slide02Task` Virginica preset, `Slide05Dataset` search filter (`setosa` → 50 rows), `Slide08Exploratory` Violin mode & clean remount after Slide 09 revisit (`1200×310`), `Slide09Relationships` axis change & dynamic viewport resize (`768×1024` → `580×285`, `1280×720` → `602×285`), `Slide13DecisionTree` node inspection (`Terminal Leaf → Predicts Iris-setosa`), `Slide15EvaluationMetrics` classifier dropdown, and `Slide16ConfusionMatrix` error inspection (`#107` with `0` nested scroll containers).
- **Modals (`OverviewModal`, `PrintReportModal`):** Confirmed `document.body.style.overflow === 'hidden'` when open, background keyboard slide navigation blocked while `OverviewModal` open, clean restoration (`overflow === ''`) on close/jump, and `page.emulateMedia({ media: 'print' })` toggling `.print-only-deck` (`display: block`) and `.screen-only-slide` / `header.no-print` (`display: none`).
- **Standalone HTML Export (`Save HTML`):** Verified downloaded `iris-classification-presentation.html` (68,147 bytes) renders 20 outline cards, 5 model benchmark rows, `scrollZoom:false`, `@page` print CSS, `S. Mohammed Kaif` credit, and `0px` horizontal overflow at `1440×900` and `390×844`.

### 4.3 Untested / Environment-Limited Items

- Native OS browser Print-to-PDF dialog output and physical iOS/Android trackpad/touch inertial feel cannot be directly exercised inside headless Linux Chromium.
- `fullscreenchange` scroll ergonomics were verified by targeting `document.documentElement.requestFullscreen()`, while OS-level browser fullscreen chrome behavior in external framed tabs depends on browser host iframe permissions (`allowfullscreen`).

### 4.4 TypeScript & Production Build Status

- `npx tsc --noEmit` (`lint_applet`): **0 errors**.
- `npm run build` (`compile_applet`): **Succeeded cleanly**.
