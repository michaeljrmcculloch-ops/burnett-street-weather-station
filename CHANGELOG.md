# Changelog

All notable changes to Burnett Street Weather Station are documented here.
Versions follow the project roadmap, each named after a Beaufort-style
weather description.

## [Unreleased]

## [0.2.0] "Breeze" — In Progress
### Added
- Animated SVG thermometer (vertical mercury tube)
- Mercury color shifts from steel-blue (cold) to red (warm)
- Brass daily-high marker, reading Home Assistant's own history —
  updates instantly when a new high is set, reconciles against the
  full window every 10 minutes
- Dual theme support, tap-to-history, shadow DOM style isolation

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
