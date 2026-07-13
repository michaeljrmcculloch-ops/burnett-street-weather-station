# Burnett Street Weather Station

*A vintage weather station for Home Assistant.*

A premium, vintage-inspired Home Assistant weather dashboard with
authentic mechanical instrument styling — brass, oak, glass, and
mechanical needle movement, built as modular SVG custom cards.

## Status

🚧 **v0.1 "Fair"** — animated SVG barometer, in progress.
See [`CHANGELOG.md`](CHANGELOG.md) for the full roadmap.

## What's in this release

- Live animated needle (damped, eases into position)
- Antique brass-and-cream dial, drawn entirely in SVG
- Automatic weather text (Stormy → Rain → Change → Fair → Set Fair)
- Pressure trend arrow via an optional trend sensor
- Tap the dial to open Home Assistant's built-in history graph
- Configurable plaque (station name), independent of the project name
- Two themes: `classic_oak` and `observatory`

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
