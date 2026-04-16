# Design System: Performance Geometric

## 1. Overview & Creative North Star: "The Kinetic Monolith"
This design system is built for high-stakes performance. Our Creative North Star is **The Kinetic Monolith**. We reject the soft, bubbly aesthetic of consumer apps in favor of something that feels engineered, architectural, and unyielding. 

To achieve this, we break the "template" look through **Mathematical Brutalism**. We utilize a 0px radius across the board to create sharp, aggressive forms. We move away from standard grids by using intentional asymmetry—where content is anchored to hard geometric axes—and we use high-contrast typography to create an editorial feel that communicates speed and precision. This isn't just an interface; it's a cockpit for athletes.

---

## 2. Colors & Tonal Depth
Our palette is rooted in a deep, atmospheric ink (`#121127`) punctuated by a high-velocity crimson (`#E50501`).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. 
*   A `surface-container-low` section should sit directly against a `background` or `surface` area. 
*   Contrast, not lines, defines the architecture.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of obsidian.
*   **Base:** `surface` (#121127) for the main canvas.
*   **Secondary:** `surface-container` (#1e1d34) for primary content modules.
*   **Highlight:** `surface-container-highest` (#33324a) for interactive elements or focused data.
*   **Nesting:** When placing a card within a section, use a "descending depth" approach. Place a `surface-container-lowest` (#0c0b21) card onto a `surface-container-low` (#1a1930) section to create a recessed, "machined" look.

### The "Glass & Gradient" Rule
To prevent the UI from feeling static, use **Glassmorphism** for floating headers or persistent navigation. Use `surface` colors at 70% opacity with a `20px` backdrop blur. 
*   **Signature Texture:** Main CTAs must use a linear gradient (45°) from `primary_container` (#E50501) to `on_primary_fixed_variant` (#930200). This adds a subtle "engine heat" glow to the most important actions.

---

## 3. Typography: The Editorial Engine
We use two distinct voices: **Space Grotesk** for structural impact and **Inter** for data clarity.

*   **Display & Headlines (Space Grotesk):** These are your "billboard" moments. Use `display-lg` (3.5rem) with tight letter spacing (-2%) to scream performance. Headlines should be uppercase when used for navigation categories to emphasize the "Monolith" vibe.
*   **Body & Labels (Inter):** Inter provides the technical precision required for fitness metrics. Use `body-md` (0.875rem) for all secondary data to maintain high legibility against dark surfaces.
*   **The Contrast Play:** Pair a `display-sm` headline in `primary` (#ffb4a8) with a `label-sm` in `secondary` (#c5c3ea). The extreme scale difference creates a sophisticated, premium hierarchy.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are largely banned. We convey hierarchy through **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface-container-high` card on a `surface-dim` background creates a natural lift.
*   **Ambient Shadows:** If a floating element (like a FAB or Tooltip) requires separation, use a shadow with a `40px` blur, `0%` spread, and `8%` opacity, tinted with `#0D0C22`. It should feel like a soft occlusion, not a dark smudge.
*   **The "Ghost Border" Fallback:** If a layout feels muddy, use a "Ghost Border": the `outline-variant` token (#5f3f3a) at **15% opacity**. This provides a surgical edge without adding visual weight.
*   **0px Radius:** Every container, button, and input must have a `0px` border radius. This "Sharp Edge" philosophy is non-negotiable; it reinforces the brand’s focus on "Precision."

---

## 5. Components

### Buttons: The Power Cells
*   **Primary:** Sharp 0px edges. Gradient fill (Crimson to Dark Red). Text: `title-sm` (Inter), Bold, Uppercase.
*   **Secondary:** `surface-container-highest` fill with a `Ghost Border`. 
*   **Tertiary:** No fill. `primary` text with a bottom-aligned 2px bar that only spans the width of the text.

### Data Visualization: The Metric Grid
*   **Trend Lines:** Use `primary` (#ffb4a8) for active data, with a gradient fill below the line transitioning to 0% opacity.
*   **Gauges:** Angular, not circular. Use 45-degree clipped corners for progress bars to match the geometric theme.

### Cards & Lists: The Modular Stack
*   **Cards:** No dividers. Use vertical white space (32px or 48px) to separate content groups. 
*   **Interactive States:** On hover or tap, shift the background color from `surface-container` to `surface-bright`.

### Inputs: The Cockpit Entry
*   **Fields:** Bottom-border only (2px `outline`). When focused, the border transitions to `primary` (#ffb4a8) and a subtle `primary_container` glow appears behind the input area.

---

## 6. Do's and Don'ts

### Do:
*   **Do** embrace asymmetry. Align text to the left and metrics to the far right with significant "dead space" between them.
*   **Do** use the `primary_container` (#E50501) sparingly. It is a "warning" or "action" color—if everything is red, nothing is fast.
*   **Do** use large, high-quality photography of athletes with high-contrast shadows to complement the dark UI.

### Don't:
*   **Don't** use 1px solid borders to separate list items. Use 16px of `surface-container-low` space instead.
*   **Don't** use any rounded corners. Even a 2px radius breaks the "Kinetic Monolith" aesthetic.
*   **Don't** use standard "Grey" for text. Use `secondary` (#c5c3ea) or `on_surface_variant` (#e9bcb5) to maintain the sophisticated tonal depth of the palette.