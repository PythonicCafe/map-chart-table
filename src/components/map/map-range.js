import { ref, onMounted, watchEffect, watch } from "vue/dist/vue.esm-bundler";
import { NCard } from "naive-ui";

export const mapRange = {
  components:  { NCard },
  props: {
    mapData: {
      type: Object,
    },
    mapTooltip: {
      type: Object,
    },
    tooltipAction: {
      type: Object,
    },
    mapDataHover: {
      type: String
    },
  },
  setup(props) {
    const datasetValues = ref([]);
    const mapRangeSVG = ref(null);

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

    const handleMapChange = (data) => {
      const svg = mapRangeSVG.value;
      if (!svg) {
        return;
      }
      drawLine(svg);
      clearCircles();
      if(!data || !data.length) {
        return;
      }

      const svgHeight = svg.getAttribute("height");
      for (let i = 0; i < data.length; i++) {
        const samePercentCircle = [...svg.querySelectorAll("circle")].find(x => x.dataset.value === data[i].data + "%");
        if(samePercentCircle) {
          samePercentCircle.setAttribute("data-title", `${samePercentCircle.dataset.title}, ${data[i].name}`);
          continue;
        }
        let y = svgHeight - (data[i].data / 100 * svgHeight);
        if (y > svgHeight) {
          y = svgHeight;
        } else if (y < 0) {
          y = 0;
        }
        const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        circle.setAttribute("cx",20);
        circle.setAttribute("cy",y);
        circle.setAttribute("r",6);
        circle.setAttribute("fill", data[i].color);
        circle.setAttribute("data-title", data[i].name);
        circle.setAttribute("data-value", data[i].data + "%");
        circle.setAttribute("opacity", 0.8);
        circle.setAttribute("stroke", "#aaa");
        circle.setAttribute("stroke-width", "0.4");
        svg.appendChild(circle);
      }

      svg.addEventListener('mousemove', (e) => {
        const target = e.target;
        if (target.tagName === 'circle') {
          const parentElement = target.parentNode;
          parentElement.appendChild(target);
          showTooltip(e, target.getAttribute('data-title'), target.getAttribute('data-value') );
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
      tooltip.innerHTML = `<span class="mct-tooltip__title">${text}</span> <br>
          <span class="mct-tooltip__result">${value}</span>`;
      tooltip.style.display = "block";
      tooltip.style.left = (evt.clientX + 20) + 'px';
      tooltip.style.top = (evt.clientY - 30) + 'px';
    }

    const hideTooltip = () => {
      const tooltip = document.querySelector(".tooltip");
      tooltip.style.display = "none";
    }

    onMounted(() => {
      handleMapChange(datasetValues.value);
    });

    watchEffect(() => {
      datasetValues.value = props.mapData;
      handleMapChange(datasetValues.value);
    });

    watch(
      () => props.mapTooltip,
      () => {
        const circle = document.querySelector(`[data-title="${props.mapTooltip.name}"]`)
        if (!circle) {
          return;
        }

        if (props.mapTooltip.opened) {
          const parentElement = circle.parentNode;
          parentElement.appendChild(circle);
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
      mapRange
    }
  },
  template: `
    <n-card
      id="map-range"
      style="max-width: 40px"
      content-style="padding: 0px; display: flex; flex-direction: column; align-items: center; gap: 12px; font-size: 12px;"
    >
      <span style="padding: 12px 0px 0px">100%</span>
      <svg ref="mapRangeSVG" width="40" style="overflow: visible"></svg>
      <span style="padding: 0px 0px 12px">0%</span>
    </n-card>
    <div class="tooltip mct-tooltip"></div>
  `,
}
