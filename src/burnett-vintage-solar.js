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
