import { NButton } from "naive-ui";
import { computed, ref } from "vue/dist/vue.esm-bundler";
import { computedVar } from "../utils";
import { useStore } from 'vuex';
import { modalGeneric as ModalGeneric } from './modalGeneric.js';

export const filterSuggestion = {
  components:  {
    NButton,
    ModalGeneric
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

    const extraFilterButton = computed(computedVar({
        store,
        mutation: "content/UPDATE_GENERIC_MODAL_WITH_FILTER_BUTTON",
        field: "extraFilterButton"
      })
    );
    const genericModalTitle = computed(computedVar({
        store,
        mutation: "content/UPDATE_GENERIC_MODAL_TITLE",
        field: "genericModalTitle"
      })
    );
    const genericModal = computed(computedVar({
        store,
        mutation: "content/UPDATE_GENERIC_MODAL",
        field: "genericModal"
      })
    );
    const genericModalShow = computed(computedVar({
        store,
        mutation: "content/UPDATE_GENERIC_MODAL_SHOW",
        field: "genericModalShow"
      })
    );
    const genericModalLoading = computed(computedVar({
        store,
        mutation: "content/UPDATE_GENERIC_MODAL_LOADING",
        field: "genericModalLoading"
      })
    );

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

    const handleExtraButton = async () => {
      genericModalLoading.value = true;
      genericModal.value = null;
      genericModalTitle.value = extraFilterButton.value.title;
      genericModalShow.value = !genericModalShow.value;
      await store.dispatch(
        "content/requestPage",
        ["UPDATE_GENERIC_MODAL", extraFilterButton.value.slug]
      );
      genericModalLoading.value = false;
    }

    return {
      elements,
      handleExtraButton,
      selectFilter,
      extraFilterButton
    };
  },
  template: `
    <div v-if="elements" class="filter-suggestion" :class="extraFilterButton ? '' : 'filter-suggestion-center'">
      <div v-if="extraFilterButton" style="display: flex; justify-content: center; margin-top: 48px; margin-bottom: 64px;">
        <n-button type="success" class="pulse-button" size="large" style="height: 36.5167px" round @click="handleExtraButton">{{ extraFilterButton.title }}</n-button>
      </div>
      <div>
        <div>
          <h2 class="filter-suggestion-title">
            Explore a plataforma usando os filtros acima, ou selecione um dos exemplos abaixo
          </h2>
        </div>
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
    </div>
  `,
}
