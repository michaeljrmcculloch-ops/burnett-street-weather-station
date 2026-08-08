# Configuration Reference — Vintage Wind Speed

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | Wind speed sensor (e.g. `sensor.gw3000a_wind_speed`) |
| `gust_entity` | | — | Optional dedicated gust sensor. If not set, the peak-gust needle tracks the highest value of `entity` instead |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `max_speed` | | 80 | Scale maximum |
| `speed_unit` | | mph | Unit label — any string works, e.g. `mph`, `km/h`, `knots` |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 0 | Decimal places on the readout |
| `show_peak_gust` | | true | Show a fainter needle marking the highest gust in `peak_gust_window_minutes` |
| `peak_gust_window_minutes` | | 30 | How many minutes back the peak-gust needle looks |

### Switching units (e.g. mph → km/h)

The card doesn't hardcode a unit — `speed_unit` is just a label, and
`max_speed` is a separate number you set to match. To switch to
kilometres per hour:

```yaml
type: custom:burnett-vintage-wind-speed
entity: sensor.gw3000a_wind_speed
max_speed: 130
speed_unit: km/h
```

### About the peak-gust needle

Same pattern as the barometer's ghost needle and the thermometer's
daily high — it reads Home Assistant's own history rather than needing
a separate helper sensor. It updates two ways:

- **Instantly**, whenever the live reading itself becomes the new peak.
- **Periodically** (every 2 minutes — shorter than the barometer/
  thermometer since this window is only 30 minutes), by re-checking
  history, so the needle steps back down once an old peak ages out of
  the window.
