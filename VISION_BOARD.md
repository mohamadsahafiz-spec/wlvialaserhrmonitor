# LMS v2.0 — PRODUCT VISION BOARD
*The Visual & Architectural Bible for the Semiconductor Laser Management Operating System*

---

## 1. PRODUCT PHILOSOPHY

### What LMS Is
LMS (Laser Management System) is an **Engineering Operating System** and **Mission Control Interface** designed specifically for high-yield semiconductor manufacturing environments (e.g., wafer drilling, via formation, wafer dicing). It operates as the real-time operational brain for laser diode runtime tracking, baseline shift recalibration, optical degradation modeling, and proactive maintenance dispatch.

### What LMS Is NOT
- **It is NOT an administrative dashboard.** It does not present vanity vanity metrics or high-level summaries for executive slide decks.
- **It is NOT a SaaS analytics portal.** It avoids multi-colored pie charts, decorative line charts, or marketing-style conversion funnels.
- **It is NOT a generic asset management database.** It is an active triage terminal that tracks the physical decay physics of semiconductor laser heads.
- **It is NOT a consumer web application.** It has no social features, gamified badges, decorative glassmorphism, or floating toy widgets.

### Who Uses It
- **Field Service Engineers & Semiconductor Equipment Technicians:** Highly trained specialists whose time is measured in thousands of dollars per minute of machine downtime.
- **Fab Process & Maintenance Leads:** Engineers responsible for line availability, scheduling optical head swaps during planned maintenance windows, and preventing catastrophic optical breakdown.

### Why It Exists
In advanced semiconductor packaging and wafer drilling, UV/CO2 laser diodes experience irreversible optical degradation, power decay, and focal baseline drift. Running a degraded diode leads to defective drill vias, scrapped silicon wafers, and catastrophic production halts. Replacing a diode too early wastes tens of thousands of dollars in unspent life; replacing it too late halts the cleanroom line. LMS exists to find the exact, mathematically optimized point of intervention.

### What Problem It Solves
It eliminates guesswork, manual paper logs, and fragmented Excel spreadsheets. It continuously tracks cumulative runtimes across multiple laser heads per machine, applies recalibration offsets, monitors contingency states, and answers the only question that matters:
> **"Which machine do I need to physically walk to next, and what tool/head do I need in my hand?"**

### What an Engineer Feels While Using It
- **Absolute Confidence:** Every number is precise, tabular, and unpolluted by visual noise.
- **Calm Authority:** High-density, high-legibility layout that respects the engineer's cognitive bandwidth.
- **Zero Friction:** No searching, no decoding ambiguous icons, no hunting through nested tabs. Triage is instant.

---

## 2. VISUAL PERSONALITY

The interface embodies the aesthetic and operational rigor of a **Class 1 Cleanroom Workstation**, combining the mathematical discipline of **NASA Mission Control** with the typographic precision and spatial restraint of **Apple Pro Workstation Hardware**.

- **Calm & Quiet:** A restrained, dark neutral palette with low ambient contrast. The screen does not vibrate or compete for attention.
- **Precise & Mathematical:** Strict alignment, monospace tabular numerics, optical baseline alignment, and uniform component heights.
- **Industrial & Mission-Critical:** High-contrast semantic indicators (Safety Green, Warning Amber, Incident Red) reserved exclusively for operational states—never used decoratively.
- **Dense yet Breathable:** High information density achieved through typographic hierarchy and negative space rather than cramped borders and tiny font sizes.
- **Substantial Surfaces:** Solid, matte 3-tier surface hierarchy. No frosted glass, no glowing outlines, no translucent drop-shadows, and no decorative gradients.

---

## 3. THE 3-SECOND TRIAGE RULE

When an engineer steps in front of the terminal, their eyes must follow an unforced, strictly engineered path:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SECOND 1: THE ANOMALY SCAN                                                │
│  Eyes land instantly on ZONE D (ACTIVE INCIDENTS).                          │
│  → Is there an alarm? Is any machine in critical condition?                │
│  → Immediate recognition of RED indicator and negative operating margin.    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SECOND 2: THE MARGIN & ACTION EVALUATION                                  │
│  Eyes evaluate the REMAINING MARGIN and the REQUIRED ACTION pill.           │
│  → "BMD-04: REPLACE LASER HEAD. Margin: -1,240 HRS (14 days overdue)."       │
│  → Temporal urgency and equipment risk are quantified immediately.          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SECOND 3: THE DISPATCH / INSPECTION TRIGGER                                │
│  Eyes target the machine identity and click to inspect.                     │
│  → Machine ID (BMD-04), Production Bay (Bay 3, Drill Line A).               │
│  → Engineer clicks the card to enter Machine Detail and dispatch swap.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

*If an engineer's attention is drawn to decorative header graphics, meaningless aggregate pie charts, or floating search buttons before identifying critical machines, the layout has failed.*

---

## 4. PAGE COMPOSITION

```
═══════════════════════════════════════════════════════════════════════════════
ZONE A: APPLICATION HEADER (Height: 56px | Minimal | Fixed Surface 2)
[ LMS v2.0 ] • Semiconductor Laser OS         [ Fleet Overview | Settings ] [ Eng. Mode ▾ ] [ ☼ ]
═══════════════════════════════════════════════════════════════════════════════
                                      │ (16px vertical gap)
                                      ▼
───────────────────────────────────────────────────────────────────────────────
ZONE B: FLEET TELEMETRY STRIP (Height: 48px | Compact Continuous Bar)
[ ● HEALTHY: 8 ]   [ ▲ WARNING: 3 ]   [ ✖ ALARM: 1 ]   [ 🫀 HEALTH: 84.2% ]   [ SCADA: ALL SYSTEMS OPTIMAL ]
───────────────────────────────────────────────────────────────────────────────
                                      │ (16px vertical gap)
                                      ▼
───────────────────────────────────────────────────────────────────────────────
ZONE C: ENGINEERING COMMAND BAR (Height: 40px | Unified Single-Axis Row)
[ 🔍 Search Machine/Serial/Dept... ] [ ☷ Filter (Status, Model, Dept) ] [ ⇅ Sort: Margin ] [ 📅 Sim Date ] [ + Add ]
───────────────────────────────────────────────────────────────────────────────
                                      │ (24px vertical gap)
                                      ▼
╔═════════════════════════════════════════════════════════════════════════════╗
║ ZONE D: ACTIVE INCIDENTS (Maximum Visual Weight | Dominates Viewport)       ║
║ [ ✖ ACTIVE INCIDENTS (1 UNIT) ] — Immediate Laser Head Intervention Required║
║ ┌───────────────────────────────────────┐ ┌───────────────────────────────┐ ║
║ │ INCIDENT CARD (Large / High Contrast) │ │                               │ ║
║ │ [BMD-04]                   [ ALARM ]  │ │                               │ ║
║ │ ACTION: REPLACE LASER HEAD            │ │                               │ ║
║ │ MARGIN: -1,240 HRS   (14d overdue)    │ │                               │ ║
║ │ RUNTIME: 29,240 HRS (Head 1 - UV355)  │ │                               │ ║
║ │ CAPACITY: [████████████████] 0%       │ │                               │ ║
║ │ [ Inspect Full Telemetry → ]    [⚙][🗑]│ │                               │ ║
║ └───────────────────────────────────────┘ └───────────────────────────────┘ ║
╚═════════════════════════════════════════════════════════════════════════════╝
                                      │ (32px vertical gap)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ZONE E: MONITORED FLEET (Secondary Priority | High Density 3-4 Column Grid) │
│ [ MONITORED FLEET (11 UNITS) ] — Operational Baseline Tracking              │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐  │
│ │ CARD (Compact)│ │ CARD (Compact)│ │ CARD (Compact)│ │ CARD (Compact)   │  │
│ │ BMD-01 [SAFE] │ │ BMD-02 [WARN] │ │ BMD-03 [SAFE] │ │ BMD-05 [SAFE]    │  │
│ │ Margin: 4.8k h│ │ Margin: 820 h │ │ Margin: 12.1k │ │ Margin: 6.4k h   │  │
│ └───────────────┘ └───────────────┘ └───────────────┘ └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ (32px vertical gap)
                                      ▼
───────────────────────────────────────────────────────────────────────────────
ZONE F: STATUS FOOTER (Restrained Utility Strip)
LMS v2.0 • Real-Time D1 Cloud Sync Active • SCADA Protocol v4.2      [ Export Report ] [ Fleet Diagnostics ]
───────────────────────────────────────────────────────────────────────────────
```

---

## 5. VISUAL WEIGHT MAP

| Rank | Zone / Element | Visual Weight | Architectural Justification |
| :--- | :--- | :--- | :--- |
| **1** | **ZONE D: Active Incidents** | **45% of Viewport Focus** | Immediate failure prevention. Uses high-contrast structural borders, deep dark alarm pills, and dominant numerical readouts. |
| **2** | **Machine Card Margins** | **25% of Viewport Focus** | The primary operational metric (`-1,240 HRS`, `+4,200 HRS`) is the core decision driver for every unit. |
| **3** | **ZONE E: Monitored Fleet** | **15% of Viewport Focus** | Regular grid pattern, lower contrast, compact cards providing steady situational awareness for non-critical units. |
| **4** | **ZONE C: Command Bar** | **7% of Viewport Focus** | Functional tool strip; neutral matte gray, perfectly aligned, accessible when needed but visually quiet. |
| **5** | **ZONE B: Telemetry Strip** | **5% of Viewport Focus** | Single-line horizontal telemetry bar providing ambient fab context without taking vertical screen space. |
| **6** | **ZONE A & F: Header & Footer** | **3% of Viewport Focus** | Minimalist boundary anchors; low contrast, zero decorative flair. |

---

## 6. CARD BLUEPRINT (THE TRIAGE CARD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. IDENTITY & STATUS HEADER                                                 │
│    BMD-04 (Wafer Driller #4)                              [ ● ALARM ]       │
│    Serial: BMD-302W-9821 • Bay 3 Production Line                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. REQUIRED ACTION                                                          │
│    REQUIRED ACTION: [ REPLACE LASER HEAD ]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. REMAINING MARGIN (VISUAL HERO)                                           │
│    REMAINING MARGIN                                     14 DAYS OVERDUE     │
│    -1,240 HRS                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. SUPPORTING RUNTIME                                                       │
│    Cumulative Runtime (Head 1 - UV355)                       29,240 HRS     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. LIFE CAPACITY PROGRESS                                                   │
│    LIFE CAPACITY REMAINING                                           0.0%   │
│    [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] (Solid 4px Track)   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. QUICK ACTIONS & INSPECTION                                               │
│    Inspect Telemetry & Calibration →                          [ ⚙ ] [ 🗑 ]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Area Rationale & Eye Flow
1. **Identity & Status:** Establishes context and confirms state within 100ms.
2. **Required Action:** Direct instruction (`REPLACE LASER HEAD`, `CALIBRATION REQUIRED`, `MONITOR`). Eliminates ambiguity.
3. **Remaining Margin (Hero):** 32px/36px tabular number. Tells the engineer the exact delta from failure.
4. **Supporting Runtime:** Confirms total accumulated operational hours on the active laser head.
5. **Life Capacity Progress:** A clean 4px horizontal meter representing consumed vs. rated envelope.
6. **Quick Actions:** Low-contrast inspection link and secondary configuration icons.

---

## 7. MACHINE DETAIL BLUEPRINT

When an engineer clicks a card, the view transitions into the **Deep Engineering Workstation**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← FLEET OVERVIEW    BMD-04 — DETAILED LASER TELEMETRY      [ Export PDF ] [ Recalibrate ] │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 1: SYSTEM IDENTIFICATION & CORE STATUS                              │
│ • Machine Model: BMD302W Dual-Beam Wafer Drill   • Commissioned: 2023-04-12 │
│ • Current Active Status: CRITICAL ALARM          • Contingency Rule: ACTIVE │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 2: MULTI-LASER HEAD ARRAY (Physical Laser Bay Breakdown)            │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ LASER HEAD 1 (UV 355nm) - ACTIVE│ │ LASER HEAD 2 (CO2 9.4µm) - STANDBY │ │
│ │ Status: ALARM (Overdue)         │ │ Status: HEALTHY                     │ │
│ │ Runtime: 29,240 / 28,000 hrs    │ │ Runtime: 8,400 / 20,000 hrs         │ │
│ │ Remaining Margin: -1,240 hrs    │ │ Remaining Margin: +11,600 hrs       │ │
│ │ Power Degradation: -18.4%       │ │ Power Degradation: -2.1%            │ │
│ │ Baseline Drift: +42µm (EXCEEDED)│ │ Baseline Drift: +3µm (NOMINAL)      │ │
│ └─────────────────────────────────┘ └─────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 3: RECALIBRATION & DRIFT TELEMETRY                                  │
│ • Initial Baseline Offset: 120.0 hrs  • Latest Recalibration Date: 2026-06-15│
│ • Applied Factor: 1.085x Decay Rate   • Calibration Interval: Every 500 hrs │
├─────────────────────────────────────────────────────────────────────────────┤
│ SECTION 4: CONTINGENCY & RUNTIME EVENT LOG                                  │
│ [ 2026-08-10 14:22 ] Contingency threshold triggered (Margin < 0 hrs).      │
│ [ 2026-07-01 09:15 ] Recalibration executed by Eng. M. Sahafiz (Pass).     │
│ [ 2026-05-18 18:40 ] Laser Head 1 power decay warning threshold crossed.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. SPACING BLUEPRINT (THE APPLE PRO RHYTHM)

All layout dimensions and negative space derive strictly from an **8-point mathematical grid**:

- **Micro Spacing (`4px` / `8px`):** Internal component padding, gap between labels and tabular values, badge margins.
- **Component Spacing (`16px`):** Internal card padding, gap between toolbar controls, metric module padding.
- **Section Spacing (`24px` / `32px`):** Gap between major architectural zones (Command Bar $\rightarrow$ Active Incidents $\rightarrow$ Monitored Fleet).
- **Macro Boundaries (`32px` / `48px`):** Outer viewport margins, boundary padding on desktop displays.

### Alignment Discipline
- **Single Horizontal Baselines:** All interactive controls (Search, Filters, Sort, Buttons) share an identical **40px height** and align on a single optical baseline.
- **Tabular Figures:** All numerical readouts use `font-variant-numeric: tabular-nums` and `font-feature-settings: 'tnum'` to prevent layout jitter during real-time updates.

---

## 9. TYPOGRAPHY BLUEPRINT

| Role | Font Family | Size | Weight | Tracking / Transform | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Margin** | Inter / System UI | `32px`–`36px` | `900` (Black) | `-0.03em`, Tabular | Primary card numerical anchor (`-1,240 HRS`) |
| **Telemetry Value** | Inter / System UI | `24px`–`28px` | `800` (Extrabold) | `-0.02em`, Tabular | Top telemetry values (`8`, `3`, `1`, `84.2%`) |
| **Section Header** | Inter / System UI | `14px` | `800` (Extrabold) | `+0.05em`, UPPERCASE | Zone titles (`ACTIVE INCIDENTS`, `MONITORED FLEET`) |
| **Action Pill** | Inter / System UI | `11px` | `800` (Extrabold) | `+0.04em`, UPPERCASE | Required action tag (`REPLACE LASER HEAD`) |
| **Field Label** | Inter / System UI | `10px`–`11px` | `700` (Bold) | `+0.06em`, UPPERCASE | Metric descriptions (`REMAINING MARGIN`, `CURRENT RUNTIME`) |
| **Body / Meta** | Inter / System UI | `13px`–`14px` | `500` (Medium) | `0.00em` | Serial numbers, descriptions, tooltips |

---

## 10. THE REMOVE LIST (BANNED ARTIFACTS)

| Banned Element | Why It Is Removed |
| :--- | :--- |
| **Glassmorphism / Frosted Panels** | Looks like a consumer iOS mockup; creates visual haziness, lowers legibility, and feels non-industrial. |
| **Decorative Gradients** | Gradient cards and borders distract from semantic alarm states (Green/Yellow/Red). |
| **Floating KPI Widgets** | Large, separated dashboard metric boxes waste vertical space before showing real machines. |
| **Stacked Duplicate Cards** | Nesting cards inside cards inside groups increases cognitive load and border clutter. |
| **Full-Sentence Metric Labels** | `"The current accumulated runtime is 29,240 hours"` $\rightarrow$ Replaced with structured key-value: `RUNTIME: 29,240 HRS`. |
| **Website Navbars** | Top navigation links that look like marketing landing pages $\rightarrow$ Replaced with integrated desktop switcher. |
| **Multi-laser sub-tabs on overview cards** | Deep diode switching controls belong inside Machine Detail, not crammed on high-level triage cards. |

---

## 11. THE KEEP LIST (ESSENTIAL ARCHITECTURE)

| Essential Element | Why It Is Preserved |
| :--- | :--- |
| **Real-time Laser Physics Engine** | Accurately calculates baseline shifts, operating hours, and rated life thresholds per laser diode. |
| **Multi-Laser Multi-Head Architecture** | Supports complex machines with independent UV, CO2, and fiber heads. |
| **Cloudflare D1 Persistence & Sync** | Ensures instant, multi-terminal persistence across fab shifts without data loss. |
| **Temporal Simulation Engine** | Enables process engineers to simulate future production dates to plan maintenance shutdowns. |
| **Multi-Factor Filter Popover** | Compact, high-power filtering by status, model, and department without consuming persistent screen real estate. |
| **High-Precision Recalibration Workflows** | Structured calibration logs with factor decay multipliers and drift compensation. |

---

## 12. SUCCESS CHECKLIST

Before any future release is approved, every item on this checklist must be verified:

- [ ] **Engineering Identity:** Does this screen feel like a dedicated semiconductor tool (ASML/Applied Materials/KLA) rather than a website?
- [ ] **Substantial Feel:** Does the UI feel robust, solid, and high-end without relying on glass or shadows?
- [ ] **3-Second Triage:** Can an unfamiliar engineer identify the most urgent machine in under 3 seconds?
- [ ] **Numerical Authority:** Are all numbers prominent, tabular, formatted, and accompanied by unambiguous units?
- [ ] **Zero Decorative Clutter:** Has every non-functional gradient, arbitrary border, and decorative icon been eliminated?
- [ ] **Strict 3-Surface System:** Are all elements mapped strictly to Surface 1 (Base), Surface 2 (Structural Section), or Surface 3 (Interactive Component)?
- [ ] **Equal-Height Command Alignment:** Are all toolbar inputs, buttons, and popovers aligned on an exact 40px horizontal baseline?
- [ ] **Visual Separation of Incidents:** Are `ALARM` units isolated in their own high-priority zone rather than mixed uniformly in a grid?
- [ ] **Clean Information Boundary:** Is deep calibration data kept in Machine Detail rather than overflowing onto Fleet Overview?
- [ ] **High Confidence:** Does the interface communicate stability, safety, and mission-critical precision?

---
*LMS v2.0 Product Design Blueprint — Approved for Engineering Operating System Standards.*
