import Abandono from "./assets/images/abandono.svg"
import Cobertura from "./assets/images/cobertura.svg"
import HomGeo from "./assets/images/hom_geo.svg"
import HomVac from "./assets/images/hom_vac.svg"
import Meta from "./assets/images/meta.svg"

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
    type,
    formPopulated
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
    this.formPopulated = formPopulated;

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

  update({ map, datasetCities, cities, datasetStates, states, statesSelected, type, formPopulated }) {
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
    self.formPopulated = formPopulated;

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
    if (svgElement) {
      svgElement.style.maxWidth = "100%";
      svgElement.style.height = "100%";
      svgElement.style.margin = "auto";
    }
  }

  getData(contentData, elementId) {
    if (!contentData) {
        return [];
    }
    const index = contentData[0].indexOf("geom_id") != -1 ? contentData[0].indexOf("geom_id") : contentData[0].indexOf("id");
    const indexName = contentData[0].indexOf("name");
    const indexAcronym = contentData[0].indexOf("acronym");

    return [ index, indexName, indexAcronym, contentData.find(el => el[index] === elementId) ];
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
      let elementId = element.id;

      if (elementId.length > 6) { // granularity Municipios
        elementId = element.id.substring(0, elementId.length - 1);
      }

      let [ index, indexName, indexAcronym, currentElement ] = self.getData(contentData, elementId);

      let content;
      if (currentElement) {
        content = currentElement;
      }

      if (!content || !content[indexName]) {
        continue;
      }

      let dataset = { data: { value: "---" }, color: "#D3D3D3" };
      let datasetValuesFound = [];

      if (content.id) {
        // Get by id
        datasetValuesFound = self.datasetValues.find(ds => (ds.name == content[indexName]) && (ds.id == content[indexName]));
      } else {
        // Get by name
        datasetValuesFound = self.datasetValues.find(ds => (ds.name == content[indexName]) && (ds.name == content[indexName]));
      }

      if (datasetValuesFound) {
        dataset = datasetValuesFound;
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
        let value = result.value;
        if (type === "Meta atingida") {
          if(result.value !== "---") {
            value = parseInt(result.value) === 0 ? "Não" : "Sim";
          }
        }
        tooltip.innerHTML = `
          <article>
            <div class="mct-tooltip__title">${content[indexName]}</div>
            <div class="mct-tooltip__result">${value}</div>
            ${tooltipExtra}
          </article>`;
        tooltip.style.display = "block";
        tooltip.style.backgroundColor = result.value.includes("---") ? "grey" : "var(--primary-color)";
        self.tooltipPosition(event, tooltip);
        self.runTooltipAction(true, content[indexName], content[index]);
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
        self.runTooltipAction(false, content[indexName], content[index]);
      });

      element.style.fill = resultColor;
    };


    // dataResult is udefined if nothing is comming from API and selects is setted
    if (self.formPopulated && !datasetStates.length) {
      self.element.querySelector(".empty-message span").innerHTML = "Não existem dados para os filtros selecionados";
    } else if (!self.formPopulated && !datasetStates.length) {
      self.element.querySelector(".empty-message span").innerHTML =
        "Selecione os filtros desejados para iniciar a visualização dos dados";
    } else {
      self.element.querySelector(".empty-message").style.display = "none";
    }
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


  loadMapState() {
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

            let [ index, indexName, indexAcronym, currentElement ] = self.getData(self.cities, key);

            if(!currentElement) {
              return;
            }

            const name = currentElement[indexName];
            const label = currentElement[indexAcronym];

            const contentData = {
              label: label,
              data: val,
              name,
              color: self.getColor(color, self.getMaxColorVal(), self.type),
            }
            const id = currentElement.id;
            if (id) {
              contentData["id"] = id
            }

            return contentData
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

            let [ index, indexName, indexAcronym, currentElement ] = self.getData(self.states, key);

            if(!currentElement) {
              return;
            }

            const name = currentElement[indexName];
            const label = currentElement[indexAcronym];

            const contentData = {
              label: label,
              data: val,
              name,
              color: self.getColor(color, self.getMaxColorVal(), self.type),
            }
            const id = currentElement.id;
            if (id) {
              contentData["id"] = id
            }

            return contentData
          }
        ).filter(content => {
          if (content) {
            return self.statesSelected.includes(content.label);
          }
        });
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
    }  else if (type === "Meta atingida") {
      if (percentage == 0) {
        return cPalette0[4];
      } else {
        return cPalette0[2];
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

    if (!percentage) {
      percentage = 0
    } else if (percentage < 0) {
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
    } else if (self.type === "Meta atingida") {
      legendSvg = Meta;
    }

    if (legendSvg) {
      legend =`<img class="mct-legend-svg" src=${legendSvg} alt="some file" />`;
    }

    const emptyIcon = `
        <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" width="30px"><path d="M26 7.5C26 11.0899 23.0899 14 19.5 14C15.9101 14 13 11.0899 13 7.5C13 3.91015 15.9101 1 19.5 1C23.0899 1 26 3.91015 26 7.5ZM16.8536 4.14645C16.6583 3.95118 16.3417 3.95118 16.1464 4.14645C15.9512 4.34171 15.9512 4.65829 16.1464 4.85355L18.7929 7.5L16.1464 10.1464C15.9512 10.3417 15.9512 10.6583 16.1464 10.8536C16.3417 11.0488 16.6583 11.0488 16.8536 10.8536L19.5 8.20711L22.1464 10.8536C22.3417 11.0488 22.6583 11.0488 22.8536 10.8536C23.0488 10.6583 23.0488 10.3417 22.8536 10.1464L20.2071 7.5L22.8536 4.85355C23.0488 4.65829 23.0488 4.34171 22.8536 4.14645C22.6583 3.95118 22.3417 3.95118 22.1464 4.14645L19.5 6.79289L16.8536 4.14645Z" fill="currentColor"></path><path d="M25 22.75V12.5991C24.5572 13.0765 24.053 13.4961 23.5 13.8454V16H17.5L17.3982 16.0068C17.0322 16.0565 16.75 16.3703 16.75 16.75C16.75 18.2688 15.5188 19.5 14 19.5C12.4812 19.5 11.25 18.2688 11.25 16.75L11.2432 16.6482C11.1935 16.2822 10.8797 16 10.5 16H4.5V7.25C4.5 6.2835 5.2835 5.5 6.25 5.5H12.2696C12.4146 4.97463 12.6153 4.47237 12.865 4H6.25C4.45507 4 3 5.45507 3 7.25V22.75C3 24.5449 4.45507 26 6.25 26H21.75C23.5449 26 25 24.5449 25 22.75ZM4.5 22.75V17.5H9.81597L9.85751 17.7041C10.2905 19.5919 11.9808 21 14 21L14.215 20.9947C16.2095 20.8953 17.842 19.4209 18.184 17.5H23.5V22.75C23.5 23.7165 22.7165 24.5 21.75 24.5H6.25C5.2835 24.5 4.5 23.7165 4.5 22.75Z" fill="currentColor"></path></svg><br>
    `;

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
        <div class="empty-message" style="position: absolute; top: 35%; width: 100%; text-align:center; color: #777; font-weight: 500">
          ${emptyIcon}
          <span><div style="background-color:#aaa; max-width: 20%; padding: 7px; margin: 0px auto"></div></span>
        </div>
        <div class="mct-tooltip"></div>
      </section>
    `;

    self.element.innerHTML = map;
  }
}
