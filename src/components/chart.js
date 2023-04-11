import { DataFetcher } from "../data-fetcher";
import { colors } from "../utils";


export const chart = {
  components: {
    "n-card": naive.NCard,
    "n-select": naive.NSelect,
    "n-empty": naive.NEmpty
  },
  setup() {
    const api = new DataFetcher();
    const chartDefined = Vue.ref(true);
    const optionsSick = Vue.ref(null);
    const valueSick = Vue.ref(null);
    const optionsAcronym = Vue.ref(null);
    const valueAcronym = Vue.ref(null);
    const optionsSicksDisabled = Vue.ref(false);
    const chartElement = Vue.ref(null);

    const setAcronymOptions = async () => {
      let acronyms = await api.request("statesAcronym");
      acronyms = Object.values(acronyms).map(x => x.acronym).sort();
      optionsAcronym.value = acronyms.map((acronym) =>  { return { label: acronym, value: acronym } } );
      valueAcronym.value = acronyms[0];
    }

    const setSicksOptions = async (setDefaultValue = false) => {
      let sicks = [];
      try {
        sicks = await api.request("options");
        optionsSicksDisabled.value = false;
        optionsSick.value = sicks.result.map((sick) =>  { return { label: sick, value: sick } } );
        valueSick.value = null;
        if (setDefaultValue) {
          valueSick.value = [sicks.result[0]];
        }
      } catch {
        valueSick.value = null;
        optionsSicksDisabled.value = true;
      }

    }

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

      const ctx = document.querySelector("#chart").getContext('2d');
      chart = new Chart(ctx, {
        type: 'line',
        responsive: true,
        maintainAspectRatio: false,
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          scales: {
            x: {
              grid: {
                color: "rgba(127,127,127, .3)",
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
              grid: {
                color: "rgba(127,127,127, .3)",
              },
              ticks: {
                color: "rgba(127,127,127, 1)",
                padding: 20,
                font: {
                  size: 14,
                }
              }
            }
          },
          layout: {
            padding: {
              bottom: 20
            }
          },
          plugins: { 
            legend: {
              display: true,
              position: "bottom",
              onClick: null,
              labels: {
                color: "rgba(127,127,127, 1)",
                font: {
                  size: 13,
                  weight: "bold",
                }
              }
            }
          },
        }
      });
    }

    Vue.onMounted(async() => {
      await setAcronymOptions();
      await setSicksOptions(true);
      await setChartData();
    });

    const handleUpdateValueSick = async (e) => {
      valueSick.value = e;
      await setChartData();
    }
    /*
     * 
     * Se for mais de uma doença
     * 1. Pegar a quantidade máxima de anos (set)
     * 2. Fazer o loop nos anos para cada doença e ir setando seus valores para o chartjs
     *
    */
    const setChartData = async () => {
      let results = [];
      const sicks = valueSick.value;
      if(!sicks.length) {
        renderChart();
        return;
      }

      results = await api.request(sicks);

      if (sicks.length === 1) {
        const color = colors[0];
        renderChart(
          Object.keys(results),  
          [
            {
              label: sicks,
              data: Object.values(results).map(state => state[valueAcronym.value]) ,
              backgroundColor: color + "80",
              borderColor: color,
              borderWidth: 3,
            }
          ]
        )
        return;
      }

      const allYears = [];
      for(let sick of sicks) {
        allYears.push(...Object.keys(results[sick]));
      }
      const years = [...new Set(allYears)].sort();

      const result = {};
      for(let sick of sicks) {
        for (let year of years) {
          if (result[sick]) {
            if (results[sick][year]) {
              result[sick].push(results[sick][year][valueAcronym.value]);
            } else {
              result[sick].push(null);
            }
          } else {
            if (results[sick][year]) {
              result[sick] = [results[sick][year][valueAcronym.value]];
            } else {
              result[sick] = [null];
            }
          }
        }
      }

      const data = [];
      let counter = 0;
      for(let [key, value] of Object.entries(result)) {
        const color = colors[counter];
        counter++;
        data.push({
          label: key,
          data: value,
          backgroundColor: color + "80",
          borderColor: color,
          borderWidth: 3,
        });
      }
      renderChart(
        years,  
        data
      )

    }

    const handleUpdateValueAcronym = async (e) => {
      valueAcronym.value = e;
      await setChartData();
    }
    return {
      optionsSick,
      valueSick,
      optionsSicksDisabled,
      handleUpdateValueSick,
      optionsAcronym,
      valueAcronym,
      handleUpdateValueAcronym,
      chartDefined,
      chartElement
    };
  },
  template: `
    <n-card class="test" title="Gráfico">
      <template #header-extra>
        <div class="container-input-card">
          <n-select
            v-model:value="valueAcronym"
            :options="optionsAcronym"
            style="width: 80px"
            placeholder="Lugar"
            @update:value="handleUpdateValueAcronym"
          />
          <n-select
            v-model:value="valueSick"
            multiple
            :options="optionsSick"
            style="width: 250px;"
            placeholder="Selecione doença"
            :disabled="optionsSicksDisabled"
            @update:value="handleUpdateValueSick"
          />
        </div>
      </template>
      <div class="mct-canva mct-canva--chart">
        <canvas ref="chartElement" :class="chartDefined ? '' : 'element-hidden'" id="chart" class="mct-canva__chart"></canvas>
        <n-empty :class="chartDefined ? 'element-hidden' : ''" style="justify-content: center"></n-empty>
      </div>
    </n-card>
  `
};