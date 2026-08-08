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
