# LaunchPad Color & UX Reference

> Insights from [Figma's 100 Color Combinations](https://www.figma.com/resource-library/color-combinations/) applied to LaunchPad's design system.

---

## Why It Feels Payroll / CRM (Design Diagnosis)

**TL;DR**: Teal + bordered stat boxes + status badges + pipeline view + uppercase labels = classic B2B SaaS / project management aesthetic. The intent is warm & playful, but the patterns read enterprise.

### 1. **Teal as primary accent**

Teal is the default for CRMs, project tools, and enterprise dashboards (Salesforce, HubSpot, Monday, Asana, Notion…). It signals "professional," "trustworthy," and "corporate" more than "playful" or "personal."

**Shift options:**

- **Golden / amber** (Honeycomb, Golden Hour) — warmth, achievement, optimism
- **Coral-forward** (Fresh Peach, Summer Breeze) — friendly, energetic
- **Soft purple** (Lavender Fields, Lotus Garden) — creativity, dreaming
- **Terracotta / rust** (Desert Mirage, Spiced Chai) — earthy, grounded, human

### 2. **Stat boxes = dashboard KPI**

StatsRow (Sparks / Active / Shipped) and Progress hero stats use:

- Bordered boxes, numbers on top, small uppercase labels
- Layout that matches CRM KPIs and reporting screens

**Shift options:**

- Softer presentation: subtle backgrounds, less boxiness
- Inline / contextual: "3 shipped" near content instead of a dashboard row
- Celebratory framing: big number + playful label ("3 shipped!" not "Shipped: 3")

### 3. **Cards = database rows**

IdeaCard uses:

- White surface, left status bar, expand/collapse chevron
- Status badge + track badge + date in a meta row
- "Remove" and "Ask Bob" as standard actions

Reads like Jira/Trello/Linear — functional and clear, but transactional.

**Shift options:**

- Softer shapes: stronger radius, no hard left bar
- Note-like feel: handwritten/messy layout, looser alignment
- Warmer surfaces: slight tint instead of pure white

### 4. **Pipeline view**

Progress screen has:

- "Pipeline" section with segmented bars per track
- Legend with colored dots and counts
- Directly evokes Kanban / Jira pipeline / sales funnel

**Shift options:**

- Rename: "Your mix" or "Where things are" instead of "Pipeline"
- Softer visualization: curved, organic bars or shapes instead of segmented
- Hide by default: show only on demand or after a threshold

### 5. **Typography & labels**

- **"LAUNCHPAD"** — uppercase, letter-spacing 3 = corporate logotype
- **Section labels** — "TRACK", "Pipeline", "Milestones" — form/CRM style
- **Mono/semiBold** for titles — technical and clean, less character

**Shift options:**

- "LaunchPad" in title case or mixed case
- Friendlier labels: "What kind?" instead of "TRACK", "Journey" instead of "Pipeline"
- Slightly more display personality in headings

### 6. **Tab bar = segmented control**

Four tabs in a bordered, pill-shaped container with icon + label + description. Feels like app sections in an HIG-style way — clear but generic.

**Shift options:**

- Softer container: no border or very light
- Fewer descriptors: icon + label only
- Warmer active state: amber/coral tint instead of teal

### 7. **Color + pattern combo**

| Element      | Current                            | Reads as    |
| ------------ | ---------------------------------- | ----------- |
| Primary CTA  | Teal                               | CRM, SaaS   |
| Stat boxes   | Bordered, numbered                 | Dashboard   |
| Status pills | Semantic (amber/purple/blue/green) | Pipeline    |
| Cards        | White, left bar, badges            | Jira/Trello |
| Gradient     | Very subtle cream/teal             | Barely felt |

---

## Recommended Direction: Less CRM, More Human

1. **Swap teal as hero** — Use golden/amber or coral as primary; keep teal for secondary or specific actions.
2. **Soften stats** — Less "KPI row," more inline or celebratory.
3. **Warmer gradient** — Golden Hour, Summer Breeze, or Honeycomb so the background feels present.
4. **Softer cards** — Warmer surfaces, no left-status-bar feel, more postcard than database row.
5. **Friendlier copy** — "TRACK" → "What kind?", "Pipeline" → "Your mix" or "Where things are".
6. **Brand typography** — "LaunchPad" in title case, slightly more character in display font.

---

## Your Current Palette (Quick Reference)

| Role           | Current                             | Use                                      |
| -------------- | ----------------------------------- | ---------------------------------------- |
| **Primary**    | Teal (`#0fb896`)                    | CTAs, active states, links, progress     |
| **Secondary**  | Coral (`#f04e3e`)                   | Errors, destructive, urgent actions      |
| **Accents**    | Purple, amber, blue, green          | Status pills, track types, encouragement |
| **Background** | Cream/ivory (`#fefcf9`, `#f5f0eb`)  | Warm, inviting base                      |
| **Text**       | Warm browns (`#2d2319` → `#a39585`) | Grounded, readable hierarchy             |

**Design language**: Warm & playful · Career/idea tracking · Motivational

---

## Figma Framework → LaunchPad Fit

### Color Harmony Types (Relevant to Your App)

| Type              | What it does                           | Your use                                             |
| ----------------- | -------------------------------------- | ---------------------------------------------------- |
| **Analogous**     | Colors next to each other on the wheel | Teal + green + blue = natural, harmonious feel ✓     |
| **Complementary** | Opposite on wheel = contrast           | Teal vs coral accents for CTAs vs errors ✓           |
| **Monochromatic** | Same hue, different values             | Status scales (spark→shipped) could be more cohesive |
| **Triadic**       | Three equidistant colors               | Teal, coral, purple give vibrant variety ✓           |

### Color Psychology (From Figma)

- **Teal/Green** → Calm, growth, trust, health, nature
- **Coral/Orange** → Warmth, energy, urgency, playfulness
- **Purple** → Creativity, luxury, exploration
- **Amber/Yellow** → Optimism, knowledge, spark of idea
- **Blue** → Professionalism, trust, focus
- **Cream/beige** → Comfort, approachability, warmth

---

## Figma Combinations That Match LaunchPad's Vibe

### Tranquil + Growth (Best fit for productivity/focus)

| Combination               | Description                     | Hex inspiration              | Use case                                     |
| ------------------------- | ------------------------------- | ---------------------------- | -------------------------------------------- |
| **Emerald Odyssey** (80)  | Calming emerald greens          | Variations of forest/emerald | Progress, "shipped" states, wellness moments |
| **Morning Dew** (84)      | Pale teal + mint                | Crisp, fresh, clarity        | Input focus, meditation/reflection UI        |
| **Coastal Morning** (87)  | Seafoam, soft blue, sandy beige | Clean, peaceful, versatile   | Background gradients, cards                  |
| **Eucalyptus Grove** (88) | Dusty sage, gray, off-white     | Calm, authentic, sustainable | Muted accents, secondary surfaces            |

### Playful + Energetic (Best fit for motivation/engagement)

| Combination              | Description                         | Use case                               |
| ------------------------ | ----------------------------------- | -------------------------------------- |
| **Pistachio Dream** (31) | Pastel green, peace + concentration | Productivity, focus mode               |
| **Summer Breeze** (100)  | Yellow, coral pink, sky blue, sand  | Empty states, onboarding, celebration  |
| **Fresh Peach** (21)     | Warm, welcoming peach tones         | Input placeholders, hints              |
| **Lotus Garden** (19)    | Mint, coral, soft purple            | Encouragement bubbles, coach responses |

### Sophisticated + Grounded

| Combination            | Description                   | Use case                         |
| ---------------------- | ----------------------------- | -------------------------------- |
| **Spiced Chai** (23)   | Cream, cinnamon, nutmeg       | Comfort, reading/reflection      |
| **Honeycomb** (69)     | Golden honey, beeswax, cream  | Warm CTAs, achievements          |
| **Desert Mirage** (68) | Sandy beige, terracotta, sage | Neutral cards, secondary actions |

---

## UX/UI Recommendations

### 1. **Visual Hierarchy (Figma principle: "Establish clear hierarchy")**

- **Primary actions** → Teal (keep)
- **Secondary / tertiary** → Use lighter teal (`teal[200]`) or muted (`text.muted`) for less emphasis
- **Destructive** → Coral/red (keep)
- **Status progression** → Sequential hues (e.g. amber→purple→blue→green) create clear "journey" — your tracks already do this ✓

### 2. **Contrast & Accessibility**

- Figma emphasizes _adhering to color contrast guidelines_ for readability
- Check: `text.muted` (#a39585) on `bg.primary` (#fefcf9) — consider slightly darker for body/secondary text in low light
- **CTA buttons**: Teal on cream — ensure 4.5:1+ contrast for WCAG AA

### 3. **Background Gradients**

- Current: `fefcf9 → eefcf8 → f6f2ff → fff5f3 → f0f7ff → fefcf9`
- **Coastal Morning** inspiration: softer, more unified — seafoam + sand + soft blue
- Consider: fewer color jumps, more analogous flow for a calmer feel

### 4. **Status Colors (tracks.ts)**

- You use semantic colors (spark=amber, exploring=purple, building=blue, shipped=green)
- Figma **Monochromatic** idea: for a single track, use one base hue at different saturations (e.g. teal 200→500→600) for early→middle→done — creates cohesion per track
- Alternative: keep semantic across tracks for quick recognition, but ensure consistent saturation levels so none "scream" louder than others

### 5. **Empty & Onboarding States**

- **Summer Breeze** energy: sunny yellow + coral + sky blue for "Get started" / "Add your first idea"
- Current onboarding uses teal — consider a warmer gradient for first impressions (golden hour / fresh peach)

### 6. **Input & Focus States**

- **Morning Dew** / **Minty Fresh**: pale teal or mint ring on focus — reinforces calm, focus
- You already use `green[400]` for Explore search focus ✓ — could standardize to `teal[300]` for brand consistency

### 7. **Cards & Surfaces**

- **Quiet Luxury** / **Stone Path**: warm grays with hints of brown — could refine `surfacePressed` and borders for a more premium feel
- `border.subtle` / `border.medium` — consider a very slight warmth (taupe vs pure gray) to match your cream base

### 8. **Shadows**

- Current `shadowColor: '#64748b'` (cool slate) — consider `#6b5c4d` or similar warm gray to match text.secondary
- Aligns shadow tone with your warm palette

---

## Quick Wins (Low-Effort, High-Impact)

1. **Shadow color** → Use `colors.text.secondary` or a warm gray instead of cool `#64748b`
2. **Border warmth** → Add a hint of warmth to `border.medium` / `border.subtle` (already quite warm ✓)
3. **Gradient simplification** → Reduce from 6 stops to 3–4 for a calmer, more **Coastal Morning**–like feel
4. **Focus states** → Standardize on teal for inputs (Explore uses green; Ideas/Add use teal)
5. **Status saturation** → Ensure amber, purple, blue, green have similar chroma so hierarchy comes from placement, not "loudness"

---

## Reference: Figma Combinations by Mood

| Mood               | Figma combos                          |
| ------------------ | ------------------------------------- |
| Calm, productivity | 72–88 (Tranquil)                      |
| Playful, energetic | 28–40 (Playful), 100 (Summer breeze)  |
| Sophisticated      | 56–71 (Neutral), 60 (Quiet luxury)    |
| Growth, trust      | 4 (Lush forest), 80 (Emerald odyssey) |

---

## Links

- [Figma: 100 Color Combinations](https://www.figma.com/resource-library/color-combinations/)
- [Figma: Color theory basics](https://www.figma.com/resource-library/design-basics/color-combinations/) (color wheel, harmony, psychology)
- LaunchPad tokens: `app/theme/tokens.ts`
- Track/status colors: `app/constants/tracks.ts`
