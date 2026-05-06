# Changelog

All notable changes to Inter Vertebra are documented here. The format is
loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to semantic versioning.

## [0.1.0] — 2026-05-06

MVP release.

### Added
- Vite + React SPA scaffold, deployable to Vercel under `/intervertebra/`.
- IndexedDB persistence layer (`patients`, `items`, `procedures`, `meta`)
  via the `idb` library.
- Seed data: 22-item ERAS bundle for lumbar fusion (ERAS Society consensus,
  Debono et al. 2021), four default procedure types.
- Patient list page with surgeon / procedure / phase / date-range filters
  and sortable columns.
- Patient detail page: editable metadata, accordion checklist by phase,
  per-item status (Yes / No / N/A / Pending) with optional comment,
  optimistic save on every change, keyboard shortcuts (1–4 to set status,
  arrow keys to navigate items), HKID-pattern guard on the case-number
  field, persistent privacy banner.
- Dashboard: summary cards, compliance rate per item (sorted ascending),
  per surgeon, and mean compliance per month, with date / surgeon /
  procedure filters.
- Settings: edit / disable / reorder / add ERAS items, manage procedure
  types, JSON export & import (full backup), CSV exports in wide and long
  formats, reset-all-data with double confirmation.
- About page with bundle source citation, compliance-rate definition,
  privacy statement, and disclaimer.
- Installable PWA with offline support via `vite-plugin-pwa`.
