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
