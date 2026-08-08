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
| `show_ghost_needle` | | true | Show a second, fainter needle marking the pressure from `ghost_hours` ago |
| `ghost_hours` | | 5 | How many hours back the ghost needle looks |

### About the ghost needle

The ghost needle doesn't need a second sensor — it asks Home Assistant's
own history (the same data behind the built-in history graph) for this
entity's value from `ghost_hours` ago, and draws a fainter needle there.
This requires the `recorder` integration to be enabled for your pressure
entity (it is by default in Home Assistant) and needs at least
`ghost_hours` of history to have built up before it will appear.
