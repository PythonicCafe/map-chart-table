export class MapChart {

  constructor({
    element,
    map,
    datasetCities,
    cities,
    datasetStates,
    states,
    statesSelected,
    tooltipAction
  }) {
    this.element = typeof element === "string" ?
      element.querySelector(element) : element;
    this.map = map;
    this.datasetCities = datasetCities;
    this.cities = cities;
    this.datasetStates = datasetStates;
    this.states = states;
    this.statesSelected = statesSelected;
    this.tooltipAction = tooltipAction;

    this.start();
  }

  start() {
    const self = this;

    if (self.datasetCities) {
      self.render();
      self.loadMapState();
      return;
    }

    self.render();
    self.loadMapNation();
  }

  update({ map, datasetCities, cities, datasetStates, states, statesSelected }) {
    const self = this;

    self.map = map ?? self.map;
    self.cities = cities ?? self.cities;
    self.states = states ?? self.states;
    self.statesSelected = statesSelected ?? self.statesSelected;

    self.datasetCities = datasetCities;
    self.datasetStates = datasetStates;

    self.start();
  }

  applyMap(map) {
    const self = this;

    const svgContainer = self.element.querySelector("#canvas");
    svgContainer.innerHTML = map;
    for (const path of svgContainer.querySelectorAll('path')) {
      path.style.stroke = "white";
      path.setAttribute("stroke-width", "1px");
      path.setAttribute("vector-effect", "non-scaling-stroke");
    }

    const svgElement = svgContainer.querySelector("svg");
    svgElement.style.maxWidth = "100%";
    svgElement.style.height = "100%";
    svgElement.style.margin = "auto";
  }

  setData(
    {
      datasetStates,
      contentData
    } = {}
  ) {
    const self = this;

    // Querying map country states setting eventListener
    for (const path of self.element.querySelectorAll('#canvas svg path')) {
      const content = contentData ? contentData[path.id] : [];
      const dataset = self.findElement(datasetStates, content);

      if (!dataset || !dataset.data) {
        path.style.fill = "#e9e9e9";
        continue;
      }
      const result = dataset.data;
      const resultColor = dataset.color;
      const tooltip = self.element.querySelector(".mct-tooltip")

      path.addEventListener("mousemove", (event) => {
        self.tooltipPosition(event, tooltip);
      });
      path.addEventListener("mouseover", (event) => {
        const parentElement = path.parentNode;
        parentElement.appendChild(path);
        path.style.stroke = "blue";
        tooltip.innerHTML = `
          <article>
            <div class="mct-tooltip__title">${content.name}</div>
            <div class="mct-tooltip__result">${result + " %"}</div>
          </article>`;
        tooltip.style.display = "block";
        self.tooltipPosition(event, tooltip);
        self.runTooltipAction(true, content.name);
      });
      path.addEventListener("mouseleave", () => {
        path.style.fill = resultColor;
        path.style.stroke = "white";
        tooltip.style.display = "none";
        self.runTooltipAction(false, content.name);
      });

      path.style.fill = resultColor;
    };
  }

  runTooltipAction(opened, name) {
    if (!this.tooltipAction) {
      return;
    }
    this.tooltipAction(opened, name);
  }

  tooltipPosition(event, tooltip) {
    tooltip.style.left = (event.clientX + 20)+ "px";
    tooltip.style.top = (event.clientY + 20) + "px";
  }

  findElement(arr, name) {
    for (let i = 0; i < arr.length; i++) {
      const object = arr[i];
      const labelLowerCase = object.label.toLowerCase();

      if(!name) {
        continue;
      }

      const nameAcronymLowerCase = name.acronym ? name.acronym.toLowerCase() : "";
      const nameNameLowerCase = name.name ? name.name.toLowerCase() : "";

      const labelWithoutSpaces = labelLowerCase.replaceAll(" ", "");

      if (
        labelLowerCase == nameAcronymLowerCase ||
        labelWithoutSpaces == nameNameLowerCase.replaceAll(" ", "") ||
        labelLowerCase == nameNameLowerCase ||
        labelWithoutSpaces == nameNameLowerCase.replaceAll(" ", "")
      ) {
        return object;
      }
    }

    return;
  }

  loadMapState () {
    const self = this;
    let result = [];

    if (self.datasetCities) {
      result =
        Object.entries(
          self.datasetCities
        ).map(([key, val]) =>
          {
            return {
              label: key,
              data: val,
              name: Object.values(self.cities).find(item => item.name === key).name,
              color: self.getColor(val),
            }
          }
        );
    }

    self.datasetValues = result;
    self.applyMap(self.map);

    self.setData({
      datasetStates: result,
      contentData: self.cities
    })
  }

  loadMapNation() {
    const self = this;
    let result = [];

    if (self.datasetStates) {
      result =
        Object.entries(
          self.datasetStates
        ).map(([key, val]) =>
          {
            return {
              label: key,
              data: val,
              name: Object.values(self.states).find(item => item.acronym === key).name,
              color: self.getColor(val),
            }
          }
        ).filter(x => self.statesSelected.includes(x.label));
    }

    self.datasetValues = result;

    self.applyMap(self.map);
    self.setData({
      datasetStates: result,
      contentData: self.states
    })
  }

  getColor(percentage) {
    const colors = [
      { r: 231, g: 94, b: 34 },
      { r: 243, g: 174, b: 165 },
      { r: 209, g: 218, b: 246 },
      { r: 22, g: 45, b: 102 }
    ];

    if (percentage < 0) {
      percentage = 0;
    } else if (percentage > 100) {
      percentage = 100;
    }

    const index = Math.floor((percentage / 100) * (colors.length - 1));

    const lowerColor = colors[index];
    const upperColor = index < 3 ? colors[index + 1] : colors[index];
    const factor = (percentage / 100) * (colors.length - 1) - index;
    const interpolatedColor = {
      r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * factor),
      g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * factor),
      b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * factor)
    };

    return `rgb(${interpolatedColor.r}, ${interpolatedColor.g}, ${interpolatedColor.b})`;
  }

  interpolateColors(initialColor, finalColor, intervalPercentage) {
    const r = Math.round(initialColor[0] + (finalColor[0] - initialColor[0]) * intervalPercentage);
    const g = Math.round(initialColor[1] + (finalColor[1] - initialColor[1]) * intervalPercentage);
    const b = Math.round(initialColor[2] + (finalColor[2] - initialColor[2]) * intervalPercentage);
    return `rgb(${r}, ${g}, ${b})`;
  }


  render () {
    const self = this;

    const map = `
      <section>
        <div class="mct__canva-section">
          <div id="canvas" class="mct-canva">
            <div class="spinner-container">
              <div id="spinner" class="spinner"></div>
            </div>
          </div>
          <div class="mct-legend">
            <div>
              <div class="mct-legend__content-box">
                <div class="mct-legend__content">
                  <div class="mct-legend-base">0%</div>
                  <div class="mct-legend-middle">50%</div>
                  <div class="mct-legend-top">100%</div>
                </div>
              </div>
              <div class="mct-legend__box-gradient">
                <div class="mct-legend__gradient">
                  <div class="mct-legend__gradient-box">
                    ${ Array(10).fill(0).map((x, i) =>
                      "<div class='mct-legend__gradient-box-content " + "mct-legend-box-"+ i +"'></div>" ).join("")
                     }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mct-tooltip"></div>
      </section>
    `;

    self.element.innerHTML = map;
  }
}
