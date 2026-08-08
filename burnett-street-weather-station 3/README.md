# Burnett Street Weather Station

*A vintage weather station for Home Assistant.*

A premium, vintage-inspired Home Assistant weather dashboard with
authentic mechanical instrument styling — brass, oak, glass, and
mechanical needle movement, built as modular SVG custom cards.

## Status

🚧 **v0.3 "Showers"** — rain gauge, UV index, and solar radiation
gauges added alongside the v0.1/v0.2 instruments. Eight gauges total.
See [`CHANGELOG.md`](CHANGELOG.md) for the full roadmap.

## What's in this release

**Barometer**
- Live animated needle (damped, eases into position)
- Antique brass-and-cream dial, drawn entirely in SVG
- Automatic weather text (Stormy → Rain → Change → Fair → Set Fair)
- Ghost needle showing pressure from 5 hours ago (configurable),
  read directly from Home Assistant's history — no extra sensor needed
- Color-coded pressure trend (rising/falling/steady)

**Thermometer**
- Vertical mercury-tube style, color shifts blue (cold) → red (warm)
- Brass daily-high marker (configurable window), instant-rise +
  periodic history reconciliation

**Hygrometer**
- Round dial with antique Dry/Fresh/Comfortable/Humid/Damp zone labels

**Wind compass**
- Single-arrowhead weathervane style needle rotates over a fixed
  compass rose; speed and gust shown as text

**Wind speed**
- Numbered dial (any unit — mph, km/h, etc.) with a peak-gust needle
  using the same instant-rise history pattern as the thermometer

**Rain gauge**
- Graduated glass tube fills with today's accumulated total
- Plain-English rate intensity label (Dry → Drizzle → Light →
  Moderate → Heavy → Torrential)

**UV index**
- Standard international color bands (green/yellow/orange/red/purple)

**Solar radiation**
- Numbered dial with a subtle decorative sunburst accent

**All gauges**
- Tap the dial to open Home Assistant's built-in history graph
- Configurable plaque (station name), independent of the project name
- Two themes: `classic_oak` and `observatory`
- Shadow DOM style isolation — safe to place multiple gauges together

## Quick start

See [`docs/installation.md`](docs/installation.md) to install, and
[`docs/configuration.md`](docs/configuration.md) for every option.
A ready-to-paste example is in [`examples/dashboard.yaml`](examples/dashboard.yaml).

## Repository structure

```
docs/        Guides and reference documentation
src/         The custom card source code
assets/      Images, icons, screenshots
themes/      Theme definitions (classic_oak, observatory, ...)
examples/    Ready-to-use Home Assistant dashboard configs
```

## License

MIT — see [`LICENSE`](LICENSE).
