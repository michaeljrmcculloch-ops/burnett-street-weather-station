# Records card setup

The Records card (`custom:burnett-vintage-records`) is a ledger-style
table showing the highest temperature, lowest temperature, highest
gust and wettest day for three periods: all-time, this month, and
this week — each with the date it was set.

Unlike the other eight cards, this one doesn't read a live sensor
directly. It reads a set of `input_number` / `input_datetime` helpers,
and eight automations keep those helpers up to date. This keeps the
card itself simple and means the record history survives a card
config change or a Home Assistant restart (the helpers persist in the
`.storage` the same way any other entity does).

## 1. Create the helpers

Merge [`helpers/records.yaml`](../helpers/records.yaml) into your
`configuration.yaml`, or add it as its own file under `packages/` if
you use packages (recommended — keeps the 24 helpers self-contained).
Restart Home Assistant (or reload YAML) afterwards.

## 2. Add the automations

Merge [`automations/records.yaml`](../automations/records.yaml) into
your `automations.yaml`, or paste each automation in individually via
Settings → Automations → Create Automation → Edit in YAML.

The eight automations are:

1. **Update All-Time Highs** — raises the all-time temperature-high,
   gust and rainfall records whenever a live reading beats them.
2. **Update All-Time Low** — lowers the all-time low-temperature
   record whenever a live reading beats it.
3. **Update Month Highs** — same as #1, against this month's record.
4. **Update Month Low** — same as #2, against this month's record.
5. **Update Week Highs** — same as #1, against this week's record.
6. **Update Week Low** — same as #2, against this week's record.
7. **Reset Month** — at 00:00 on the 1st of the month, starts this
   month's records fresh from the current live readings (not zero —
   a reading of 0 would otherwise look like a record low).
8. **Reset Week** — at 00:00 every Monday, same idea for the week.

All eight assume these source sensors (adjust the automations if
yours are named differently):

- `sensor.gw3000a_outdoor_temperature` — for both the high and low
- `sensor.gw3000a_max_daily_gust` — the hardware's own daily peak gust
- `sensor.gw3000a_daily_rain` — today's rainfall total so far

## 3. Add the card

```yaml
type: custom:burnett-vintage-records
name: Burnett Street
subtitle: Weather Station
established: "2026"
theme: classic_oak
temp_unit: °C
wind_unit: km/h
rain_unit: mm
```

If you used the default helper names from `helpers/records.yaml`, no
further config is needed — the card derives all 24 entity ids from the
naming convention (`input_number.burnett_record_<metric>_<period>`
and `input_datetime.burnett_record_<metric>_<period>_date`). If you
renamed the prefix, set `entity_prefix:` to match, or override any
individual entity with `<metric>_<period>_entity:` /
`<metric>_<period>_date_entity:` (e.g.
`temp_high_alltime_entity: input_number.my_custom_name`).

## Notes

- The reset automations intentionally seed the new period from the
  *current* reading rather than 0, so the first entry of a new month
  or week isn't a false record.
- `sensor.gw3000a_max_daily_gust` resets itself at local midnight on
  the hardware side, which is why it's a better source for gust
  records than the 30-minute `sensor.gw3000a_wind_gust` used by the
  Wind Speed card.
