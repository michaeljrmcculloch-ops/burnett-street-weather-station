# Installation

## Manual install (works today, before HACS release)

1. Copy `src/burnett-vintage-barometer.js` into your Home Assistant
   `config/www/burnett-street-weather-station/` folder.
   - If the `www` folder doesn't exist yet, create it inside your HA
     config directory.
2. In Home Assistant: **Settings → Dashboards → Resources** (⋮ menu, top right)
   → **Add Resource**:
   - URL: `/local/burnett-street-weather-station/burnett-vintage-barometer.js`
   - Resource type: **JavaScript Module**
3. Reload the browser tab (hard refresh if it doesn't show up).
4. Add the card to a dashboard — see `examples/dashboard.yaml` for a
   ready-to-paste example.

## HACS install (once published, v1.0 "Observatory")

Once this repository is added as a HACS custom repository, install will
be: HACS → Frontend → search "Burnett Street Weather Station" → Install
→ add the resource automatically → restart HA.
