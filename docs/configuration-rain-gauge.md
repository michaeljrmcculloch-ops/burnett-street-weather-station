# Configuration Reference — Vintage Rain Gauge

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | Daily rainfall total sensor (e.g. `sensor.gw3000a_daily_rain`) |
| `rate_entity` | | — | Optional current rain-rate sensor, shown as text below the tube |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `max_daily` | | 50 | Scale maximum on the tube |
| `unit` | | mm | Unit label |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 1 | Decimal places on the readout |

The tube fills like a graduated rain-collection cylinder, tracking the
day's accumulated total. If `rate_entity` is set, the current rate is
shown with a plain-English intensity label:

| Rate (mm/h) | Intensity |
|---|---|
| 0 | Dry |
| < 0.5 | Drizzle |
| < 4 | Light |
| < 8 | Moderate |
| < 30 | Heavy |
| ≥ 30 | Torrential |
