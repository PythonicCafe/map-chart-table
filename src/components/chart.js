import { DataFetcher } from "../data-fetcher";
import { ref, onMounted, watch, computed, onBeforeMount } from "vue/dist/vue.esm-bundler";
import { randomHexColor } from "../utils";
import { NSelect, NEmpty, NSpin } from "naive-ui";
import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip, CategoryScale, Legend } from 'chartjs';
import { timestampToYear } from "../utils";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Registrar a escala "category"
Chart.register(CategoryScale, LineController, LineElement, PointElement, LinearScale, Tooltip, Legend, ChartDataLabels);

export const chart = {
  components: {
    NSelect,
    NEmpty,
    NSpin
  },
  props: {
    api: {
      type: String,
      required: true
    },
    form: {
      type: Object,
    },
  },
  setup(props, { emit }) {
    const api = new DataFetcher(props.api);
    const chartDefined = ref(true);
    const loading = ref(true);
    const valueSick = computed(() => props.form.sick);
    const valueAcronym = computed(() => props.form.local);
    const valueYears = computed(() => {
      const periods = props.form.periods;
      if (!Array.isArray(periods)) {
        return [];
      }
      let y =  timestampToYear(periods[0]);
      const result = [];
      while (y <= timestampToYear(periods[1])) {
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
          li.style.flexDirection = 'row';
          li.style.marginLeft = '10px';

          // Color box
          const boxSpan = document.createElement('span');
          boxSpan.style.background = item.fillStyle;
          boxSpan.style.borderColor = item.strokeStyle;
          boxSpan.style.borderWidth = item.lineWidth + 'px';
          boxSpan.style.display = 'inline-block';
          boxSpan.style.borderRadius = '50%';
          boxSpan.style.height = '14px';
          boxSpan.style.marginRight = '4px';
          boxSpan.style.width = '14px';

          // Text
          const textContainer = document.createElement('p');
          textContainer.style.color = item.fontColor;
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

      if(!sicks.length || !locals.length || !years.length) {
        renderChart();
        return;
      }

      results = await api.request(sicks);

      // TODO: API shoud send correct data fomated and we will not need this fix here
      if (!Object.keys(results).find(x => x === sicks[0])) {
        results = { [sicks[0]]: results }
      };

      if (!years) {
        return;
      }

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
      if(!props.form.sick || !Array.isArray(props.form.sick)) {
        await emit("update:form",  {
          ...props.form,
          sick: props.form.sick ? [props.form.sick] : []
        })
      }
      await setChartData();
    });

    watch(
      () => [props.form.local, props.form.sick, props.form.periods],
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
