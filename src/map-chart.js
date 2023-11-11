import Abandono from "./assets/images/abandono.svg"
import Cobertura from "./assets/images/cobertura.svg"
import HomGeo from "./assets/images/hom_geo.svg"
import HomVac from "./assets/images/hom_vac.svg"

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
      contentData,
      type
    } = {}
  ) {
    const self = this;

    // Querying map country states setting eventListener
    for (const element of self.element.querySelectorAll('#canvas path, #canvas g')) {
      let datasetLabel = element.dataset.label;
      let elementId = element.id;

      if (datasetLabel) {
        elementId = datasetLabel;
      } else if (elementId.length > 2) {
        elementId = element.id.substring(0, elementId.length -1);
      }

      const content = contentData ? contentData[elementId] : [];
      let dataset = self.findElement(datasetStates, content) ??  { data: { value: "---" }, color: "#e9e9e9" };

      if (!content || !content.name) {
        // To work with maps that color comes from groups/regions
        if (!element.parentNode.style.fill) {
          element.style.fill = dataset.color;
        }
        continue;
      }
      const result = dataset.data;
      const resultColor = dataset.color;
      const tooltip = self.element.querySelector(".mct-tooltip")

      element.addEventListener("mousemove", (event) => {
        self.tooltipPosition(event, tooltip);
      });
      element.addEventListener("mouseover", (event) => {
        event.target.style.strokeWidth = "2px";
        let tooltipExtra = "";
        if (result && result.population) {
          tooltipExtra = `
            <span class="mct-tooltip__title mct-tooltip__title--sub">População alvo</span>
            <div class="mct-tooltip__result mct-tooltip__result--sub">${result.population.toLocaleString('pt-BR')}</div>
          `;

          if (type !== "Doses aplicadas" && result.doses) {
            tooltipExtra += `
              <span class="mct-tooltip__title mct-tooltip__title--sub">Doses aplicadas</span>
              <div class="mct-tooltip__result mct-tooltip__result--sub">${result.doses.toLocaleString('pt-BR')}</div>
            `;
          }
        }
        tooltip.innerHTML = `
          <article>
            <div class="mct-tooltip__title">${content.name}</div>
            <div class="mct-tooltip__result">${result.value}</div>
            ${tooltipExtra}
          </article>`;
        tooltip.style.display = "block";
        tooltip.style.backgroundColor = result.value.includes("---") ? "grey" : "var(--primary-color)";
        self.tooltipPosition(event, tooltip);
        self.runTooltipAction(true, content.name, content.id);
      });
      element.addEventListener("mouseleave", (event) => {
        if (event.target.tagName === "g") {
          [...event.target.querySelectorAll("path")].forEach(path => path.style.strokeWidth = "1px");
        } else {
          element.style.strokeWidth = "1px";
        }

        element.style.fill = resultColor;
        element.style.stroke = "white";
        tooltip.style.display = "none";
        self.runTooltipAction(false, content.name, content.id);
      });

      element.style.fill = resultColor;
    };
  }

  runTooltipAction(opened, name, id) {
    if (!this.tooltipAction) {
      return;
    }
    this.tooltipAction(opened, name, id);
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
    if (Object.values(dataset)[0].value.includes("%")) {
      return;
    }

    const values = Object.values(dataset).map((val) => val.value.replace(/[,.]/g, ""));
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
            let color = resultValues ? self.getPercentage(
              resultValues.maxVal,
              resultValues.minVal,
              val.value.replace(/[,.]/g, "")
            ) : parseFloat(val.value);
            const name = self.cities[key].name;
            return {
              label: name,
              data: val,
              name,
              color: self.getColor(color, self.getMaxColorVal(), self.type),
            }
          }
        );
    }

    self.datasetValues = result;
    self.applyMap(self.map);

    self.setData({
      datasetStates: result,
      contentData: self.cities,
      type: self.type
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
            let color = resultValues ? self.getPercentage(
              resultValues.maxVal, resultValues.minVal, val.value.replace(/[,.]/g, "")
            ) : parseFloat(val.value);

            const name = self.states[key].name;
            const label = self.states[key].acronym;

            const contentData = {
              label: label,
              data: val,
              name,
              color: self.getColor(color, self.getMaxColorVal(), self.type),
            }
            const id = self.states[key].id;
            if (id) {
              contentData["id"] = id
            }

            return contentData
          }
        ).filter(x => self.statesSelected.includes(x.label));
    }

    self.datasetValues = result;

    self.applyMap(self.map);
    self.setData({
      datasetStates: result,
      contentData: self.states,
      type: self.type
    })
  }

  getColor(percentage, maxVal = 100, type, reverse = false) {
    const cPalette0 = [
      "rgb(0, 69, 124)",
      "rgb(0, 92, 161)",
      "rgb(50, 161, 230)",
      "rgb(246, 194, 188)",
      "rgb(207, 84, 67)",
      "rgb(105, 42, 34)"
    ];

    if (type === "Abandono") {
      if (percentage <= -5) {
        return cPalette0[0];
      } else if (percentage > -5 && percentage <= 0) {
        return  cPalette0[1];
      } else if (percentage > 0 && percentage <= 5) {
        return cPalette0[2];
      } else if (percentage > 5 && percentage <= 10) {
        return cPalette0[3];
      } else if (percentage > 10 && percentage <= 50) {
        return cPalette0[4];
      } else { // percentage > 50
        return cPalette0[5];
      }
    } else if (type === "Cobertura") {
      if (percentage <= 50) {
        return cPalette0[5];
      } else if (percentage > 50 && percentage <= 80) {
        return cPalette0[4];
      } else if (percentage > 80 && percentage <= 95) {
        return cPalette0[3];
      } else if (percentage > 95 && percentage <= 100) {
        return cPalette0[2];
      } else if (percentage > 100 && percentage <= 120) {
        return cPalette0[1];
      } else { // percentage > 120
        return cPalette0[0];
      }
    } else if (type === "Homogeneidade geográfica") {
      if (percentage <= 20) {
        return cPalette0[4];
      } else if (percentage > 20 && percentage <= 50) {
        return cPalette0[3];
      } else if (percentage > 50 && percentage <= 70) {
        return cPalette0[2];
      } else if (percentage > 70 && percentage <= 95) {
        return  cPalette0[1];
      } else { // percentage > 95
        return cPalette0[0];
      }
    } else if (type === "Homogeneidade entre vacinas") {
      if (percentage <= 20) {
        return cPalette0[0];
      } else if (percentage > 20 && percentage <= 40) {
        return cPalette0[1];
      } else if (percentage > 40 && percentage <= 60) {
        return cPalette0[2];
      } else if (percentage > 60 && percentage <= 80) {
        return cPalette0[3];
      } else { // percentage > 80
        return cPalette0[4];
      }
    }

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
    let legendSvg = "";

    if (self.type === "Abandono") {
      legendSvg = Abandono;
    } else if (self.type === "Cobertura") {
      legendSvg = Cobertura;
    } else if (self.type === "Homogeneidade geográfica") {
      legendSvg = HomGeo;
    } else if (self.type === "Homogeneidade entre vacinas") {
      legendSvg = HomVac;
    }

    if (legendSvg) {
      legend =`<img class="mct-legend-svg" src=${legendSvg} alt="some file" />`;
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
            ${legend}
          </div>
        </div>
        <div class="mct-tooltip"></div>
      </section>
    `;

    self.element.innerHTML = map;
  }
}
