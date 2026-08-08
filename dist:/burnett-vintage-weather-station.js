/**
 * Burnett Street Weather Station
 * Bundled custom card resource — all instruments in one file.
 *
 * This file is auto-assembled from src/*.js — do not hand-edit here.
 * Edit the individual source files in src/ and rebuild the bundle.
 *
 * https://github.com/michaeljrmcculloch-ops/burnett-street-weather-station
 */

/* ---------- src/burnett-vintage-barometer.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Barometer Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique barometer for Home Assistant.
 * Milestone: v0.1 "Fair"
 *
 * Config example:
 * type: custom:burnett-vintage-barometer
 * entity: sensor.gw3000a_relative_pressure
 * trend_entity: sensor.burnett_pressure_trend   # optional
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * min_pressure: 950
 * max_pressure: 1050
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageBarometer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a pressure sensor).");
    }
    this._config = {
      min_pressure: 950,
      max_pressure: 1050,
      unit: "hPa",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 1,
      show_ghost_needle: true,
      ghost_hours: 5,
      ...config,
    };
    this._needleAngle = null;
    this._ghostValue = null;
    this._lastGhostFetch = 0;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const value = parseFloat(stateObj.state);
    if (isNaN(value)) return;

    this._updateNeedle(value);
    this._updateTrend(hass);
    this._updateReadout(value);

    if (this._config.show_ghost_needle) {
      this._maybeFetchGhostValue();
    }
  }

  // Ask Home Assistant's own history for this entity's value from
  // `ghost_hours` ago, so we can draw a second "ghost" needle there.
  // Throttled to once every 10 minutes — no need to ask more often
  // than that for a 5-hour-old value.
  async _maybeFetchGhostValue() {
    const now = Date.now();
    if (now - this._lastGhostFetch < 10 * 60 * 1000) return;
    this._lastGhostFetch = now;

    const hoursAgo = this._config.ghost_hours;
    const since = new Date(now - hoursAgo * 60 * 60 * 1000).toISOString();

    try {
      const history = await this._hass.callApi(
        "GET",
        `history/period/${since}?filter_entity_id=${this._config.entity}&minimal_response`
      );
      const entries = history && history[0];
      if (!entries || !entries.length) return;

      // The first entry on/after "since" is the closest match to
      // "ghost_hours ago". Fall back to the earliest entry we got.
      const closest = entries[0];
      const value = parseFloat(closest.state);
      if (!isNaN(value)) {
        this._ghostValue = value;
        this._updateGhostNeedle(value);
      }
    } catch (err) {
      // History isn't available (e.g. recorder disabled, or entity too
      // new to have 5 hours of history yet) — just hide the ghost hand.
      console.warn("Burnett barometer: couldn't fetch ghost history", err);
    }
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const face = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        ha-card {
          display: block;
          background: ${isDark ? "#0f1216" : "#fffaf0"};
          border-radius: 16px;
          padding: 16px;
          font-family: Georgia, 'Times New Roman', serif;
          text-align: center;
        }
        .plaque {
          color: ${text};
          font-size: 1.1em;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .plaque .subtitle {
          font-size: 0.7em;
          opacity: 0.75;
          display: block;
        }
        .dial-wrap { cursor: pointer; }
        .needle {
          transform-origin: 100px 100px;
          transition: transform 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .ghost-needle {
          transform-origin: 100px 100px;
          transition: transform 2s ease-out;
          opacity: 0.45;
        }
        .ghost-label {
          color: ${text};
          font-size: 0.7em;
          opacity: 0.6;
          margin-top: 2px;
        }
        .readout {
          color: ${text};
          font-size: 1.4em;
          margin-top: 6px;
        }
        .trend { font-size: 0.9em; opacity: 0.8; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 200 200" width="100%" style="max-width:280px">
            <circle cx="100" cy="100" r="95" fill="${face}" stroke="${rim}" stroke-width="6"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1" opacity="0.5"/>
            ${this._drawTicks(text)}
            ${
              this._config.show_ghost_needle
                ? `<g class="ghost-needle" id="ghost-needle" style="display:none">
                     <line x1="100" y1="100" x2="100" y2="38" stroke="${text}" stroke-width="1.5" stroke-linecap="round"/>
                     <circle cx="100" cy="100" r="3" fill="${text}"/>
                   </g>`
                : ""
            }
            <g class="needle" id="needle">
              <line x1="100" y1="100" x2="100" y2="30" stroke="#8a1f1f" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="100" cy="100" r="5" fill="#8a1f1f"/>
            </g>
          </svg>
        </div>
        <div class="readout" id="readout">-- ${this._config.unit}</div>
        <div class="trend" id="trend"></div>
        ${
          this._config.show_ghost_needle
            ? `<div class="ghost-label" id="ghost-label"></div>`
            : ""
        }
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _drawTicks(color) {
    let ticks = "";
    const labels = ["Stormy", "Rain", "Change", "Fair", "Set Fair"];
    for (let i = 0; i <= 40; i++) {
      const angle = -120 + (i * 240) / 40;
      const rad = (angle * Math.PI) / 180;
      const long = i % 10 === 0;
      const r1 = long ? 68 : 74;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + 80 * Math.sin(rad);
      const y2 = 100 - 80 * Math.cos(rad);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${long ? 2 : 1}" opacity="${long ? 0.9 : 0.5}"/>`;
    }
    labels.forEach((label, i) => {
      const angle = -120 + (i * 240) / (labels.length - 1);
      const rad = (angle * Math.PI) / 180;
      const x = 100 + 55 * Math.sin(rad);
      const y = 100 - 55 * Math.cos(rad);
      ticks += `<text x="${x}" y="${y}" fill="${color}" font-size="7" text-anchor="middle">${label}</text>`;
    });
    return ticks;
  }

  _angleForValue(value) {
    const { min_pressure, max_pressure } = this._config;
    const clamped = Math.min(Math.max(value, min_pressure), max_pressure);
    const fraction = (clamped - min_pressure) / (max_pressure - min_pressure);
    return -120 + fraction * 240;
  }

  _updateNeedle(value) {
    const angle = this._angleForValue(value);
    const needle = this.shadowRoot.querySelector("#needle");
    if (needle) needle.style.transform = `rotate(${angle}deg)`;
  }

  _updateGhostNeedle(value) {
    const ghost = this.shadowRoot.querySelector("#ghost-needle");
    const label = this.shadowRoot.querySelector("#ghost-label");
    if (!ghost) return;
    const angle = this._angleForValue(value);
    ghost.style.display = "block";
    ghost.style.transform = `rotate(${angle}deg)`;
    if (label) {
      label.textContent = `${this._config.ghost_hours}h ago: ${value.toFixed(this._config.decimals)} ${this._config.unit}`;
    }
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = `${value.toFixed(this._config.decimals)} ${this._config.unit}`;
    }
  }

  _updateTrend(hass) {
    const trendEl = this.shadowRoot.querySelector("#trend");
    if (!trendEl || !this._config.trend_entity) return;
    const trendState = hass.states[this._config.trend_entity];
    if (!trendState) return;
    const val = trendState.state;
    if (val === "rising") {
      trendEl.textContent = "▲ Rising";
      trendEl.style.color = "#3a8a3a";
    } else if (val === "falling") {
      trendEl.textContent = "▼ Falling";
      trendEl.style.color = "#8a1f1f";
    } else {
      trendEl.textContent = "► Steady";
      trendEl.style.color = this._themeText;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-barometer", BurnettVintageBarometer);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-barometer",
  name: "Burnett Vintage Barometer",
  description: "An antique, animated SVG barometer for Home Assistant.",
});

/* ---------- src/burnett-vintage-thermometer.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Thermometer Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique mercury thermometer for Home Assistant.
 * Milestone: v0.2 "Breeze"
 *
 * Config example:
 * type: custom:burnett-vintage-thermometer
 * entity: sensor.gw3000a_outdoor_temperature
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * min_temp: -10
 * max_temp: 40
 * unit: °C
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageThermometer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a temperature sensor).");
    }
    this._config = {
      min_temp: -10,
      max_temp: 40,
      unit: "°C",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 1,
      show_daily_high: true,
      high_window_hours: 24,
      ...config,
    };
    this._dailyHigh = null;
    this._lastHighFetch = 0;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const value = parseFloat(stateObj.state);
    if (isNaN(value)) return;

    this._updateMercury(value);
    this._updateReadout(value);

    if (this._config.show_daily_high) {
      // If the live reading is itself the new high, we already know
      // that without asking history — jump the marker immediately.
      if (this._dailyHigh === null || value > this._dailyHigh) {
        this._dailyHigh = value;
        this._updateHighMarker(value);
      }
      // Still periodically reconcile with real history, so the marker
      // correctly steps back down once an old peak ages out of the window.
      this._maybeFetchDailyHigh();
    }
  }

  // Ask Home Assistant's history for the highest value this entity has
  // recorded in the last `high_window_hours`, and move the brass marker
  // to that point on the scale. Throttled to once every 10 minutes.
  async _maybeFetchDailyHigh() {
    const now = Date.now();
    if (now - this._lastHighFetch < 10 * 60 * 1000) return;
    this._lastHighFetch = now;

    const since = new Date(now - this._config.high_window_hours * 60 * 60 * 1000).toISOString();

    try {
      const history = await this._hass.callApi(
        "GET",
        `history/period/${since}?filter_entity_id=${this._config.entity}&minimal_response`
      );
      const entries = history && history[0];
      if (!entries || !entries.length) return;

      let max = -Infinity;
      for (const entry of entries) {
        const v = parseFloat(entry.state);
        if (!isNaN(v) && v > max) max = v;
      }
      if (max > -Infinity) {
        this._dailyHigh = max;
        this._updateHighMarker(max);
      }
    } catch (err) {
      console.warn("Burnett thermometer: couldn't fetch daily high", err);
    }
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const frame = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

    // The tube is drawn from y=170 (bulb) up to y=20 (top), 150px of travel.
    this._tubeTop = 20;
    this._tubeBottom = 170;

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
        .dial-wrap { cursor: pointer; }
        .mercury {
          transition: y 1.2s cubic-bezier(0.34, 1.2, 0.4, 1),
                      height 1.2s cubic-bezier(0.34, 1.2, 0.4, 1),
                      fill 1.2s ease-out;
        }
        .bulb { transition: fill 1.2s ease-out; }
        .high-marker {
          transition: transform 2s ease-out;
          opacity: 0.9;
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
        .high-label { color: ${text}; font-size: 0.7em; opacity: 0.6; margin-top: 2px; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 120 220" width="100%" style="max-width:140px">
            <!-- Frame / backboard -->
            <rect x="10" y="8" width="100" height="200" rx="10" fill="${frame}" stroke="${rim}" stroke-width="4"/>
            ${this._drawScale(text)}
            <!-- Glass tube outline -->
            <rect x="54" y="${this._tubeTop}" width="12" height="${this._tubeBottom - this._tubeTop}" rx="6" fill="none" stroke="${rim}" stroke-width="2"/>
            <!-- Mercury column -->
            <rect class="mercury" id="mercury" x="55" y="${this._tubeBottom}" width="10" height="0" fill="${rim}"/>
            <!-- Bulb -->
            <circle class="bulb" id="bulb" cx="60" cy="185" r="14" fill="${rim}" stroke="${rim}" stroke-width="2"/>
            <!-- Brass high-water marker -->
            ${
              this._config.show_daily_high
                ? `<g class="high-marker" id="high-marker" style="display:none">
                     <rect x="20" y="-2" width="30" height="4" rx="2" fill="#b08d57" stroke="#7a5f38" stroke-width="0.5"/>
                   </g>`
                : ""
            }
          </svg>
        </div>
        <div class="readout" id="readout">-- ${this._config.unit}</div>
        ${
          this._config.show_daily_high
            ? `<div class="high-label" id="high-label"></div>`
            : ""
        }
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _drawScale(color) {
    const { min_temp, max_temp } = this._config;
    const span = max_temp - min_temp;
    // Draw 5 evenly spaced tick labels from max (top) to min (bottom).
    let marks = "";
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = max_temp - (span * i) / steps;
      const y = this._tubeTop + ((this._tubeBottom - this._tubeTop) * i) / steps;
      marks += `<line x1="70" y1="${y}" x2="78" y2="${y}" stroke="${color}" stroke-width="1.5"/>`;
      marks += `<text x="82" y="${y + 3}" fill="${color}" font-size="8">${Math.round(value)}°</text>`;
    }
    return marks;
  }

  // Blend from a cold steel-blue toward a warm mercury-red as temperature
  // rises through the configured range, so the column's own color hints
  // at "cold" vs "warm" the way an old alcohol thermometer's dye can.
  _mercuryColor(fraction) {
    const cold = [58, 92, 138]; // steel blue
    const warm = [138, 31, 31]; // mercury red
    const r = Math.round(cold[0] + (warm[0] - cold[0]) * fraction);
    const g = Math.round(cold[1] + (warm[1] - cold[1]) * fraction);
    const b = Math.round(cold[2] + (warm[2] - cold[2]) * fraction);
    return `rgb(${r}, ${g}, ${b})`;
  }

  _updateMercury(value) {
    const { min_temp, max_temp } = this._config;
    const clamped = Math.min(Math.max(value, min_temp), max_temp);
    const fraction = (clamped - min_temp) / (max_temp - min_temp);
    const tubeHeight = this._tubeBottom - this._tubeTop;
    const columnHeight = fraction * tubeHeight;
    const color = this._mercuryColor(fraction);

    const mercury = this.shadowRoot.querySelector("#mercury");
    const bulb = this.shadowRoot.querySelector("#bulb");
    if (mercury) {
      mercury.setAttribute("y", this._tubeBottom - columnHeight);
      mercury.setAttribute("height", columnHeight);
      mercury.setAttribute("fill", color);
    }
    if (bulb) bulb.setAttribute("fill", color);
  }

  _updateHighMarker(value) {
    const marker = this.shadowRoot.querySelector("#high-marker");
    const label = this.shadowRoot.querySelector("#high-label");
    if (!marker) return;
    const { min_temp, max_temp } = this._config;
    const clamped = Math.min(Math.max(value, min_temp), max_temp);
    const fraction = (clamped - min_temp) / (max_temp - min_temp);
    const tubeHeight = this._tubeBottom - this._tubeTop;
    const y = this._tubeBottom - fraction * tubeHeight;
    marker.style.display = "block";
    marker.style.transform = `translateY(${y}px)`;
    if (label) {
      label.textContent = `${this._config.high_window_hours}h high: ${value.toFixed(this._config.decimals)} ${this._config.unit}`;
    }
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = `${value.toFixed(this._config.decimals)} ${this._config.unit}`;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-thermometer", BurnettVintageThermometer);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-thermometer",
  name: "Burnett Vintage Thermometer",
  description: "An antique, animated SVG mercury thermometer for Home Assistant.",
});

/* ---------- src/burnett-vintage-hygrometer.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Hygrometer Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique hygrometer for Home Assistant.
 * Milestone: v0.2 "Breeze"
 *
 * Config example:
 * type: custom:burnett-vintage-hygrometer
 * entity: sensor.gw3000a_humidity
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageHygrometer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a humidity sensor).");
    }
    this._config = {
      unit: "%",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 0,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const value = parseFloat(stateObj.state);
    if (isNaN(value)) return;

    this._updateNeedle(value);
    this._updateReadout(value);
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const face = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

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
        .dial-wrap { cursor: pointer; }
        .needle {
          transform-origin: 100px 100px;
          transition: transform 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
        .zone-label { font-size: 0.9em; opacity: 0.8; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 200 200" width="100%" style="max-width:280px">
            <circle cx="100" cy="100" r="95" fill="${face}" stroke="${rim}" stroke-width="6"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1" opacity="0.5"/>
            ${this._drawTicks(text)}
            <g class="needle" id="needle">
              <line x1="100" y1="100" x2="100" y2="30" stroke="#3a5f8a" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="100" cy="100" r="5" fill="#3a5f8a"/>
            </g>
          </svg>
        </div>
        <div class="readout" id="readout">-- ${this._config.unit}</div>
        <div class="zone-label" id="zone-label"></div>
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _drawTicks(color) {
    let ticks = "";
    // 0–100% across the same 240° sweep as the barometer, with
    // old-fashioned "Dry / Comfortable / Damp" zone labels instead
    // of numbers, matching antique hygrometer faces.
    const labels = ["Dry", "Fresh", "Comfortable", "Humid", "Damp"];
    for (let i = 0; i <= 40; i++) {
      const angle = -120 + (i * 240) / 40;
      const rad = (angle * Math.PI) / 180;
      const long = i % 10 === 0;
      const r1 = long ? 68 : 74;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + 80 * Math.sin(rad);
      const y2 = 100 - 80 * Math.cos(rad);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${long ? 2 : 1}" opacity="${long ? 0.9 : 0.5}"/>`;
    }
    labels.forEach((label, i) => {
      const angle = -120 + (i * 240) / (labels.length - 1);
      const rad = (angle * Math.PI) / 180;
      const x = 100 + 55 * Math.sin(rad);
      const y = 100 - 55 * Math.cos(rad);
      ticks += `<text x="${x}" y="${y}" fill="${color}" font-size="7" text-anchor="middle">${label}</text>`;
    });
    return ticks;
  }

  _updateNeedle(value) {
    const clamped = Math.min(Math.max(value, 0), 100);
    const fraction = clamped / 100;
    const angle = -120 + fraction * 240;
    const needle = this.shadowRoot.querySelector("#needle");
    if (needle) needle.style.transform = `rotate(${angle}deg)`;

    const zoneLabel = this.shadowRoot.querySelector("#zone-label");
    if (zoneLabel) {
      let zone;
      if (clamped < 30) zone = "Dry";
      else if (clamped < 45) zone = "Fresh";
      else if (clamped < 60) zone = "Comfortable";
      else if (clamped < 75) zone = "Humid";
      else zone = "Damp";
      zoneLabel.textContent = zone;
    }
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = `${value.toFixed(this._config.decimals)}${this._config.unit}`;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-hygrometer", BurnettVintageHygrometer);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-hygrometer",
  name: "Burnett Vintage Hygrometer",
  description: "An antique, animated SVG hygrometer for Home Assistant.",
});

/* ---------- src/burnett-vintage-wind-compass.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Wind Compass Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique weathervane-style wind compass for Home Assistant.
 * Milestone: v0.2 "Breeze"
 *
 * Config example:
 * type: custom:burnett-vintage-wind-compass
 * entity: sensor.gw3000a_wind_direction     # degrees, 0-360
 * speed_entity: sensor.gw3000a_wind_speed
 * gust_entity: sensor.gw3000a_wind_gust      # optional
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * speed_unit: mph
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageWindCompass extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a wind direction sensor, in degrees).");
    }
    this._config = {
      speed_unit: "mph",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 0,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const dirState = hass.states[this._config.entity];
    if (dirState) {
      const dir = parseFloat(dirState.state);
      if (!isNaN(dir)) this._updateArrow(dir);
    }

    if (this._config.speed_entity) {
      const speedState = hass.states[this._config.speed_entity];
      if (speedState) {
        const speed = parseFloat(speedState.state);
        if (!isNaN(speed)) this._updateSpeed(speed);
      }
    }

    if (this._config.gust_entity) {
      const gustState = hass.states[this._config.gust_entity];
      if (gustState) {
        const gust = parseFloat(gustState.state);
        if (!isNaN(gust)) this._updateGust(gust);
      }
    }
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const face = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

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
        .dial-wrap { cursor: pointer; }
        .arrow {
          transform-origin: 100px 100px;
          transition: transform 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
        .gust-label { color: ${text}; font-size: 0.8em; opacity: 0.7; margin-top: 2px; }
        .dir-label { color: ${text}; font-size: 0.9em; opacity: 0.85; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 200 200" width="100%" style="max-width:280px">
            <circle cx="100" cy="100" r="95" fill="${face}" stroke="${rim}" stroke-width="6"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1" opacity="0.5"/>
            ${this._drawCompassRose(text)}
            <!-- Weathervane arrow: rotates, the rose beneath it stays fixed.
                 Classic single arrowhead + diamond tail fin, like a real
                 weathervane rather than a two-ended compass needle. -->
            <g class="arrow" id="arrow">
              <polygon points="100,25 92,46 108,46" fill="#8a1f1f"/>
              <line x1="100" y1="46" x2="100" y2="100" stroke="#8a1f1f" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="100,100 92,121 100,129 108,121" fill="#8a1f1f"/>
              <circle cx="100" cy="100" r="5" fill="#5a1414"/>
            </g>
          </svg>
        </div>
        <div class="dir-label" id="dir-label">--</div>
        <div class="readout" id="speed-readout">-- ${this._config.speed_unit}</div>
        <div class="gust-label" id="gust-label"></div>
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.speed_entity || this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _drawCompassRose(color) {
    let marks = "";
    const majorPoints = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    for (let i = 0; i < majorPoints.length; i++) {
      const angle = i * 45;
      const rad = (angle * Math.PI) / 180;
      const isCardinal = i % 2 === 0;
      const r1 = isCardinal ? 68 : 74;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + 80 * Math.sin(rad);
      const y2 = 100 - 80 * Math.cos(rad);
      marks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${isCardinal ? 2 : 1}" opacity="${isCardinal ? 0.9 : 0.5}"/>`;

      const lx = 100 + 58 * Math.sin(rad);
      const ly = 100 - 58 * Math.cos(rad);
      marks += `<text x="${lx}" y="${ly + 3}" fill="${color}" font-size="${isCardinal ? 10 : 7}" text-anchor="middle" font-weight="${isCardinal ? "bold" : "normal"}">${majorPoints[i]}</text>`;
    }
    // Fine ticks every 15 degrees for a proper instrument look.
    for (let deg = 0; deg < 360; deg += 15) {
      if (deg % 45 === 0) continue; // already drawn above
      const rad = (deg * Math.PI) / 180;
      const x1 = 100 + 76 * Math.sin(rad);
      const y1 = 100 - 76 * Math.cos(rad);
      const x2 = 100 + 80 * Math.sin(rad);
      const y2 = 100 - 80 * Math.cos(rad);
      marks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="0.75" opacity="0.4"/>`;
    }
    return marks;
  }

  _compassAbbreviation(degrees) {
    const points = [
      "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return points[index];
  }

  _updateArrow(degrees) {
    const normalized = ((degrees % 360) + 360) % 360;
    const arrow = this.shadowRoot.querySelector("#arrow");
    if (arrow) arrow.style.transform = `rotate(${normalized}deg)`;

    const dirLabel = this.shadowRoot.querySelector("#dir-label");
    if (dirLabel) {
      dirLabel.textContent = `${this._compassAbbreviation(normalized)} (${Math.round(normalized)}°)`;
    }
  }

  _updateSpeed(speed) {
    const readout = this.shadowRoot.querySelector("#speed-readout");
    if (readout) {
      readout.textContent = `${speed.toFixed(this._config.decimals)} ${this._config.speed_unit}`;
    }
  }

  _updateGust(gust) {
    const label = this.shadowRoot.querySelector("#gust-label");
    if (label) {
      label.textContent = `Gust: ${gust.toFixed(this._config.decimals)} ${this._config.speed_unit}`;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-wind-compass", BurnettVintageWindCompass);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-wind-compass",
  name: "Burnett Vintage Wind Compass",
  description: "An antique, animated SVG weathervane-style wind compass for Home Assistant.",
});

/* ---------- src/burnett-vintage-wind-speed.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Wind Speed Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique wind speed gauge for Home Assistant.
 * Milestone: v0.2 "Breeze"
 *
 * Config example:
 * type: custom:burnett-vintage-wind-speed
 * entity: sensor.gw3000a_wind_speed
 * gust_entity: sensor.gw3000a_wind_gust    # optional — falls back to `entity`
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * max_speed: 40
 * speed_unit: mph
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageWindSpeed extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a wind speed sensor).");
    }
    this._config = {
      max_speed: 80,
      speed_unit: "mph",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 0,
      show_peak_gust: true,
      peak_gust_window_minutes: 30,
      ...config,
    };
    this._peakGust = null;
    this._lastPeakFetch = 0;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const value = parseFloat(stateObj.state);
    if (isNaN(value)) return;

    this._updateNeedle(value);
    this._updateReadout(value);

    if (this._config.show_peak_gust) {
      // Instantly reflect a new peak if the live reading itself is
      // higher than what we're currently showing — no history lookup
      // needed for that direction.
      const gustEntityId = this._config.gust_entity || this._config.entity;
      const liveGustState = hass.states[gustEntityId];
      const liveGust = liveGustState ? parseFloat(liveGustState.state) : value;
      if (!isNaN(liveGust) && (this._peakGust === null || liveGust > this._peakGust)) {
        this._peakGust = liveGust;
        this._updatePeakNeedle(liveGust);
      }
      // Periodically reconcile with real history so the peak correctly
      // steps back down once it ages out of the window.
      this._maybeFetchPeakGust();
    }
  }

  // Ask Home Assistant's history for the highest gust in the last
  // `peak_gust_window_minutes`. Throttled to every 2 minutes — the
  // window is short, so it needs checking more often than the
  // barometer's 5-hour ghost needle or the thermometer's 24h high.
  async _maybeFetchPeakGust() {
    const now = Date.now();
    if (now - this._lastPeakFetch < 2 * 60 * 1000) return;
    this._lastPeakFetch = now;

    const entityId = this._config.gust_entity || this._config.entity;
    const since = new Date(now - this._config.peak_gust_window_minutes * 60 * 1000).toISOString();

    try {
      const history = await this._hass.callApi(
        "GET",
        `history/period/${since}?filter_entity_id=${entityId}&minimal_response`
      );
      const entries = history && history[0];
      if (!entries || !entries.length) return;

      let max = -Infinity;
      for (const entry of entries) {
        const v = parseFloat(entry.state);
        if (!isNaN(v) && v > max) max = v;
      }
      if (max > -Infinity) {
        this._peakGust = max;
        this._updatePeakNeedle(max);
      }
    } catch (err) {
      console.warn("Burnett wind speed: couldn't fetch peak gust", err);
    }
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const face = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

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
        .dial-wrap { cursor: pointer; }
        .needle {
          transform-origin: 100px 100px;
          transition: transform 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .peak-needle {
          transform-origin: 100px 100px;
          transition: transform 2s ease-out;
          opacity: 0.45;
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
        .peak-label { color: ${text}; font-size: 0.7em; opacity: 0.6; margin-top: 2px; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 200 200" width="100%" style="max-width:280px">
            <circle cx="100" cy="100" r="95" fill="${face}" stroke="${rim}" stroke-width="6"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1" opacity="0.5"/>
            ${this._drawTicks(text)}
            <text x="100" y="72" fill="${text}" font-size="9" text-anchor="middle" font-style="italic">Wind Speed</text>
            ${
              this._config.show_peak_gust
                ? `<g class="peak-needle" id="peak-needle" style="display:none">
                     <line x1="100" y1="100" x2="100" y2="38" stroke="${text}" stroke-width="1.5" stroke-linecap="round"/>
                     <circle cx="100" cy="100" r="3" fill="${text}"/>
                   </g>`
                : ""
            }
            <g class="needle" id="needle">
              <line x1="100" y1="100" x2="100" y2="30" stroke="#8a1f1f" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="100" cy="100" r="5" fill="#8a1f1f"/>
            </g>
          </svg>
        </div>
        <div class="readout" id="readout">-- ${this._config.speed_unit}</div>
        ${
          this._config.show_peak_gust
            ? `<div class="peak-label" id="peak-label"></div>`
            : ""
        }
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _drawTicks(color) {
    let ticks = "";
    const { max_speed } = this._config;
    const majorSteps = 8;
    for (let i = 0; i <= 40; i++) {
      const angle = -120 + (i * 240) / 40;
      const rad = (angle * Math.PI) / 180;
      const long = i % 5 === 0;
      const r1 = long ? 68 : 74;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + 80 * Math.sin(rad);
      const y2 = 100 - 80 * Math.cos(rad);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${long ? 2 : 1}" opacity="${long ? 0.9 : 0.5}"/>`;
    }
    for (let i = 0; i <= majorSteps; i++) {
      const value = Math.round((max_speed * i) / majorSteps);
      const angle = -120 + (i * 240) / majorSteps;
      const rad = (angle * Math.PI) / 180;
      const x = 100 + 58 * Math.sin(rad);
      const y = 100 - 58 * Math.cos(rad);
      ticks += `<text x="${x}" y="${y + 3}" fill="${color}" font-size="8" text-anchor="middle">${value}</text>`;
    }
    return ticks;
  }

  _angleForValue(value) {
    const { max_speed } = this._config;
    const clamped = Math.min(Math.max(value, 0), max_speed);
    const fraction = clamped / max_speed;
    return -120 + fraction * 240;
  }

  _updateNeedle(value) {
    const angle = this._angleForValue(value);
    const needle = this.shadowRoot.querySelector("#needle");
    if (needle) needle.style.transform = `rotate(${angle}deg)`;
  }

  _updatePeakNeedle(value) {
    const peak = this.shadowRoot.querySelector("#peak-needle");
    const label = this.shadowRoot.querySelector("#peak-label");
    if (!peak) return;
    const angle = this._angleForValue(value);
    peak.style.display = "block";
    peak.style.transform = `rotate(${angle}deg)`;
    if (label) {
      label.textContent = `Peak gust (${this._config.peak_gust_window_minutes}m): ${value.toFixed(this._config.decimals)} ${this._config.speed_unit}`;
    }
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = `${value.toFixed(this._config.decimals)} ${this._config.speed_unit}`;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-wind-speed", BurnettVintageWindSpeed);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-wind-speed",
  name: "Burnett Vintage Wind Speed",
  description: "An antique, animated SVG wind speed gauge with peak gust needle for Home Assistant.",
});

/* ---------- src/burnett-vintage-rain-gauge.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Rain Gauge Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique rain gauge for Home Assistant.
 * Milestone: v0.3 "Showers"
 *
 * Config example:
 * type: custom:burnett-vintage-rain-gauge
 * entity: sensor.gw3000a_daily_rain
 * rate_entity: sensor.gw3000a_rain_rate    # optional
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * max_daily: 50
 * unit: mm
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageRainGauge extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a daily rainfall total sensor).");
    }
    this._config = {
      max_daily: 50,
      unit: "mm",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 1,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (stateObj) {
      const value = parseFloat(stateObj.state);
      if (!isNaN(value)) {
        this._updateWater(value);
        this._updateReadout(value);
      }
    }

    if (this._config.rate_entity) {
      const rateState = hass.states[this._config.rate_entity];
      if (rateState) {
        const rate = parseFloat(rateState.state);
        if (!isNaN(rate)) this._updateRate(rate);
      }
    }
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const frame = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

    // The tube is drawn from y=170 (base) up to y=20 (top), 150px of travel.
    this._tubeTop = 20;
    this._tubeBottom = 170;

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
        .dial-wrap { cursor: pointer; }
        .water {
          transition: y 1.2s cubic-bezier(0.34, 1.2, 0.4, 1), height 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
        .rate-label { color: ${text}; font-size: 0.85em; opacity: 0.8; margin-top: 2px; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 120 220" width="100%" style="max-width:140px">
            <!-- Frame / backboard -->
            <rect x="10" y="8" width="100" height="200" rx="10" fill="${frame}" stroke="${rim}" stroke-width="4"/>
            ${this._drawScale(text)}
            <!-- Glass tube outline -->
            <rect x="50" y="${this._tubeTop}" width="20" height="${this._tubeBottom - this._tubeTop}" rx="3" fill="none" stroke="${rim}" stroke-width="2"/>
            <!-- Water fill -->
            <rect class="water" id="water" x="51" y="${this._tubeBottom}" width="18" height="0" fill="#3a6d9e"/>
            <!-- Base -->
            <rect x="46" y="168" width="28" height="10" rx="2" fill="${rim}"/>
          </svg>
        </div>
        <div class="readout" id="readout">-- ${this._config.unit}</div>
        ${
          this._config.rate_entity
            ? `<div class="rate-label" id="rate-label"></div>`
            : ""
        }
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _drawScale(color) {
    const { max_daily } = this._config;
    let marks = "";
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = max_daily - (max_daily * i) / steps;
      const y = this._tubeTop + ((this._tubeBottom - this._tubeTop) * i) / steps;
      marks += `<line x1="72" y1="${y}" x2="80" y2="${y}" stroke="${color}" stroke-width="1.5"/>`;
      marks += `<text x="84" y="${y + 3}" fill="${color}" font-size="8">${Math.round(value)}</text>`;
    }
    return marks;
  }

  _updateWater(value) {
    const { max_daily } = this._config;
    const clamped = Math.min(Math.max(value, 0), max_daily);
    const fraction = clamped / max_daily;
    const tubeHeight = this._tubeBottom - this._tubeTop;
    const columnHeight = fraction * tubeHeight;
    const water = this.shadowRoot.querySelector("#water");
    if (water) {
      water.setAttribute("y", this._tubeBottom - columnHeight);
      water.setAttribute("height", columnHeight);
    }
  }

  _rainIntensity(rate) {
    // Standard meteorological rain-rate bands, in mm/h.
    if (rate <= 0) return "Dry";
    if (rate < 0.5) return "Drizzle";
    if (rate < 4) return "Light";
    if (rate < 8) return "Moderate";
    if (rate < 30) return "Heavy";
    return "Torrential";
  }

  _updateRate(rate) {
    const label = this.shadowRoot.querySelector("#rate-label");
    if (label) {
      const unit = this._config.unit + "/h";
      label.textContent = `${rate.toFixed(1)} ${unit} — ${this._rainIntensity(rate)}`;
    }
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = `${value.toFixed(this._config.decimals)} ${this._config.unit} today`;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-rain-gauge", BurnettVintageRainGauge);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-rain-gauge",
  name: "Burnett Vintage Rain Gauge",
  description: "An antique, animated SVG rain gauge for Home Assistant.",
});

/* ---------- src/burnett-vintage-uv-index.js ---------- */
/**
 * Burnett Street Weather Station — Vintage UV Index Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique UV index gauge for Home Assistant, using
 * the standard international UV color bands (green/yellow/orange/
 * red/purple) since that's how UV index is universally read.
 * Milestone: v0.3 "Showers"
 *
 * Config example:
 * type: custom:burnett-vintage-uv-index
 * entity: sensor.gw3000a_uv_index
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageUvIndex extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a UV index sensor).");
    }
    this._config = {
      max_uv: 12,
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 1,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const value = parseFloat(stateObj.state);
    if (isNaN(value)) return;

    this._updateNeedle(value);
    this._updateReadout(value);
  }

  // Standard international UV index bands.
  _band(value) {
    if (value < 3) return { name: "Low", color: "#4a9e4a" };
    if (value < 6) return { name: "Moderate", color: "#d9b32c" };
    if (value < 8) return { name: "High", color: "#d97b2c" };
    if (value < 11) return { name: "Very High", color: "#c0392b" };
    return { name: "Extreme", color: "#7d3c98" };
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const face = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

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
        .dial-wrap { cursor: pointer; }
        .needle {
          transform-origin: 100px 100px;
          transition: transform 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
        .band-label { font-size: 0.9em; margin-top: 2px; font-weight: bold; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 200 200" width="100%" style="max-width:280px">
            <circle cx="100" cy="100" r="95" fill="${face}" stroke="${rim}" stroke-width="6"/>
            ${this._drawBands()}
            <circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1" opacity="0.3"/>
            ${this._drawTicks(text)}
            <g class="needle" id="needle">
              <line x1="100" y1="100" x2="100" y2="30" stroke="#3a2c1a" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="100" cy="100" r="5" fill="#3a2c1a"/>
            </g>
          </svg>
        </div>
        <div class="readout" id="readout">--</div>
        <div class="band-label" id="band-label"></div>
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  // Colored arc bands around the outer edge of the dial, matching the
  // standard UV index color scale, drawn behind the tick marks.
  _drawBands() {
    const { max_uv } = this._config;
    const boundaries = [0, 3, 6, 8, 11, max_uv];
    const colors = ["#4a9e4a", "#d9b32c", "#d97b2c", "#c0392b", "#7d3c98"];
    let arcs = "";
    for (let i = 0; i < colors.length; i++) {
      const startFrac = Math.min(boundaries[i], max_uv) / max_uv;
      const endFrac = Math.min(boundaries[i + 1], max_uv) / max_uv;
      if (endFrac <= startFrac) continue;
      const startAngle = -120 + startFrac * 240;
      const endAngle = -120 + endFrac * 240;
      arcs += this._arcSegment(startAngle, endAngle, colors[i]);
    }
    return arcs;
  }

  _arcSegment(startAngle, endAngle, color) {
    const rOuter = 92;
    const rInner = 82;
    const toXY = (angleDeg, r) => {
      const rad = (angleDeg * Math.PI) / 180;
      return [100 + r * Math.sin(rad), 100 - r * Math.cos(rad)];
    };
    const [x1, y1] = toXY(startAngle, rOuter);
    const [x2, y2] = toXY(endAngle, rOuter);
    const [x3, y3] = toXY(endAngle, rInner);
    const [x4, y4] = toXY(startAngle, rInner);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `<path d="M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z" fill="${color}" opacity="0.85"/>`;
  }

  _drawTicks(color) {
    const { max_uv } = this._config;
    let ticks = "";
    for (let i = 0; i <= max_uv; i++) {
      const angle = -120 + (i * 240) / max_uv;
      const rad = (angle * Math.PI) / 180;
      const x = 100 + 66 * Math.sin(rad);
      const y = 100 - 66 * Math.cos(rad);
      ticks += `<text x="${x}" y="${y + 3}" fill="${color}" font-size="8" text-anchor="middle">${i}</text>`;
    }
    return ticks;
  }

  _updateNeedle(value) {
    const { max_uv } = this._config;
    const clamped = Math.min(Math.max(value, 0), max_uv);
    const fraction = clamped / max_uv;
    const angle = -120 + fraction * 240;
    const needle = this.shadowRoot.querySelector("#needle");
    if (needle) needle.style.transform = `rotate(${angle}deg)`;

    const band = this._band(clamped);
    const bandLabel = this.shadowRoot.querySelector("#band-label");
    if (bandLabel) {
      bandLabel.textContent = band.name;
      bandLabel.style.color = band.color;
    }
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = value.toFixed(this._config.decimals);
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-uv-index", BurnettVintageUvIndex);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-uv-index",
  name: "Burnett Vintage UV Index",
  description: "An antique-styled UV index gauge with standard color bands for Home Assistant.",
});

/* ---------- src/burnett-vintage-solar.js ---------- */
/**
 * Burnett Street Weather Station — Vintage Solar Radiation Card
 * -----------------------------------------------------------
 * A hand-drawn SVG antique solar radiation gauge for Home Assistant.
 * Milestone: v0.3 "Showers"
 *
 * Config example:
 * type: custom:burnett-vintage-solar
 * entity: sensor.gw3000a_solar_radiation
 * name: Burnett Street
 * subtitle: Weather Station
 * established: "2026"
 * max_solar: 1200
 * unit: W/m²
 * theme: classic_oak   # or "observatory"
 */

class BurnettVintageSolar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("You must set an 'entity' (a solar radiation sensor).");
    }
    this._config = {
      max_solar: 1200,
      unit: "W/m²",
      theme: "classic_oak",
      name: "Burnett Street",
      subtitle: "Weather Station",
      established: "2026",
      decimals: 0,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const value = parseFloat(stateObj.state);
    if (isNaN(value)) return;

    this._updateNeedle(value);
    this._updateReadout(value);
  }

  _render() {
    const isDark = this._config.theme === "observatory";
    const face = isDark ? "#1b1f24" : "#f4ecd8";
    const rim = isDark ? "#8a7a4f" : "#b08d57";
    const text = isDark ? "#d8c99a" : "#3a2c1a";
    this._themeText = text;

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
        .dial-wrap { cursor: pointer; }
        .needle {
          transform-origin: 100px 100px;
          transition: transform 1.2s cubic-bezier(0.34, 1.2, 0.4, 1);
        }
        .readout { color: ${text}; font-size: 1.4em; margin-top: 6px; }
      </style>
      <ha-card>
        <div class="plaque">
          ${this._config.name}
          <span class="subtitle">${this._config.subtitle} · Est. ${this._config.established}</span>
        </div>
        <div class="dial-wrap">
          <svg viewBox="0 0 200 200" width="100%" style="max-width:280px">
            <circle cx="100" cy="100" r="95" fill="${face}" stroke="${rim}" stroke-width="6"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="${rim}" stroke-width="1" opacity="0.5"/>
            ${this._drawSunburst(rim)}
            ${this._drawTicks(text)}
            <text x="100" y="72" fill="${text}" font-size="9" text-anchor="middle" font-style="italic">Solar</text>
            <g class="needle" id="needle">
              <line x1="100" y1="100" x2="100" y2="30" stroke="#c07a1f" stroke-width="2.5" stroke-linecap="round"/>
              <circle cx="100" cy="100" r="5" fill="#c07a1f"/>
            </g>
          </svg>
        </div>
        <div class="readout" id="readout">-- ${this._config.unit}</div>
      </ha-card>
    `;

    this.shadowRoot.querySelector(".dial-wrap").addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId: this._config.entity },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  // A small decorative sunburst behind the numbers — subtle, brass-toned,
  // in keeping with the instrument-plate look rather than a cartoon sun.
  _drawSunburst(color) {
    let rays = "";
    for (let i = 0; i < 12; i++) {
      const angle = (i * 360) / 12;
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + 14 * Math.sin(rad);
      const y1 = 130 - 14 * Math.cos(rad) + 0; // offset ring center lower, near readout area is separate
      const x2 = 100 + 20 * Math.sin(rad);
      const y2 = 130 - 20 * Math.cos(rad);
      rays += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.35"/>`;
    }
    rays += `<circle cx="100" cy="130" r="10" fill="none" stroke="${color}" stroke-width="1" opacity="0.35"/>`;
    return rays;
  }

  _drawTicks(color) {
    const { max_solar } = this._config;
    let ticks = "";
    for (let i = 0; i <= 40; i++) {
      const angle = -120 + (i * 240) / 40;
      const rad = (angle * Math.PI) / 180;
      const long = i % 5 === 0;
      const r1 = long ? 68 : 74;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + 80 * Math.sin(rad);
      const y2 = 100 - 80 * Math.cos(rad);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${long ? 2 : 1}" opacity="${long ? 0.9 : 0.5}"/>`;
    }
    const majorSteps = 6;
    for (let i = 0; i <= majorSteps; i++) {
      const value = Math.round((max_solar * i) / majorSteps);
      const angle = -120 + (i * 240) / majorSteps;
      const rad = (angle * Math.PI) / 180;
      const x = 100 + 58 * Math.sin(rad);
      const y = 100 - 58 * Math.cos(rad);
      ticks += `<text x="${x}" y="${y + 3}" fill="${color}" font-size="7.5" text-anchor="middle">${value}</text>`;
    }
    return ticks;
  }

  _updateNeedle(value) {
    const { max_solar } = this._config;
    const clamped = Math.min(Math.max(value, 0), max_solar);
    const fraction = clamped / max_solar;
    const angle = -120 + fraction * 240;
    const needle = this.shadowRoot.querySelector("#needle");
    if (needle) needle.style.transform = `rotate(${angle}deg)`;
  }

  _updateReadout(value) {
    const readout = this.shadowRoot.querySelector("#readout");
    if (readout) {
      readout.textContent = `${value.toFixed(this._config.decimals)} ${this._config.unit}`;
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define("burnett-vintage-solar", BurnettVintageSolar);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "burnett-vintage-solar",
  name: "Burnett Vintage Solar Radiation",
  description: "An antique, animated SVG solar radiation gauge for Home Assistant.",
});

