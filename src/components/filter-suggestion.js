import { NButton } from "naive-ui";
import { useStore } from 'vuex';

export const filterSuggestion = {
  components:  {
    NButton,
  },
  setup() {
    const store = useStore();
    const elements = [
      {
        title: "Caxumba por UF",
        description: "Mapa da cobertura de caxumba entre 2000 e 2020 por UF",
        granularity: "Estados",
        tab: "map",
        tabBy: "sicks",
        filters: {
          sickImmunizer: "Caxumba",
          type: "Cobertura",
          local: ["AC", "AL", "AM"],
          dose: "1ª dose",
          periodStart: 2000,
          periodEnd: 2020,
          granularity: "Estados",
        }
      },
      {
        title: "Hepatite B por UF",
        description: "Gráfico da cobertura de hepatite b entre 2000 e 2020 por UF",
        granularity: "Estados",
        tab: "chart",
        tabBy: "sicks",
        filters: {
          sickImmunizer: ["Hepatite B"],
          type: "Cobertura",
          local: ["AC", "AL", "SP", "PB"],
          dose: "1ª dose",
          periodStart: 2000,
          periodEnd: 2020,
          granularity: "Estados",
        }
      },
      {
        title: "Difteria por UF",
        description: "Tabela da cobertura de difteria entre 2000 e 2010 por UF",
        granularity: "Estados",
        tab: "table",
        tabBy: "sicks",
        filters: {
          sickImmunizer: ["Difteria"],
          type: "Cobertura",
          local: ["AC", "AL", "MG"],
          dose: "1ª dose",
          periodStart: 2000,
          periodEnd: 2010,
          granularity: "Estados",
        }
      },
      {
        title: "Varicela por Macrorregião de saúde",
        description: "Tabela da cobertura de caricela entre 2000 e 2005 por Macrorregião de saúde",
        granularity: "Estados",
        tab: "table",
        tabBy: "sicks",
        filters: {
          sickImmunizer: ["Varicela"],
          type: "Cobertura",
          local: ["PB", "AL", "AM"],
          dose: "1ª dose",
          periodStart: 2000,
          periodEnd: 2005,
          granularity: "Macrorregião de saúde",
        }
      },
      {
        title: "Febre Amarela (FA) por Macrorregiao de saúde",
        description: "Mapa da cobertura de tetano imunizante entre 2000 e 2020 por UF",
        granularity: "Estados",
        tab: "map",
        tabBy: "immunizers",
        filters: {
          sickImmunizer: "Febre Amarela (FA)",
          type: "Cobertura",
          local: ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"],
          dose: "1ª dose",
          periodStart: 2000,
          periodEnd: 2020,
          granularity: "Estados",
        }
      },
    ];

    const shuffle = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const selectFilter = (element) => {
      store.commit("content/UPDATE_TABBY", { tabBy: element.tabBy })
      store.commit("content/UPDATE_TAB", { tab: element.tab })
      store.commit("content/UPDATE_FORM", {
        ...element.filters,
      })
    }
    return {
      elements: shuffle(elements).slice(-4),
      selectFilter
    };
  },
  template: `
    <div class="filter-suggestion">
      <div style="text-align: center; font-size: 24px; padding-bottom: 48px">
        Selecione um filtro predefinido
      </div>
      <div class="filters-container">
        <n-button
          v-for="element in elements"
          style="display: flex; justify-content: initial; height: 80px;" @click="selectFilter(element)"
        >
          <div style="display: flex; flex-direction: column; gap: 4px">
            <div style="width: 0px">
             {{ element.title }}
            </div>
            <div class="filter-description">{{ element.description }}</div>
          </div>
        </n-button>
      </div>
    </div>
  `,
}
