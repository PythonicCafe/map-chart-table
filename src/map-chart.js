export class MapChart {

  constructor({
    element,
    map,
    datasetCities,
    cities,
    datasetStates,
    states,
    statesSelected,
    tooltipAction,
    type
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
    this.type = type;

    this.start();
  }

  start() {
    const self = this;
    if (!self.element) {
      return;
    }

    if (self.datasetCities) {
      self.render();
      self.loadMapState();
      return;
    }

    self.render();
    self.loadMapNation();
  }

  update({ map, datasetCities, cities, datasetStates, states, statesSelected, type }) {
    const self = this;
    if (!self.element) {
      return;
    }

    self.map = map ?? self.map;
    self.cities = cities ?? self.cities;
    self.states = states ?? self.states;
    self.statesSelected = statesSelected ?? self.statesSelected;

    self.datasetCities = datasetCities;
    self.datasetStates = datasetStates;
    self.type = type;

    self.start();
  }

  applyMap(map) {
    const self = this;

    const svgContainer = self.element.querySelector("#canvas");
    svgContainer.innerHTML = map ?? "";
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
      let pathId = path.id;
      if (pathId.length > 2) {
        pathId = pathId.substring(0, pathId.length -1);
      }
      const content = contentData ? contentData[pathId] : [];
      let dataset = self.findElement(datasetStates, content) ??  { data: "---", color: "#e9e9e9" };

      if (!content || !content.name) {
        path.style.fill = dataset.color;
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
            <div class="mct-tooltip__result">${result}</div>
          </article>`;
        tooltip.style.display = "block";
        tooltip.style.backgroundColor = result.includes("---") ? "grey" : "var(--primary-color)";
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
    for (let i=0; i < arr.length; i++) {
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

  getPercentage(maxVal, minVal, val) {
    return ((val - minVal) / (maxVal - minVal)) * 100;
  }

  getMaxAndMinValues(dataset) {
    if (Object.values(dataset)[0].includes("%")) {
      return;
    }

    const values = Object.values(dataset).map((val) => val.replace(/[,.]/g, ""));
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    return { maxVal, minVal };
  }

  getMaxColorVal() {
    const self = this;
    if (self.type === "Cobertura") {
      return 120;
    }

    return 100;
  }


  loadMapState () {
    const self = this;
    let result = [];

    if (self.datasetCities) {
      const resultValues = self.getMaxAndMinValues(self.datasetCities);
      result =
        Object.entries(
          self.datasetCities
        ).map(([key, val]) =>
          {
            let color = resultValues ? self.getPercentage(resultValues.maxVal, resultValues.minVal, val.replace(/[,.]/g, "")) : parseFloat(val);
            const name = self.cities[key].name;
            return {
              label: name,
              data: val,
              name,
              color: self.getColor(color, self.getMaxColorVal(), self.type === "Abandono"),
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
      const resultValues = self.getMaxAndMinValues(self.datasetStates);
      result =
        Object.entries(
          self.datasetStates
        ).map(([key, val]) =>
          {
            let color = resultValues ? self.getPercentage(resultValues.maxVal, resultValues.minVal, val.replace(/[,.]/g, "")) : parseFloat(val);
            const name = self.states[key].name;
            const label = self.states[key].acronym;
            return {
              label: label,
              data: val,
              name,
              color: self.getColor(color, self.getMaxColorVal(), self.type === "Abandono"),
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

  getColor(percentage, maxVal = 100, reverse = false) {
    const cPalette = [
      { r: 156, g: 63, b: 51 },
      { r: 207, g: 84, b: 67 },
      { r: 231, g: 94, b: 75 },
      { r: 234, g: 114, b: 98 },
      { r: 237, g: 134, b: 120 },
      { r: 243, g: 174, b: 165 },
      { r: 246, g: 194, b: 188 },
      { r: 160, g: 209, b: 242 },
      { r: 50, g: 161, b: 230 },
      { r: 1, g: 121, b: 218 },
      { r: 1, g: 111, b: 196 },
      { r: 0, g: 92, b: 161 }
    ];

    const colors = reverse ? cPalette.reverse() : cPalette;

    if (percentage < 0) {
      return reverse ? "rgb(0, 69, 124)" : "rgb(105, 42, 34)";
    } else if (percentage > maxVal) {
      return reverse ? "rgb(0, 69, 124)" : "rgb(0, 69, 124)";
    }

    const index = Math.floor((percentage / maxVal) * (colors.length - 1));

    const lowerColor = colors[index];
    const upperColor = index < (colors.length - 1) ? colors[index + 1] : colors[index];
    const factor = (percentage / maxVal) * (colors.length - 1) - index;
    const interpolatedColor = {
      r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * factor),
      g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * factor),
      b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * factor)
    };

    return `rgb(${interpolatedColor.r}, ${interpolatedColor.g}, ${interpolatedColor.b})`;
  }

  render () {
    const self = this;

    let legend = "";
    if (self.type != "Abandono") {
       legend = `
          <div class="mct-legend__gradient-box">
            <div class="mct-legend__gradient-box-content mct-legend-box-start"></div>
            ${ Array(12).fill(0).map((x, i) =>
              "<div class='mct-legend__gradient-box-content " + "mct-legend-box-"+ i +"'></div>" ).join("")
            }
            <div class="mct-legend__gradient-box-content mct-legend-box-end"></div>
          </div>
        `;
    } else {
      const arr = [];
      for (let i = 11; i >= 0; i--){
        arr.push("<div class='mct-legend__gradient-box-content " + "mct-legend-box-"+ i +"'></div>");
      }
      legend = `
        <div class="mct-legend__gradient-box">
          <div class="mct-legend__gradient-box-content mct-legend-box-end"></div>
          ${arr.join("")}
          <div class="mct-legend__gradient-box-content mct-legend-box-start"></div>
        </div>
      `;
    }

    const map = `
      <section>
        <div class="mct__canva-section">
          <div id="canvas" class="mct-canva">
            <div class="spinner-container">
              <div id="spinner" class="spinner"></div>
            </div>
          </div>
          <div class="mct-legend">
            <div ${self.type === 'Doses aplicadas' ? "style='display: none'" : ""}>
              <div class="mct-legend__content-box">
                <div class="mct-legend__content">
                  <div class="mct-legend-base">0%</div>
                  <div class="mct-legend-middle">50%</div>
                  <div class="mct-legend-top">100%</div>
                </div>
              </div>
              <div class="mct-legend__box-gradient">
                <div class="mct-legend__gradient">
                  <div class="mct-legend-box-text">
                    <span class="mct-legend-box-text__line mct-legend-box-text__line"></span>
                    <span class="mct-legend-box-text__content">Menos que 0%</span>
                  </div>
                  ${legend}
                  <div class="mct-legend-box-text mct-legend-box-text--end">
                    <span class="mct-legend-box-text__line mct-legend-box-text__line--end"></span>
                    <span class="mct-legend-box-text__content mct-legend-box-text__content--end">Mais que 120%</span>
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
