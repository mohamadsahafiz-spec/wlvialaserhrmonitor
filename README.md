# Laser Management System (Version 1.0)

A modular, production-grade SCADA laser operating hour tracking, remaining lifetime estimator, and recalibration management system built for semiconductor wafer drilling machines (BMD302W / BMD250WM).

---

## 🚀 Overview

The **Laser Management System Version 1.0** provides semiconductor process engineers, SCADA operators, and field technicians with a lightweight, reliable web application for monitoring laser diode operating hours, predicting remaining lifetime, executing recalibrations against physical meter readings, and maintaining audit logs.

### Key Capabilities

1. **Laser Hour Calculation Engine (`laserEngine.js`)**:
   - Computes continuous laser operating hours dynamically from physical machine meter baselines and elapsed wall-clock time.
   - Calculates remaining lifetime hours, days-to-warning, and days-to-alarm under continuous 24/7 operating assumptions.
   - Evaluates machine health consumption percentage against rated limits (e.g. 25,000 hrs).

2. **Recalibration & Confidence Center (`recalibration.js`)**:
   - Calculates deviation between estimated laser hours and actual physical meter readings observed during preventive maintenance.
   - Evaluates deviation accuracy ratings:
     - **0–10 hrs**: ★★★★★ Excellent
     - **11–25 hrs**: ★★★★☆ Very Good
     - **26–50 hrs**: ★★★☆☆ Good
     - **51–100 hrs**: ★★☆☆☆ Fair
     - **>100 hrs**: ★☆☆☆☆ Poor
   - Generates confidence levels (HIGH, MEDIUM, LOW) based on days elapsed since the last physical recalibration.

3. **Fleet Overview & Analytics (`dashboard.js`)**:
   - Real-time fleet health stats summary (total fleet count, safe/warning/alarm distribution, average fleet health %, total accumulated hours).
   - Dynamic multi-column searching, filtering (by status, model, department), and multi-criteria sorting.
   - Single-machine dashboard with visual lifetime gauges, maintenance logs, and audit trails.

4. **Access Control & Persistence (`storage.js` & `ui.js`)**:
   - **Engineer Mode vs Customer Mode**: Toggleable access modes protected by engineer password authentication.
   - **Persistence**: Machine records, system parameters, and maintenance histories are persisted in browser `localStorage` with fallback seed generation.
   - **Backup & Reporting**: Export reports to CSV/JSON format, restore fleet backups, and generate print-ready summaries.

5. **Cross-Platform PWA Support (`manifest.json` & Responsive CSS)**:
   - Full Progressive Web App (PWA) manifest support for installation on Android, iOS Web Clips, macOS, Windows, and Linux.
   - Touch-optimized 44px minimum touch targets and Apple iOS notch safe-area (`viewport-fit=cover`) integration.
   - Responsive multi-device layout scaling across mobile phones, tablets, laptops, MacBooks, and widescreen PC displays.

---

## 📁 System Architecture

```
LaserManagementSystem/
├── index.html              # Fleet Overview Dashboard
├── machine.html            # Machine Profile, Gauges & Audit History
├── settings.html           # System Configuration & Fleet Backup
├── manifest.json           # Web App Manifest (PWA)
├── icon.svg                # Vector SVG App Icon
├── icon-192.svg            # 192x192 PWA Icon
├── icon-512.svg            # 512x512 PWA Icon
├── css/
│   ├── style.css           # Base Reset, Variables, Glassmorphism & Layout
│   ├── dashboard.css       # System Panels, Statistics Grid & Controls
│   ├── cards.css           # Fleet Cards, Badges & Mini-Gauges
│   ├── animations.css      # Status LED Glows, Blinks, Modals & Toast System
│   └── responsive.css      # Multi-Device (Mobile, Tablet, Laptop, PC, iOS, Android) & Print CSS
├── js/
│   ├── app.js              # Main Controller & Route Initializer
│   ├── dashboard.js        # Fleet Overview & Multi-Criteria Filtering
│   ├── machine.js          # Machine Profile Controller & Audit Logger
│   ├── laserEngine.js      # Core Calculation Engine (Pure Functional Logic)
│   ├── recalibration.js    # Recalibration Workflow & Deviation Analysis
│   ├── storage.js          # Persistence & Seed Synchronization Layer
│   ├── charts.js           # Progress Bar & Health Fill Visualizer
│   ├── ui.js               # Theme Manager, Toast Notifications & CSV Exporter
│   └── utils.js            # Date/Time Helpers, URL Query & Number Formatting
├── data/
│   ├── machines.json       # Fleet Seed Machine Records
│   └── settings.json       # System Default Settings & SCADA Parameters
├── README.md               # System Overview & Architecture Manual
├── PROJECT_RULES.md        # Architectural Principles & Engineering Rules
├── CHANGELOG.md            # Version Release Notes & Audit History
├── package.json            # Application Manifest & Express Web Server Config
└── server.js               # Cloud Run / Container Static Express Server
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)

### Development Server
Run the local Express development server on port 3000:
```bash
npm start
```
Open `http://localhost:3000` in your web browser.

---

## 🛠️ Validation & Software Audit Summary

A comprehensive software audit was conducted for **Version 1.0**:

- ✅ **HTML**: Valid HTML5 structure across `index.html`, `machine.html`, and `settings.html`.
- ✅ **CSS**: CSS custom properties with light/dark glassmorphism, responsive grid layouts, and print stylesheets.
- ✅ **JavaScript & ES6 Modules**: Clean ES6 module dependencies with single-responsibility imports.
- ✅ **Navigation**: Route parameters (`?id=...`) and view toggling seamlessly supported across views.
- ✅ **Calculations**: All mathematical formulas isolated exclusively in `laserEngine.js`.
- ✅ **Storage**: Managed by `StorageService` with fallback seeds and normalization.
- ✅ **Performance**: Silent 1-second DOM updates without redrawing full DOM trees.
- ✅ **Accessibility**: Proper ARIA roles, high contrast ratios, and keyboard navigation.
- ✅ **Dark/Light Theme**: Instant custom property theme switching with persisted preferences.
- ✅ **Zero Duplication**: Dead root scripts removed, single-source IDs verified.
