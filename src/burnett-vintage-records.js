/**
 * Burnett Street Weather Station — Vintage Records Card
 * -----------------------------------------------------------
 * A hand-drawn ledger-style records card for Home Assistant, showing
 * all-time / this-month / this-week highs (and the lowest temperature)
 * with the date each record was set.
 *
 * This card only DISPLAYS the records — it reads them from input_number
 * helpers (value) and input_datetime helpers (date achieved). Keeping
 * those helpers up to date is the job of the eight automations in
 * automations/records.yaml. See docs/records.md for full setup.
 * Milestone: v0.4 "Frost"
 *
 * Config example:
 * type: custom:burnett-vintage-records
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * theme: classic_oak       # or "observatory"
 * temp_unit: °C
 * wind_unit: km/h
 * rain_unit: mm
 * entity_prefix: burnett_record   # optional — changes every default entity id below
 *
 * By default this card expects the following helpers to exist (the
 * install docs walk through creating them):
 *   input_number.burnett_record_temp_high_alltime  (+ _month, _week)
 *   input_number.burnett_record_temp_low_alltime   (+ _month, _week)
 *   input_number.burnett_record_wind_gust_alltime  (+ _month, _week)
 *   input_number.burnett_record_rainfall_alltime   (+ _month, _week)
 *   input_datetime.<same name>_date                for each of the above
 */

class BurnettVintageRecords extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  // The four tracked metrics. `better` says which direction counts as
  // a new record — "higher" for everything except the low temperature.
  static METRICS = [
    { key: "temp_high", label: "Highest Temperature", unitType: "temp", better: "higher" },
    { key: "temp_low", label: "Lowest Temperature", unitType: "temp", better: "lower" },
    { key: "wind_gust", label: "Highest Gust", unitType: "wind", better: "higher" },
    { key: "rainfall", label: "Wettest Day", unitType: "rain", better: "higher" },
  ];

  static PERIODS = [
    { key: "alltime", label: "All-Time" },
    { key: "month", label: "This Month" },
    { key: "week", label: "This Week" },
  ];

  setConfig(config) {
    this._config = {
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      temp_unit: "°C",
      wind_unit: "km/h",
      rain_unit: "mm",
      entity_prefix: "burnett_record",
      decimals: 1,
      ...config,
    };

    // Build the full entity map once: for every metric x period we need
    // a value entity (input_number) and a date entity (input_datetime),
    // using the naming convention unless the card config overrides it.
    this._entities = {};
    for (const metric of BurnettVintageRecords.METRICS) {
      for (const period of BurnettVintageRecords.PERIODS) {
        const base = `${metric.key}_${period.key}`;
        const valueKey = `${base}_entity`;
        const dateKey = `${base}_date_entity`;
        this._entities[`${base}_value`] =
          config[valueKey] || `input_number.${this._config.entity_prefix}_${base}`;
        this._entities[`${base}_date`] =
          config[dateKey] || `input_datetime.${this._config.entity_prefix}_${base}_date`;
      }
    }

    this._render();
  }

  set hass(hass) {
    this._hass = hass;

    for (const metric of BurnettVintageRecords.METRICS) {
      for (const period of BurnettVintageRecords.PERIODS) {
        const base = `${metric.key}_${period.key}`;
        const valueState = hass.states[this._entities[`${base}_value`]];
        const dateState = hass.states[this._entities[`${base}_date`]];

        const valueCell = this.shadowRoot.querySelector(`#${base}-value`);
        const dateCell = this.shadowRoot.querySelector(`#${base}-date`);

        if (valueCell) {
          if (valueState && valueState.state !== "unknown" && valueState.state !== "unavailable") {
            const num = parseFloat(valueState.state);
            valueCell.textContent = isNaN(num)
              ? "—"
              : `${num.toFixed(this._config.decimals)}${this._unitFor(metric.unitType)}`;
          } else {
            valueCell.textContent = "—";
          }
        }

        if (dateCell) {
          dateCell.textContent = this._formatDate(dateState);
        }
      }
    }
  }

  _unitFor(unitType) {
    if (unitType === "temp") return this._config.temp_unit;
    if (unitType === "wind") return ` ${this._config.wind_unit}`;
    if (unitType === "rain") return ` ${this._config.rain_unit}`;
    return "";
  }

  // input_datetime helpers report either "YYYY-MM-DD" (date-only) or
  // "YYYY-MM-DD HH:MM:SS" — we only ever show the date, ledger-style.
  _formatDate(dateState) {
    if (!dateState || !dateState.state || dateState.state === "unknown" || dateState.state === "unavailable") {
      return "—";
    }
    const datePart = dateState.state.split(" ")[0];
    const parsed = new Date(`${datePart}T00:00:00`);
    if (isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  _render() {
    const isDark = this._config.theme === "observatory";
    const page = isDark ? "#1b1f24" : "#f4ecd8";
    const rule = isDark ? "#4a4030" : "#c9b892";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    const headText = isDark ? "#e8dcb0" : "#5a4222";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          display: block;
          background: ${isDark ? "#0f1216" : "#fffaf0"};
          border-radius: 16px;
          padding: 16px;
          font-family: Georgia, 'Times New Roman', serif;
          text-align: center;
        }
        .plaque { color: ${text}; font-size: 1.1em; letter-spacing: 1px; margin-bottom: 4px; }
        .plaque .subtitle { font-size: 0.7em; opacity: 0.75; display: block; }
        .ledger {
          margin-top: 10px;
          border: 3px solid ${rim};
          border-radius: 6px;
          background: ${page};
          box-shadow: inset 0 0 0 1px ${isDark ? "#000" : "#fff"};
          overflow: hidden;
        }
        .ledger-title {
          font-style: italic;
          font-size: 0.85em;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: ${headText};
          padding: 8px 0 4px;
          border-bottom: 1px solid ${rule};
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82em;
        }
        th, td {
          padding: 6px 4px;
          border-bottom: 1px solid ${rule};
        }
        thead th {
          color: ${headText};
          font-weight: normal;
          font-style: italic;
          font-size: 0.85em;
          border-bottom: 1px solid ${rim};
        }
        tbody th {
          text-align: left;
          padding-left: 10px;
          color: ${text};
          font-weight: normal;
          white-space: nowrap;
        }
        td {
          color: ${text};
        }
        .value {
          font-size: 1.05em;
          display: block;
        }
        .date {
          font-size: 0.72em;
          opacity: 0.65;
          font-style: italic;
          display: block;
          margin-top: 1px;
        }
        tr:last-child th, tr:last-child td { border-bottom: none; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="ledger">
          <div class="ledger-title">Weather Records</div>
          <table>
            <thead>
              <tr>
                <th></th>
                ${BurnettVintageRecords.PERIODS.map((p) => `<th>${p.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${BurnettVintageRecords.METRICS.map(
                (metric) => `
                <tr>
                  <th>${metric.label}</th>
                  ${BurnettVintageRecords.PERIODS.map((period) => {
                    const base = `${metric.key}_${period.key}`;
                    return `
                    <td>
                      <span class="value" id="${base}-value">--</span>
                      <span class="date" id="${base}-date">—</span>
                    </td>
                  `;
                  }).join("")}
                </tr>
              `
              ).join("")}
            </tbody>
          </table>
        </div>
      </ha-card>
    `;
  }

  getCardSize() {
    return 6;
  }
}

customElements.define("burnett-vintage-records", BurnettVintageRecords);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-records",
  name: "Burnett Vintage Records",
  description: "A ledger-style records card showing all-time/month/week weather highs and lows.",
});
