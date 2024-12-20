import { NButton } from "naive-ui";
import { computed } from "vue/dist/vue.esm-bundler";
import { useStore } from 'vuex';

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

    const elements = computed(() => {
      const result = store.state.content.autoFilters;
      return result ? shuffle(result).slice(-4) : null;
    })

    return {
      elements,
      selectFilter
    };
  },
  template: `
    <div v-if="elements" class="filter-suggestion">
      <h2 class="filter-suggestion-title">
        Explore a plataforma usando os filtros acima, ou selecione um dos exemplos abaixo
      </h2>
      <div class="filters-container">
        <n-button
          v-for="element in elements"
          style="display: flex; justify-content: initial; height: 80px;"
          @click="selectFilter(element)"
        >
          <div class="filter-container-suggestion">
            <div class="filter-text-suggestion filter-title">
             {{ element.title }}
            </div>
            <div class="filter-text-suggestion filter-description">{{ element.description }}</div>
          </div>
        </n-button>
      </div>
    </div>
  `,
}
