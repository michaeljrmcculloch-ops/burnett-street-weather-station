# Configuration Reference — Vintage UV Index

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | UV index sensor (e.g. `sensor.gw3000a_uv_index`) |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `max_uv` | | 12 | Scale maximum |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 1 | Decimal places on the readout |

Uses the standard international UV index color bands, so it reads the
same way as any other UV chart:

| UV Index | Band | Color |
|---|---|---|
| 0–2 | Low | Green |
| 3–5 | Moderate | Yellow |
| 6–7 | High | Orange |
| 8–10 | Very High | Red |
| 11+ | Extreme | Purple |
