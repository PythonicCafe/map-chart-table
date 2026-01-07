import { ref, watch } from "vue/dist/vue.esm-bundler";
import { NCard } from "naive-ui";
import { useStore } from "vuex";

export const mapRange = {
  components:  { NCard },
  props: {
    mapData: {
      type: Object,
    },
    mapTooltip: {
      type: Object,
    },
    mapDataHover: {
      type: String
    },
  },
  setup(props) {
    const store = useStore();
    const datasetValues = ref([]);
    const mapRangeSVG = ref(null);
    const maxVal = ref("---");
    const minVal = ref("--");

    const drawLine = (svg) => {
      svg.setAttribute("height", 0)
      svg.setAttribute("height", svg.parentNode.offsetHeight - 70);
      const line = document.createElementNS("http://www.w3.org/2000/svg", 'line');
      line.setAttribute("x1",20);
      line.setAttribute("y1", 0);
      line.setAttribute("x2", 20);
      line.setAttribute("y2", "100%");
      line.setAttribute("stroke", "#ccc");
      line.setAttribute("stroke-width", "0.6");
      svg.appendChild(line);
    }

    const clearCircles = () => {
      const mapRange = document.querySelector("#map-range");
      const circles = mapRange.querySelectorAll("circle");
      if (circles) {
        circles.forEach(circle => circle.parentNode.removeChild(circle));
      }
    }

    const samePercentCircle = (svg, i, data, meta) => [...svg.querySelectorAll("circle")].find(
      el => {
        let result;
        let dataValue = data[i].data.value;
        if (meta) {
          dataValue = parseInt(dataValue) === 0 ? "Não" : "Sim";
        }
        try {
          result = JSON.parse(el.dataset.value).value;
        } catch(e) {
          result = el.dataset.value;
        }

        return result == dataValue;
      }
    );

    const handleMapChange = (data) => {
      const svg = mapRangeSVG.value;
      if (!svg) {
        return;
      }
      drawLine(svg);
      clearCircles();
      if(!data || !data.length) {
        // Reset interface max/min values
        maxVal.value = "---";
        minVal.value = "---";
        return;
      }

      const svgHeight = svg.getAttribute("height");

      let maxDataVal = Math.max(...data.map(x => parseFloat(x.data)));
      let defineMinVal = "0%";
      const type = store.state.content.form.type;
      if (type === "Doses aplicadas") {
        maxDataVal = Math.max(...data.map(x => x.data.value.replace(/[.,]/g, "")));
        defineMinVal = 0;
      } else if (type === "Cobertura") {
        maxDataVal = "120%";
      } else if (type === "Meta atingida") {
        maxDataVal = "Sim";
        defineMinVal = "Não";
      } else {
        maxDataVal = "100%";
      }

      // Setting interface values
      maxVal.value = maxDataVal.toLocaleString('pt-BR');
      minVal.value = defineMinVal;

      // If maxVal bigger than parent element add styles
      const maxValEl = svg.parentNode.querySelector(".max-val")
      if (maxDataVal.toString().length > 4) {
        maxValEl.style.border = "1px solid #f0f0f0";
        maxValEl.style.boxShadow = "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px";
      } else {
        maxValEl.style.border = "0px";
        maxValEl.style.boxShadow = "none";
      }

      for (let i = 0; i < data.length; i++) {
        let dataVal = data[i].data.value.replace(/[.,]/g, "");
        if (data[i].data.value && data[i].data.value.includes("%")) {
          dataVal = parseFloat(data[i].data.value);
        }

        let y = 0;
        let dataValue = JSON.stringify(data[i].data);
        let samePercentCircleResult;
        if (type === "Meta atingida") {
          y = svgHeight - (dataVal / 1 * svgHeight);
          dataValue = parseInt(data[i].data.value) === 0 ? "Não" : "Sim";
          samePercentCircleResult = samePercentCircle(svg, i, data, true);
        } else {
          y = svgHeight - (dataVal / parseInt(maxDataVal) * svgHeight);
          samePercentCircleResult = samePercentCircle(svg, i, data, false);
        }

        if(samePercentCircleResult) {
          const newTitle = samePercentCircleResult.dataset.title.replace(/\se\s/, ", ") + " e " + data[i].name;
          samePercentCircleResult.setAttribute("data-title", newTitle);
          continue;
        }

        // Block to max value as full or min height
        if (y > svgHeight) {
          y = svgHeight;
        } else if (y < 0) {
          y = 0;
        }
        const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        circle.setAttribute("cx", 20);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 6);
        circle.setAttribute("fill", data[i].color);
        if (data[i].label) {
          circle.setAttribute("data-id", data[i].label);
        }
        circle.setAttribute("data-title", data[i].name);
        circle.setAttribute("data-value", dataValue);
        circle.setAttribute("opacity", 0.8);
        circle.setAttribute("stroke", "#aaa");
        circle.setAttribute("stroke-width", "0.4");
        svg.appendChild(circle);
      }

      svg.addEventListener('mousemove', (e) => {
        const target = e.target;
        if (target.tagName === 'circle') {
          let value;
          try {
            value = JSON.parse(target.getAttribute('data-value')).value;
          } catch(e) {
            value = target.getAttribute('data-value');
          }
          const parentElement = target.parentNode;
          parentElement.appendChild(target);
          showTooltip(e, target.getAttribute('data-title'), value, type);
          return;
        }
        hideTooltip();
      }, false);

      svg.addEventListener("mouseleave", () => {
        hideTooltip();
      });
    }

    const showTooltip = (evt, text, value) => {
      const tooltip = document.querySelector(".tooltip");
      tooltip.innerHTML = `
          <article>
            <div class="mct-tooltip__title">${text}</div>
            <div class="mct-tooltip__result">${value}</div>
          </article>`;
      tooltip.style.display = "block";
      tooltip.style.left = (evt.clientX + 20) + 'px';
      tooltip.style.top = (evt.clientY - 30) + 'px';
    }

    const hideTooltip = () => {
      const tooltip = document.querySelector(".tooltip");
      tooltip.style.display = "none";
    }

    watch(
      () => props.mapData,
      () => {
        datasetValues.value = props.mapData;
        handleMapChange(props.mapData);
      }
    );

    watch(
      () => props.mapTooltip,
      () => {
        const query =  props.mapTooltip.label ? `[data-id="${props.mapTooltip.label}"]` : `[data-title="${props.mapTooltip.name}"]`;
        let circle = document.querySelector(query)

        if (!circle) {
          return;
        }

        if (props.mapTooltip.opened) {
          circle.setAttribute("r", 9);
          circle.setAttribute("opacity", 1);
          circle.setAttribute("stroke", "#7a7a7a");
          return;
        }

        circle.setAttribute("r",6);
        circle.setAttribute("opacity", 0.8);
        circle.setAttribute("stroke", "#aaa");
      }
    )

    const getWindowWidth = () => {
      handleMapChange(datasetValues.value);
    };
    window.addEventListener('resize', getWindowWidth);

    return {
      mapRangeSVG,
      mapRange,
      maxVal,
      minVal
    }
  },
  template: `
    <n-card
      id="map-range"
      style="max-width: 40px"
      content-style="padding: 0px; display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 12px;"
    >
      <span
        class="max-val"
        style="margin: 12px 0px 0px; background-color: white; padding: 2px 8px; white-space: nowrap; border-radius: .23rem;"
      >{{ maxVal }}</span>
      <svg ref="mapRangeSVG" width="40" style="overflow: visible"></svg>
      <span style="padding: 0px 0px 12px">{{ minVal }}</span>
    </n-card>
    <div class="tooltip mct-tooltip"></div>
  `,
}
