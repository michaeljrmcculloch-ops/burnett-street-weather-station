# Configuration Reference — Vintage Hygrometer

| Option | Required | Default | Description |
|---|:---:|---|---|
| `entity` | ✅ | — | Humidity sensor, 0–100% (e.g. `sensor.gw3000a_humidity`) |
| `name` | | Burnett Street | Station plaque name |
| `subtitle` | | Weather Station | Plaque subtitle |
| `established` | | 2026 | Plaque established year |
| `unit` | | % | Unit label |
| `theme` | | classic_oak | `classic_oak` or `observatory` |
| `decimals` | | 0 | Decimal places on the readout |

The dial uses antique zone labels (Dry / Fresh / Comfortable / Humid /
Damp) instead of numbers, matching traditional hygrometer faces. The
zone text under the readout updates automatically based on the current
reading:

| Range | Zone |
|---|---|
| 0–29% | Dry |
| 30–44% | Fresh |
| 45–59% | Comfortable |
| 60–74% | Humid |
| 75–100% | Damp |
