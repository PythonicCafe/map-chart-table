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

    let chart = null;
    const renderChart = (labels, datasets) => {
      if (!labels && !datasets) {
        chartDefined.value = false;
        return;
      }
      chartDefined.value = true;

      if(chart) {
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
                },
                display: 'auto',
                formatter: function(value, context) {
                  const dataset = context.dataset.data;
                  let count = 1;
                  while(dataset[dataset.length - count] === null) {
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

      if(!sicks || !sicks.length || !locals || !locals.length) {
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
      await setChartData();
    });

    watch(
      () => [props.form.local, props.form.sick, props.form.periods],
      async () => {
        await setChartData();
      }
    )

    onBeforeMount(() => {
      if(!Array.isArray(props.form.sick)) {
        emit("update:form",  {
          ...props.form,
          sick: props.form.sick ? [props.form.sick] : []
        })
      }
    })

    return {
      valueSick,
      valueAcronym,
      chartDefined,
      loading
    };
  },
  template: `
    <n-spin :show="loading">
      <div class="mct-canva mct-canva--chart">
        <canvas :class="chartDefined ? '' : 'element-hidden'" id="chart"></canvas>
        <n-empty
          :class="chartDefined ? 'element-hidden' : ''"
          style="justify-content: center"
          description="Nada para ser exibido"
        >
        </n-empty>
      </div>
    </n-spin>
  `
};
