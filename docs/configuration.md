# Configuration Reference — Vintage Barometer

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | Pressure sensor entity (e.g. `sensor.gw3000a_relative_pressure`) |
| `trend_entity` | | — | Optional sensor giving `rising` / `falling` / `steady` |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `min_pressure` | | 950 | Dial minimum (hPa) |
| `max_pressure` | | 1050 | Dial maximum (hPa) |
| `unit` | | hPa | Unit label shown under the dial |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 1 | Decimal places on the readout |
