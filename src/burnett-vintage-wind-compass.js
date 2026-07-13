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
