# LMS v2.0 — Design System Specification
**Design Language:** Industrial UI + Mission Control + Apple Spacing  
**Application:** Laser Management System (Wafer Drilling Equipment Telemetry & Maintenance)  
**Version:** 2.0.0-foundation (Sprint 0)

---

## 1. Executive Summary & Interface Audit

### 1.1 Interface Audit & Inconsistency Assessment

An audit of the existing codebase identified the following legacy patterns and structural inconsistencies across layouts:

| UI Dimension | Legacy / Audited State | Target Design System Standard |
| :--- | :--- | :--- |
| **Layout Hierarchy** | Mixed container constraints (1760px header vs. 1440px modal vs. 960px settings vs. legacy 360px sidebars). | Standardized container scale: Full-bleed header with 1760px inner containment; 88% / 1440px modal overlay; 960px focused forms. |
| **Card Anatomy** | Inconsistent inner paddings (14px, 16px, 22px, 24px, 26px) and mixed structural divisions. | Universal Card Anatomy: Header (Title + Pill Badge), Body (Runtime Box + 2-Col Metric Split), Life Capacity Bar, and Footer. |
| **Typography** | Arbitrary font sizes (9px, 10px, 11px, 12px, 13px, 14px, 15px, 16px, 17px, 18px, 19px, 20px, 26px, 28px, 30px, 36px, 38px). | Strict 12-step typography scale (`--font-size-2xs` to `--font-size-6xl`) with mandatory `tabular-nums` for telemetry. |
| **Spacing System** | Mixed ad-hoc margins and paddings (3px, 7px, 10px, 14px, 18px, 22px, 26px, 34px). | Strict **8-Point Apple Spacing System** with 4px sub-grid increments (`--space-0` through `--space-16`). |
| **Borders & Radii** | Competing colored left borders (e.g. 5px border-left on 12px rounded cards), random hairline borders. | Clean 1px structural outlines (`--color-border-base`, `--color-border-highlight`) + mathematical radius nesting rule. |
| **Shadows & Elevation** | Ad-hoc box-shadow declarations with glowing cyan/green drops. | 4-tier restrained matte elevation system (`--elevation-0` to `--elevation-4`) paired with crisp border containment. |
| **Color Semantics** | Inconsistent color variables and ad-hoc inline RGBAs. | Centralized semantic tokens (`--color-safe`, `--color-warning`, `--color-alarm`, `--color-primary`, `--color-purple`). |
| **Icon Sizing** | Unstandardized inline SVGs (13px, 15px, 16px, 18px, 20px). | 6 fixed icon size tiers (`--icon-xs`: 12px to `--icon-2xl`: 24px). |
| **Button Styles** | Competing heights (36px, 38px, 40px, 44px) and mixed padding ratios. | Standardized button tiers (Small 32px, Base 38px/40px, Touch/Mobile 44px) with exact 2:1 horizontal-to-vertical padding. |
| **Tables** | Inconsistent row heights, mixed cell alignments, and missing numeric tabular alignments. | Standardized data table format with sticky 10px tracked uppercase headers, 12px cell padding, and right-aligned tabular numbers. |
| **Navigation & Modals** | Coexistence of modal overlays with legacy inline `.mainGrid` views. | Modal Architecture with persistent breadcrumb header, unified segmented tabs, and keyboard dismissal (`ESC`). |
| **Form Controls** | Mismatched input heights (36px vs 40px), inconsistent label casing, and focus ring variance. | Unified 40px height inputs, 10px uppercase tracking labels, and standard 2px focus glow (`--color-border-focus`). |

---

## 2. Brand Identity & Design Philosophy

### 2.1 Core Pillars
1. **Industrial UI**: Clean, high-density, matte hardware-inspired controls engineered for high-throughput semiconductor wafer fab environments. High information density without visual clutter.
2. **Mission Control**: Immediate situational awareness. Critical equipment health (Alarm, Warning, Safe) is communicated instantly with unambiguous visual hierarchy and zero decorative fluff.
3. **Apple Spacing**: Generous negative space between major modules, mathematical rhythmic padding within containers, and refined typography pairings.

### 2.2 Anti-Slop Directives
- **No Cliché Gradients**: No purple-to-blue decorative background sweeps, no gradient text.
- **No Arbitrary Glassmorphism**: No frosted glow effects or heavy blurs that degrade data legibility.
- **No Competing Border-Radius Accents**: Thick accent borders must never sit on rounded corners without mathematical justification.
- **No Orphan Labels**: Text inside buttons, pills, chips, tabs, and badges must sit on ONE line (`white-space: nowrap`).
- **No Unstyled Numbers**: All operational counters, hours, percentages, and timestamps must use `font-variant-numeric: tabular-nums` (`font-feature-settings: 'tnum'`).

---

## 3. Color Tokens & Semantic Hierarchy

### 3.1 Dark Theme (Command Center — Default)

```css
:root {
    --color-bg-base: #0b0f19;              /* Deep matte slate canvas */
    --color-bg-surface: #111827;           /* Card & panel foundation */
    --color-bg-surface-elevated: #1e293b;  /* Hovered & elevated items */
    --color-bg-input: #090d16;             /* Recessed input surface */
    
    --color-border-subtle: #1e293b;
    --color-border-base: #1e293b;
    --color-border-highlight: #334155;
    --color-border-focus: #38bdf8;
    
    --color-text-primary: #f8fafc;
    --color-text-secondary: #94a3b8;
    --color-text-muted: #64748b;
    --color-text-inverse: #0b0f19;
    
    /* Semantic Status */
    --color-primary: #38bdf8;              /* Steel Cyan (Active / Focus) */
    --color-primary-hover: #0ea5e9;
    --color-primary-subtle: rgba(56, 189, 248, 0.12);
    --color-primary-border: rgba(56, 189, 248, 0.3);
    
    --color-safe: #10b981;                 /* Industrial Emerald (Healthy) */
    --color-safe-hover: #059669;
    --color-safe-subtle: rgba(16, 185, 129, 0.12);
    --color-safe-border: rgba(16, 185, 129, 0.3);
    
    --color-warning: #f59e0b;              /* Industrial Amber (Procurement Window) */
    --color-warning-hover: #d97706;
    --color-warning-subtle: rgba(245, 158, 11, 0.12);
    --color-warning-border: rgba(245, 158, 11, 0.3);
    
    --color-alarm: #ef4444;                /* Industrial Crimson (Immediate Action) */
    --color-alarm-hover: #dc2626;
    --color-alarm-subtle: rgba(239, 68, 68, 0.12);
    --color-alarm-border: rgba(239, 68, 68, 0.3);
    
    --color-purple: #a855f7;               /* Lifecycle / Maintenance Log */
    --color-purple-subtle: rgba(168, 85, 247, 0.12);
    --color-purple-border: rgba(168, 85, 247, 0.3);
}
```

### 3.2 Light Theme (Industrial Lab Surface)

```css
[data-theme="light"] {
    --color-bg-base: #f1f5f9;              /* Clean industrial off-white canvas */
    --color-bg-surface: #ffffff;           /* Crisp clinical surface */
    --color-bg-surface-elevated: #f8fafc;  /* Elevated card background */
    --color-bg-input: #f8fafc;             /* Input background */
    
    --color-border-subtle: #e2e8f0;
    --color-border-base: #cbd5e1;
    --color-border-highlight: #94a3b8;
    --color-border-focus: #0284c7;
    
    --color-text-primary: #0f172a;
    --color-text-secondary: #64748b;
    --color-text-muted: #94a3b8;
    --color-text-inverse: #ffffff;
    
    --color-primary: #0284c7;
    --color-primary-hover: #0369a1;
    --color-primary-subtle: rgba(2, 132, 199, 0.1);
    --color-primary-border: rgba(2, 132, 199, 0.25);
    
    --color-safe: #059669;
    --color-safe-hover: #047857;
    --color-safe-subtle: rgba(5, 150, 105, 0.1);
    --color-safe-border: rgba(5, 150, 105, 0.25);
    
    --color-warning: #d97706;
    --color-warning-hover: #b45309;
    --color-warning-subtle: rgba(217, 119, 6, 0.1);
    --color-warning-border: rgba(217, 119, 6, 0.25);
    
    --color-alarm: #dc2626;
    --color-alarm-hover: #b91c1c;
    --color-alarm-subtle: rgba(220, 38, 38, 0.1);
    --color-alarm-border: rgba(220, 38, 38, 0.25);
    
    --color-purple: #9333ea;
    --color-purple-subtle: rgba(147, 51, 234, 0.1);
    --color-purple-border: rgba(147, 51, 234, 0.25);
}
```

---

## 4. Typography Scale & Hierarchy

### 4.1 Font Stack
- **Primary Body & Display:** `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Telemetry & Numbers:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` with `font-variant-numeric: tabular-nums`

### 4.2 Scale Definitions

| Token | Size | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--font-size-2xs` | 9px | 1.1 | +0.7px | Micro status tags, auxiliary indicator labels |
| `--font-size-xs` | 10px | 1.1 | +0.8px | Table header caps, section eyebrows, stat labels |
| `--font-size-sm` | 11px | 1.25 | +0.5px | Sub-meta info, filter labels, action hints |
| `--font-size-base` | 12px | 1.4 | 0px | Secondary descriptions, timeline text |
| `--font-size-md` | 13px | 1.5 | 0px | Primary body text, form controls, button labels |
| `--font-size-lg` | 14px | 1.4 | -0.2px | List item titles, card action labels, emphasized body |
| `--font-size-xl` | 16px | 1.3 | -0.2px | Machine card headers, sub-panel titles |
| `--font-size-2xl` | 18px | 1.25 | -0.3px | Panel headers, section titles |
| `--font-size-3xl` | 20px | 1.2 | -0.4px | Machine detail modal title, main view titles |
| `--font-size-4xl` | 26px | 1.1 | -0.6px | Primary card runtime numbers, modal KPI figures |
| `--font-size-5xl` | 30px | 1.1 | -0.6px | Primary telemetry stat numbers |
| `--font-size-6xl` | 36px | 1.05 | -0.8px | Top-level hero readouts |

---

## 5. 8-Point Apple Spacing & Layout Rules

### 5.1 Spacing Tokens
- `--space-0`: 0px
- `--space-1`: 4px (Sub-padding, micro gaps)
- `--space-2`: 8px (Badge padding, icon gaps, compact lists)
- `--space-3`: 12px (Control gaps, split metric gaps, table row padding)
- `--space-4`: 16px (Standard container internal padding, grid gaps)
- `--space-5`: 20px (Card padding, column gaps)
- `--space-6`: 24px (Section padding, modal content inset)
- `--space-8`: 32px (Header horizontal padding, section separation)
- `--space-10`: 40px (Major layout divider spacing)
- `--space-12`: 48px (Page boundary bottom padding)
- `--space-16`: 64px (Hero module padding)

### 5.2 Layout Math & Container Constraints
- **Header:** Sticky `top: 0`, `z-index: 100`, max-width `1760px`, horizontal padding `36px`.
- **Fleet Grid:** Auto-fill grid (`minmax(330px, 1fr)`), column gap `20px`, row gap `20px`.
- **Modal Overlay:** Fixed viewport overlay (`rgba(11, 15, 25, 0.82)`), container width `88%`, max-width `1440px`, max-height `940px`, border-radius `--radius-lg` (12px).
- **Settings / Narrow Workspace:** Centered column, max-width `960px`, gap `28px`.

---

## 6. Border Radii & Mathematical Corner Nesting

### 6.1 Radius Tokens
- `--radius-xs`: 4px (Micro tags, inline code badges)
- `--radius-sm`: 6px (Input elements, small buttons, photo thumbnails)
- `--radius-md`: 8px (Standard buttons, inputs, segmented navigation bars)
- `--radius-lg`: 12px (Hero cards, telemetry panels, modal dialogs)
- `--radius-xl`: 16px (Large overlay sheets)
- `--radius-pill`: 999px (Status pills, avatar circles, filter buttons)

### 6.2 Nested Radius Rule
$$\text{Inner Corner Radius} = \text{Outer Corner Radius} - \text{Padding Between Containers}$$
*Example:* A card with `--radius-lg` (12px) and `padding: 4px` surrounding an inner active tile must have inner corner radius $= 12px - 4px = 8px$ (`--radius-md`).

---

## 7. Elevation, Shadows & Depth

| Elevation Level | Token | Shadow CSS | Usage |
| :--- | :--- | :--- | :--- |
| Level 0 | `--elevation-0` | `none` | Flat embedded components, inputs |
| Level 1 | `--elevation-1` | `0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)` | Resting machine cards, summary stats |
| Level 2 | `--elevation-2` | `0 4px 12px -2px rgba(0, 0, 0, 0.35), 0 2px 6px -1px rgba(0, 0, 0, 0.2)` | Card hover state, active dropdown triggers |
| Level 3 | `--elevation-3` | `0 12px 28px -4px rgba(0, 0, 0, 0.45), 0 6px 14px -2px rgba(0, 0, 0, 0.25)` | Filter popover dropdowns, floating menus |
| Level 4 | `--elevation-4` | `0 20px 48px -4px rgba(0, 0, 0, 0.55), 0 10px 24px -2px rgba(0, 0, 0, 0.3)` | Machine detail modal, critical dialogs |

---

## 8. Component Standards

### 8.1 Machine Hero Card
```
+-------------------------------------------------------------+
| [Machine Name]                          [● STATUS BADGE]     |
| [Machine No • Model • Department]                           |
+-------------------------------------------------------------+
| CURRENT RUNTIME                                             |
| 14,280 hrs                                                  |
+-------------------------------------------------------------+
| REMAINING                    | REPLACEMENT                  |
| 720 hrs                      | 14 Days (Nov 24)             |
+-------------------------------------------------------------+
| LIFE CAPACITY                                       94.8%   |
| [==================================================-------] |
+-------------------------------------------------------------+
| Click to inspect                   [Edit] [Share] [Delete]  |
+-------------------------------------------------------------+
```

### 8.2 Buttons & Controls
- **Primary Button (`.btn-primary`):** Solid `--color-primary`, text `--color-text-inverse`, font-weight 700.
- **Secondary Button (`.btn-secondary`):** Background `--color-bg-input`, border `--color-border-base`, text `--color-text-primary`.
- **Danger Button (`.btn-danger`):** Background `--color-alarm-subtle`, border `--color-alarm-border`, text `--color-alarm`.
- **Pill Button (`.btn-back-pill`, `.history-pill`):** `--radius-pill`, padding `6px 14px`, 12px typography.

### 8.3 Status & Badge System
- **ALARM:** Background `rgba(239, 68, 68, 0.12)`, border `rgba(239, 68, 68, 0.3)`, text `--color-alarm`, pulsing 6px LED.
- **WARNING:** Background `rgba(245, 158, 11, 0.12)`, border `rgba(245, 158, 11, 0.3)`, text `--color-warning`, steady LED.
- **SAFE / HEALTHY:** Background `rgba(16, 185, 129, 0.12)`, border `rgba(16, 185, 129, 0.3)`, text `--color-safe`, steady LED.

### 8.4 Tables
- Table header background: `--color-bg-input`
- Table header text: `--color-text-secondary`, font-size 10px, uppercase, tracking +0.6px
- Cell borders: 1px bottom border `--color-border-base`
- Cell padding: `12px 16px`
- Numeric columns: Right-aligned, `tabular-nums`
- Row hover state: Subtle background tint `rgba(255, 255, 255, 0.02)` (dark) / `#f8fafc` (light)

---

## 9. Motion & Animation Principles

- **Micro-Interactions (`--transition-fast` - 120ms):** Button presses, icon hover color shifts.
- **Standard UI Transitions (`--transition-base` - 180ms cubic-bezier(0.4, 0, 0.2, 1)):** Card hover lifts, tab switches, dropdown triggers.
- **Modal Transitions (`--transition-smooth` - 240ms cubic-bezier(0.4, 0, 0.2, 1)):** Dialog scale-in (`scale(0.98)` to `scale(1)`), backdrop opacity fade.
- **Restrained Alarm Animation:** Alarm cards utilize a gentle border glow pulse (`1.5s ease-in-out infinite`), avoiding jarring flashes.

---

## 10. Responsive Breakpoints & Mobile Touch Target

- **Widescreen Desktop ($\ge 1920px$):** 4-column fleet grid, 1880px max-width container.
- **Standard Desktop ($1440px - 1919px$):** 3-to-4 column fleet grid, 1760px max-width container.
- **Laptop / Tablet Landscape ($1024px - 1439px$):** 3-column fleet grid, 1320px max-width container.
- **Tablet Portrait ($768px - 1023px$):** 2-column fleet grid, single-column detail layout.
- **Mobile Phones ($\le 767px$):** 1-column fleet grid, vertically stacked toolbar, touch targets minimum 44px $\times$ 44px.

---

## 11. UI Roadmap: Implementation-Ready Sections for Future Sprints

1. **Sprint 1 — Machine Detail Modal Redesign:** Apply mission control KPI cards, laser head cards (L1/L2), calibration confidence center, and history timeline.
2. **Sprint 2 — Laser Head Unit Component Redesign:** Standardize dual-head (L1 / L2) telemetry tiles with lifespan countdowns and real-time maintenance triggers.
3. **Sprint 3 — Maintenance Logs & Calibration Confidence Center:** Overhaul tabular records, inline edit states, photo attachments, and confidence intervals.
4. **Sprint 4 — Fleet Analytics & Health Distribution Charts:** Redesign aggregate health distribution charts and degradation trend visualizers using clean SVG/Canvas.
5. **Sprint 5 — Global Search & Command Palette:** Quick-switcher for instant jump to machines, serial numbers, and maintenance schedules.

---

## 12. Technical Risks & Required Refactors

1. **Legacy CSS Deprecation:** Deprecate obsolete `.mainGrid`, `.panel`, and `.life` classes in `dashboard.css` once the modal architecture is fully adopted across all navigation paths.
2. **Tabular Number Class Propagation:** Ensure all dynamically generated metric strings in `dashboard.js` and `app.js` apply `.tabular-nums` class to prevent layout shifts during live simulation ticks.
3. **Modal Focus Trapping & Accessibility:** Implement ARIA dialog tags (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) and keyboard `ESC` listeners for all modal views.
4. **D1 Persistence Consistency:** Maintain identical data binding contracts so future visual restyling never alters calculation models or data payloads.
