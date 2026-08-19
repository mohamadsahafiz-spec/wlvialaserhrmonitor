# Changelog

All notable changes to the Laser Management System project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-29

### Added
- **Web App Manifest & Cross-Platform Support**:
  - Created `/manifest.json` PWA configuration for Android, Apple iOS Web Clips, macOS, Windows, and Linux.
  - Added high-resolution vector SVG app icons (`icon.svg`, `icon-192.svg`, `icon-512.svg`).
  - Added Apple mobile Web App meta tags (`apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`).
  - Implemented iOS safe-area inset integration (`viewport-fit=cover`) and 44px touch target sizes for mobile screens.
- **UI/UX Refinement Pass**:
  - Removed unused right-side whitespace and expanded container width for widescreen displays (1920×1080 and above).
  - Prominent Fleet Overview KPI statistics grid with expanded cards and bold typography hierarchy.
  - Professional top navigation bar with SVG icons replacing hyperlink-style navigation.
  - Standardized machine card dimensions (equal width and height across fleet grid).
  - Expanded mini health track width for better visual clarity.
  - Improved search and filter toolbar alignment and spacing.
  - Updated system branding and titles from legacy names to **Laser Management System**.
- **Full Software Audit & Verification**: Complete architectural audit covering HTML, CSS, JavaScript, ES6 Modules, Navigation, Calculations, Storage, Performance, Responsive Layout, Accessibility, Dark/Light Themes, Animations, Memory Usage, and ID Uniqueness.
- **Dedicated Documentation Suite**: Added `README.md`, `PROJECT_RULES.md`, and `CHANGELOG.md`.
- **Engineer & Customer Access Modes**: Integrated password-protected Engineer Mode (`default: 1234`) restricting modal edits, machine additions, recalibration, and deletion to authorized personnel.
- **Fleet Statistics Summary Panel**: Added high-level fleet overview metrics displaying total fleet count, safe/warning/alarm status breakdown, average fleet health %, and total fleet operating hours.
- **Multi-Criteria Fleet Sorting & Filtering**: Enabled sorting by machine number, laser operating hours, remaining hours, health %, status urgency, and recalibration date.
- **Recalibration & Deviation Analysis Modal**: Introduced structured deviation rating feedback (★★★★★ Excellent to ★☆☆☆☆ Poor) with automatic drift warnings for unexpected meter deviations.
- **Toast Notification System**: Added non-intrusive toast alerts for system events, settings saves, theme changes, exports, and mode unlocks.
- **JSON Fleet Backup & Import**: Added full fleet data backup export and import functionality in System Settings.

### Changed
- **Modular ES6 Architecture**: Refactored monolithic scripts into clean ES6 modules (`laserEngine.js`, `storage.js`, `dashboard.js`, `machine.js`, `recalibration.js`, `charts.js`, `ui.js`, `utils.js`).
- **Real-time Live Refresh**: Optimized 1-second live counter refreshes to perform in-place DOM updates without re-rendering card trees, eliminating flicker and DOM churn.

### Removed
- **Dead Code Cleanup**: Removed legacy un-modularized root files (`/app.js`, `/storage.js`, `/laserEngine.js`) to eliminate ambiguity and prevent duplicate script execution.
- **Duplicated Calculations**: Standardized all calculation logic exclusively within `LaserEngine`.

### Fixed
- Fixed missing `lint` script in `package.json` to enable automated lint verification.
- Ensured strict unique HTML element IDs across all template files (`index.html`, `machine.html`, `settings.html`).
