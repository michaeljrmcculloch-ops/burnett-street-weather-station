# Configuration Reference — Vintage Wind Compass

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | Wind direction sensor, in degrees 0–360 (e.g. `sensor.gw3000a_wind_direction`) |
| `speed_entity` | | — | Optional wind speed sensor, shown as text below the compass |
| `gust_entity` | | — | Optional gust sensor, shown as a second line below the speed |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `speed_unit` | | mph | Unit label shown next to speed/gust |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 0 | Decimal places on speed/gust readouts |

The arrow is a classic single-head weathervane shape (arrowhead + tail
fin) that rotates to point into the wind direction, while the compass
rose beneath it stays fixed — the same way a real weathervane works.
