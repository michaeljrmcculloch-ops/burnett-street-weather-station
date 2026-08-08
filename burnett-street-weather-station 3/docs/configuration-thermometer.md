# Configuration Reference — Vintage Thermometer

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | Temperature sensor entity (e.g. `sensor.gw3000a_outdoor_temperature`) |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `min_temp` | | -10 | Scale minimum |
| `max_temp` | | 40 | Scale maximum |
| `unit` | | °C | Unit label shown under the tube |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 1 | Decimal places on the readout |
| `show_daily_high` | | true | Show a brass marker at the highest reading in `high_window_hours` |
| `high_window_hours` | | 24 | How many hours back the high marker looks |

### About the mercury color

The mercury column blends from a cool steel-blue at `min_temp` to a warm
red at `max_temp`, so the column's own color gives an at-a-glance sense
of "cold" vs "warm" independent of the numeric readout.

### About the daily high marker

Like the barometer's ghost needle, this reads Home Assistant's own
history rather than needing a separate sensor. It updates two ways:

- **Instantly**, whenever the live reading itself becomes the new
  highest of the window — no history lookup needed for that.
- **Periodically** (every 10 minutes), by re-checking history, so the
  marker correctly steps back down once an old peak ages out of the
  `high_window_hours` window.

Requires the `recorder` integration enabled for the entity (on by
default) and needs history to have built up before it will appear.
