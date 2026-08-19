# Laser Management System - Project Rules

1. **Never redesign the UI without explicit instruction.**
   - Preserve the established Glassmorphism & Soft Industrial aesthetic across all views.
   - Maintain spacing, color palette, typography, and visual hierarchy.

2. **Never remove existing capabilities.**
   - All filters, confidence indicators, recalibration workflows, maintenance logs, export mechanisms, and access controls must remain fully operational.

3. **Preserve backward compatibility.**
   - Maintain data format compatibility with legacy `wafer_driller_fleet_v5` and `wafer_driller_settings_v5` storage keys.

4. **`laserEngine.js` is the only calculation engine.**
   - All operating hour estimations, remaining life calculations, accuracy tiers, health consumption percentages, and deviation ratings must be calculated strictly inside `laserEngine.js`.
   - UI views and DOM controllers must never re-implement mathematical logic.

5. **`storage.js` is the only storage layer.**
   - All read/write operations to persistent storage (`localStorage`) must pass through `StorageService`.

6. **UI controllers must remain pure presentation delegates.**
   - Controllers (`app.js`, `dashboard.js`, `machine.js`, `ui.js`) delegate math to `laserEngine.js` and storage to `storage.js`.

7. **Machine hour meter is always the source of truth.**
   - Physical machine meter readings provided during recalibration supersede estimations and establish a new baseline timestamp.

8. **Recalibration updates baseline hours and timestamps strictly.**
   - Recalibration adjusts `baseLaserHour`, `baseTimestamp`, and `lastRecalibrationDate` without modifying past maintenance logs.

9. **Zero duplicated element IDs or dead code.**
   - Ensure every DOM element ID is unique within its HTML scope.
   - Delete unused legacy script artifacts to maintain a lean, maintainable project directory.

10. **Keep the application lightweight and engineer-focused.**
    - Use standard ES6 modules and native browser capabilities without heavy build runtime overhead.
