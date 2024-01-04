import { ref, onMounted, watch, computed } from "vue/dist/vue.esm-bundler";
import { NSelect, NEmpty, NSpin } from "naive-ui";
import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip, CategoryScale, Legend } from 'chartjs';
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useStore } from "vuex";

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

          const text = document.createTextNode(splitTextToChart(item.text));
          textContainer.appendChild(text);

          li.appendChild(boxSpan);
          li.appendChild(textContainer);
          ul.appendChild(li);
        });
      }
    };

    const splitTextToChart = (label) => {
      let labelSplited = label.split(" ");
      let lastLabel = labelSplited[labelSplited.length -1]
      if (label.includes(",")) {
        labelSplited = label.split(",");
        lastLabel = labelSplited[1].split(" ")[0] + " " + labelSplited[1].split(" ")[2].substr(0, 3);
      }
      return `${labelSplited[0].substr(0, 3)}. ${lastLabel}`;
    }

    const formatter = (value, context, signal) => {
      const dataset = context.dataset.data;
      // Get last populated year data index from dataset
      let count = 1;
      while(
        dataset[dataset.length - count] === null) {
        count++
      }
      if (context.dataIndex === dataset.length - count) {
        const label = splitTextToChart(context.dataset.label);
        return `${label} ${value} ${signal}`;
      }

      return null;
    }
    const formatterTooltip = (context, signal) => {
      let label = context.dataset.label || '';
      if (label) {
        label += ': ';
      }
      if (context.parsed.y !== null) {
        label += context.parsed.y + signal;
      }
      return label;
    }

    let chart = null;
    const renderChart = (labels, datasets) => {
      if (!labels && !datasets) {
        const legend = document.querySelector("#legend-container");
        if(legend) {
          legend.innerHTML = "";
        }
        chartDefined.value = false;
        return;
      }
      chartDefined.value = true;

      let signal = "";
      if (store.state.content.form.type !== "Doses aplicadas") {
        signal =  "%";
        datasets[0].data = datasets[0].data.map(x => Number(x).toFixed(2));
      }
      if (chart) {
        chart.data.labels = labels;
        chart.data.datasets = datasets;
        chart.options.scales.y.ticks.callback = function(value) {
          return value + signal;
        };
        chart.options.plugins.datalabels.formatter = (value, context) => formatter(value, context, signal);
        chart.options.plugins.tooltip.callbacks.label = (context) => formatterTooltip(context, signal);
        chart.update();
        return;
      }
      const plugin = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart, args, options) => {
          const {ctx} = chart;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = options.color || 'white';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      };
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
                    return value + signal;
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
                borderRadius: '50',
                padding: '3',
                backgroundColor: 'rgba(255,255,255, 0.95)',
                color: function(context) {
                  return context.dataset.borderColor;
                },
                font: {
                  size: 10,
                  weight: 'bold',
                },
                display: 'auto',
                formatter: (value, context) => formatter(value, context, signal),
              },
              tooltip: {
                callbacks: {
                  label: (context) => formatterTooltip(context, signal)
                }
              }
            },
            layout: {
              padding: {
                right: 100
              }
            },
          },
          plugins: [htmlLegendPlugin, plugin],
        });
      } catch (e) {
        // Do nothing
      }
    }

    const setChartData = async () => {

      const result = await store.dispatch("content/requestData", {
        detail: true,
        stateNameAsCode: false,
        stateTotal: true,
      });

      if (!result || !result.data) {
        renderChart();
        return {};
      }

      const dataArray = result.data;
      const data = {};
      let years = [];
      let locals = [];

      // Loop through the dataArray starting from the second element to not get header
      let localNames = [];
      let counter = 0;
      for (let i = 1; i < dataArray.length; i++) {
        let [year, local, value, population, doses, sickImmunizer] = dataArray[i];
        if (!isNaN(local)) {
          local = result.localNames.find(x => x[0] == local)
        }
        if (!localNames.includes(local + sickImmunizer)){
          counter++;
          if (counter > 9) {
            continue;
          }
          localNames.push(local + sickImmunizer);
        }

        if (!data[sickImmunizer]) {
          data[sickImmunizer] = {};
        }
        if (!data[sickImmunizer][year]) {
          data[sickImmunizer][year] = {};
        }
        data[sickImmunizer][year][local] = value;
        years.push(year);
        locals.push(local);
      }

      // Extract unique years and locals
      years = [...new Set(years)].sort();
      locals = [...new Set(locals)];

      // Formating data to chartResult
      const chartResult = {};
      for (let local of locals) {
        for (let [key, val] of Object.entries(data)) {
          const legend = `${key} ${local}`;
          for (let year of years) {
            if (!chartResult[legend]) {
              chartResult[legend] = [];
            }
            if (val[year] && val[year][local] != null) {
              chartResult[legend].push(val[year][local]);
            } else {
              chartResult[legend].push(null);
            }
          }
        }
      }

      const colors = [
        '#e96f5f', // Base color
        '#5f9fe9', // Blue
        '#558e5a', // Darker Green
        '#e9c35f', // Yellow
        '#915fe9', // Purple
        '#3ca0a0', // Cyan
        '#ff007f', // Shocking Pink
        '#666666', // Gray
        '#e9a35f'  // Orange
      ];
      const dataChart = [];
      let i = 0;
      for(let [key, value] of Object.entries(chartResult)) {
        const color = colors[i % colors.length];
        dataChart.push({
          label: key,
          data: value,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 2,
        });
        i++;
      }

      renderChart(
        years,
        dataChart
      )
    }

    onMounted(async () => {
      loading.value = true;
      await setChartData();
      loading.value = false;
    });

    watch(
      () =>  {
        const form = store.state.content.form;
        return [
          store.state.content.tabBy,
          form.sickImmunizer,
          form.dose,
          form.type,
          form.local,
          form.granularity,
          form.periodStart,
          form.periodEnd
        ];
      },
      async () => {
        // Avoid render before change tab
        if (Array.isArray(store.state.content.form.sickImmunizer)) {
          loading.value = true;
          await setChartData();
          loading.value = false;
        }
      }
    )

    return {
      chartDefined,
      loading,
      formPopulated: computed(() => store.getters["content/selectsPopulated"])
    };
  },
  template: `
    <n-spin :show="loading">
      <div id="legend-container" style="padding-right: 64px; padding-left: 64px;"></div>
      <div class="mct-canva mct-canva--chart">
        <canvas :class="chartDefined ? '' : 'element-hidden'" id="chart"></canvas>
        <n-empty
          v-if="!loading"
          :class="chartDefined ? 'element-hidden' : ''"
          style="justify-content: center; border: 1px dashed gray; width: 100%; border-radius: .25rem"
          :description="formPopulated ? 'Não existem dados para os filtros selecionados': 'Selecione os filtros desejados para iniciar a visualização dos dados'"
        />
        <div
          v-else
          style="width: 100%"
        ></div>
      </div>
    </n-spin>
  `
};
