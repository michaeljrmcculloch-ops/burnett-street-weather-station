# Changelog

All notable changes to Burnett Street Weather Station are documented here.
Versions follow the project roadmap, each named after a Beaufort-style
weather description.

## [Unreleased]

## [0.5.0] "Station Keeper" — Complete
### Added
- Station Keeper: a prose "logbook" entry sent twice a day (07:00 dawn
  watch, 18:00 evening watch) describing the weather in plain language —
  temperature, wind, rain and pressure trend, each picked from a bank of
  phrases for variety. Entirely rule-based Jinja templating against live
  sensor states: no internet dependency and no external LLM call.
  Replaces the old numeric 8:30am daily review.
### Fixed
- Standardised every alert automation on `chat_id:` (the field confirmed
  correct via Home Assistant's own Developer Tools → Actions UI) instead
  of the untested `target:` field some automations had been using —
  removes a silent-failure risk where an alert could simply never send.
### Changed
- `automations/alerts.yaml` now has 15 automations (was 14): the 8:30am
  daily review is replaced by the two Station Keeper entries above.

## [0.4.0] "Frost" — Complete
### Added
- Records card: ledger-style table of all-time / this-month / this-week
  highest temperature, lowest temperature, highest gust and wettest day,
  each with the date the record was set
- 24 `input_number`/`input_datetime` helpers and 8 automations that keep
  the Records card's data up to date — see [`docs/records.md`](docs/records.md)
- Telegram weather alerts via a dedicated bot (separate from any existing
  house-automation bot): frost and hard frost warnings, high wind with an
  all-clear once gusts ease off, a notification on any new all-time
  record, a 3-hourly pressure-drop check, station offline/back-online,
  low battery, an 8:30am daily review, and a `/report` command for an
  on-demand live snapshot — see [`automations/alerts.yaml`](automations/alerts.yaml)
  (superseded in 0.5.0, see below), helpers in
  [`helpers/alerts.yaml`](helpers/alerts.yaml)
- Bundled `dist/burnett-vintage-weather-station.js` now includes all
  nine cards

## [0.3.0] "Showers" — Complete
### Added
- Animated SVG rain gauge (graduated tube for daily total, rate
  readout with plain-English intensity label from Dry to Torrential)
- Animated SVG UV index gauge with standard international color bands
  (green/yellow/orange/red/purple)
- Animated SVG solar radiation gauge with subtle decorative sunburst
- Dual theme support, tap-to-history, shadow DOM isolation across all
  three new gauges

## [0.2.0] "Breeze" — Complete
### Added
- Animated SVG thermometer (vertical mercury tube)
- Mercury color shifts from steel-blue (cold) to red (warm)
- Brass daily-high marker, reading Home Assistant's own history —
  updates instantly when a new high is set, reconciles against the
  full window every 10 minutes
- Animated SVG hygrometer (round dial, antique Dry/Fresh/Comfortable/
  Humid/Damp zone labels instead of numbers)
- Animated SVG wind compass — single-arrowhead weathervane style arrow
  rotates over a fixed compass rose, with speed/gust text readout
- Animated SVG wind speed gauge with peak-gust needle (reads history,
  same instant-rise + periodic-reconcile pattern as the daily high
  marker), fully configurable unit system (mph, km/h, or any label)
- Dual theme support, tap-to-history, shadow DOM style isolation
  across all four new gauges

## [0.1.0] "Fair" — Complete
### Added
- Animated SVG barometer with damped needle movement
- Pressure trend indicator (rising / falling / steady)
- Configurable station plaque (name, subtitle, established year)
- Brass/Oak theme
- Tap-to-open pressure history popup
- Responsive layout, Raspberry Pi friendly rendering
- Ghost needle showing pressure from N hours ago (default 5), read
  directly from Home Assistant's own history — no extra sensor needed
