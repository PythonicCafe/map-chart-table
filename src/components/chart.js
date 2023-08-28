import { ref, onMounted, watch, computed } from "vue/dist/vue.esm-bundler";
import { randomHexColor } from "../utils";
import { NSelect, NEmpty, NSpin } from "naive-ui";
import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip, CategoryScale, Legend } from 'chartjs';
import { timestampToYear } from "../utils";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useStore } from "vuex";

// Registrar a escala "category"
Chart.register(CategoryScale, LineController, LineElement, PointElement, LinearScale, Tooltip, Legend, ChartDataLabels);

export const chart = {
  components: {
    NSelect,
    NEmpty,
    NSpin
  },
  setup() {
    const store = useStore();
    const chartDefined = ref(true);
    const loading = ref(true);
    const valueSick = computed(() => store.state.content.form.sickImmunizer);
    const valueAcronym = computed(() => store.state.content.form.local);
    const valueYears = computed(() => {
      const periodStart = store.state.content.form.periodStart;
      const periodEnd = store.state.content.form.periodEnd;
      if (!periodStart) {
        return [];
      }
      let y =  timestampToYear(periodStart);
      const result = [];
      while (y <= timestampToYear(periodEnd)) {
        result.push(y++);
      }
      return result;
    })

    const getOrCreateLegendList = (chart, id) => {
      const legendContainer = document.getElementById(id);
      let listContainer = legendContainer.querySelector('ul');

      if (!listContainer) {
        listContainer = document.createElement('ul');
        listContainer.style.display = 'flex';
        listContainer.style.flexDirection = 'row';
        listContainer.style.flexWrap = 'wrap';
        listContainer.style.margin = 0;
        listContainer.style.padding = 0;

        legendContainer.appendChild(listContainer);
      }

      return listContainer;
    };

    const htmlLegendPlugin = {
      id: 'htmlLegend',
      afterUpdate(chart, args, options) {
        if (!document.getElementById(options.containerID)){
          return;
        }
        const ul = getOrCreateLegendList(chart, options.containerID);

        // Remove old legend items
        while (ul.firstChild) {
          ul.firstChild.remove();
        }

        // Reuse the built-in legendItems generator
        const items = chart.options.plugins.legend.labels.generateLabels(chart);

        items.forEach(item => {
          const li = document.createElement('li');
          li.style.alignItems = 'center';
          li.style.display = 'flex';
          li.style.cursor = 'pointer';
          li.style.flexDirection = 'row';
          li.style.marginLeft = '10px';
          li.style.opacity = item.hidden ? '30%' : '100%';
          li.title = "Clique para" + (item.hidden ? " exibir " : " ocultar ") + "dado no gráfico";

          li.onclick = () => {
            chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
            chart.update();
          };

          // Color box
          const boxSpan = document.createElement('span');
          boxSpan.style.background = item.hidden ? 'gray' : item.fillStyle;
          boxSpan.style.borderColor = item.strokeStyle;
          boxSpan.style.borderWidth = item.lineWidth + 'px';
          boxSpan.style.display = 'inline-block';
          boxSpan.style.borderRadius = '50%';
          boxSpan.style.height = '14px';
          boxSpan.style.marginRight = '4px';
          boxSpan.style.width = '14px';

          // Text
          const textContainer = document.createElement('p');
          textContainer.style.color = item.fontColor ;
          textContainer.style.margin = 0;
          textContainer.style.padding = 0;
          textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

          const text = document.createTextNode(item.text);
          textContainer.appendChild(text);

          li.appendChild(boxSpan);
          li.appendChild(textContainer);
          ul.appendChild(li);
        });
      }
    };

    let chart = null;
    const renderChart = (labels, datasets) => {
      if (!labels && !datasets) {
        const legend = document.querySelector("#legend-container");
        legend.innerHTML = "";
        chartDefined.value = false;
        return;
      }
      chartDefined.value = true;

      if (chart) {
        chart.data.labels = labels;
        chart.data.datasets = datasets;
        chart.update();
        return;
      }

      try {
        const ctx = document.querySelector("#chart").getContext('2d');
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              animateRotate: true,
              animateScale: true
            },
            scales: {
              x: {
                border: {
                  display: false,
                },
                grid: {
                  color: "rgba(127,127,127, .2)",
                },
                ticks: {
                  color: "rgba(127,127,127, 1)",
                  padding: 20,
                  font: {
                    size: 14,
                  }
                }
              },
              y: {
                suggestedMin: 0,
                suggestedMax: 100,
                border: {
                  display: false,
                },
                grid: {
                  color: "rgba(127,127,127, .2)",
                },
                ticks: {
                  callback: function(value) {
                    return value + " %";
                  },
                  color: "rgba(127,127,127, 1)",
                  padding: 20,
                  font: {
                    size: 14,
                  }
                }
              },
            },
            plugins: {
              htmlLegend: {
                // ID of the container to put the legend in
                containerID: 'legend-container',
              },
              legend: {
                display: false
              },
              datalabels: {
                align: function(context) {
                  return 5;
                },
                color: function(context) {
                  return context.dataset.borderColor;
                },
                font: {
                  size: 10,
                  weight: 'bold'
                },
                display: 'auto',
                formatter: function(value, context) {
                  const dataset = context.dataset.data;
                  // Get last populated year data index from dataset
                  let count = 1;
                  while(
                    dataset[dataset.length - count] === null) {
                    count++
                  }
                  if (context.dataIndex === dataset.length - count) {
                    const labelSplited = context.dataset.label.split(" ");
                    return `${labelSplited[0].substr(0, 3)}. ${labelSplited[1]} ${value}%`;
                  }

                  return null;
                },
              }
            },
            layout: {
              padding: {
                right: 100
              }
            },
          },
          plugins: [htmlLegendPlugin],
        });
      } catch (e) {
        // Do nothing
      }
    }

    const setChartData = async () => {
      loading.value = false;

      let results = [];
      let sicks = valueSick.value;
      let years = valueYears.value;
      let locals = valueAcronym.value;

      if(!sicks || (sicks && !sicks.length) || !locals.length || !years.length) {
        renderChart();
        return;
      }

      results = await store.dispatch("content/requestBySick");

      if (!results || !years) {
        return;
      }

      // TODO: API shoud send correct data fomated and we will not need this fix here
      if (!Object.keys(results).find(x => x === sicks[0])) {
        results = { [sicks[0]]: results }
      };

      const resultChart = {};
      for(let sick of sicks) {
        for(let local of locals) {
          const legend = sick + " " + local;
          for (let year of years) {
            if (resultChart[legend]) {
              if (results[sick] && results[sick][year]) {
                resultChart[legend].push(results[sick][year][local]);
              } else {
                resultChart[legend].push(null);
              }
            } else {
              if (results[sick] && results[sick][year]) {
                resultChart[legend] = [results[sick][year][local]];
              } else {
                resultChart[legend] = [null];
              }
            }
          }
        }
      }

      console.log(resultChart)
      const data = [];
      for(let [key, value] of Object.entries(resultChart)) {
        const color = randomHexColor(key.replace(" ", "") + value);
        data.push({
          label: key,
          data: value,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 2,
        });
      }
      renderChart(
        years,
        data
      )

    }

    onMounted(async () => {
      await setChartData();
    });

    watch(
      () => [
        store.state.content.form.granularity,
        store.state.content.form.dose,
        store.state.content.form.local,
        store.state.content.form.periodEnd,
        store.state.content.form.periodStart,
        store.state.content.form.sickImmunizer,
        store.state.content.form.type,
      ],
      async () => {
        await setChartData();
      }
    )

    return {
      chartDefined,
      loading
    };
  },
  template: `
    <n-spin :show="loading">
      <div id="legend-container" style="padding-right: 64px; padding-left: 64px;"></div>
      <div class="mct-canva mct-canva--chart">
        <canvas :class="chartDefined ? '' : 'element-hidden'" id="chart"></canvas>
        <n-empty
          :class="chartDefined ? 'element-hidden' : ''"
          style="justify-content: center; border: 1px dashed gray; width: 100%; border-radius: .25rem"
          description="Selecione valores para serem exibidos"
        />
      </div>
    </n-spin>
  `
};
