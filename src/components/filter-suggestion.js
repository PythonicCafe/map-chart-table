import { NButton } from "naive-ui";
import { useStore } from 'vuex';
import { exampleFilters } from "../exampleFilters";

export const filterSuggestion = {
  components:  {
    NButton,
  },
  setup() {
    const store = useStore();
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
      elements: shuffle(exampleFilters).slice(-4),
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
