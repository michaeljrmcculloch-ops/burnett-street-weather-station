# Installation

## Manual install (works today, before HACS release)

1. Copy `dist/burnett-vintage-weather-station.js` into your Home Assistant
   `config/www/burnett-street-weather-station/` folder.
   - If the `www` folder doesn't exist yet, create it inside your HA
     config directory.
   - This single file contains all eight instruments (barometer,
     thermometer, hygrometer, wind compass, wind speed, rain gauge,
     UV index, solar radiation) — you only need this one file, not
     the individual files under `src/`.
2. In Home Assistant: **Settings → Dashboards → Resources** (⋮ menu, top right)
   → **Add Resource**:
   - URL: `/local/burnett-street-weather-station/burnett-vintage-weather-station.js`
   - Resource type: **JavaScript Module**
3. Reload the browser tab (hard refresh if it doesn't show up).
4. Add the cards to a dashboard — see `examples/dashboard.yaml` for a
   ready-to-paste example covering all eight instruments.

## HACS install (custom repository, before v1.0 "Observatory")

1. In HACS: **⋮ menu → Custom repositories** → add this repository
   URL, category **Dashboard**.
2. Find "Burnett Street Weather Station" in HACS → Frontend → Install.
3. HACS downloads `dist/burnett-vintage-weather-station.js` and adds
   the Lovelace resource automatically.
4. Restart Home Assistant (or reload resources) and add the cards to
   a dashboard.

Once this project reaches v1.0, it will also be added to the official
HACS default store, removing the need for step 1.

## A note on `src/`

The `src/` folder holds the readable, one-file-per-instrument source
code — this is what you'd look at or edit if you want to understand
or customise how a gauge works. `dist/burnett-vintage-weather-station.js`
is the built file that combines all eight into the single resource
HA actually loads. If you edit anything in `src/`, the bundle needs
to be rebuilt before your changes take effect in Home Assistant.
