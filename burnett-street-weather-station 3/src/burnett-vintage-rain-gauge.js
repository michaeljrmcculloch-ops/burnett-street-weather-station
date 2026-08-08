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
