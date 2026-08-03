# Changelog

All notable changes to Burnett Street Weather Station are documented here.
Versions follow the project roadmap, each named after a Beaufort-style
weather description.

## [Unreleased]

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
