import { createStore } from "vuex";
import { timestampToYear } from "./utils";
import { DataFetcher } from "./data-fetcher";
import { ufs } from "./exampleData";

const getDefaultState = () => {
  return {
    apiUrl: "",
    tab: "map",
    tabBy: "sicks",
    form: {
      sickImmunizer: null,
      sicksImmunizers: [],
      type: null,
      types: [],
      local: [],
      locals: [],
      period: null,
      periods: null,
      periodStart: null,
      periodEnd: null,
      granurality: null,
      granuralities: [],
    }
  }
}

export default createStore({
  state () {
    return getDefaultState();
  },
  actions: {
    async updateSicksImmunizers(
      { commit, state },
      type
    ) {
      const api = new DataFetcher(state.apiUrl);
      const result = await api.request("options");
      commit("UPDATE_FORM_SICKSIMMUNIZERS", result[type].map(x => { return { label: x, value: x } }));
    },
    updateLocals(
      { commit }
    ) {
      let locals = ufs.map(x => x.label).sort();
      commit("UPDATE_FORM_LOCALS", locals.map((local) =>  { return { label: local, value: local } }));
    },
    async requestBySick(
      { state },
    ) {
      const api = new DataFetcher(state.apiUrl);
      return await api.request(state.form.sickImmunizer);
    },
  },
  mutations: {
    UPDATE_FORM(state, payload) {
      for (let [key, value] of Object.entries(payload)){
        if (key === "periodStart" && value) {
          state.form.period = timestampToYear(value);
          if (!state.form.periodEnd) {
            state.form.periodEnd = Date.now();
          }
        }
        state.form[key] = value;
      }
    },
    UPDATE_FORM_SICKSIMMUNIZERS(state, payload) {
      state.form.sicksImmunizers = payload;
      state.form.sickImmunizer = null;
    },
    UPDATE_FORM_LOCALS(state, payload) {
      state.form.locals = payload;
    },
    UPDATE_TAB(state, payload) {
      state.tab = Object.values(payload)[0];
      if (["table", "chart"].includes(state.tab)) {
        if (!state.form.sickImmunizer) {
          state.form.sickImmunizer = [];
        } else if (!Array.isArray(state.form.sickImmunizer)) {
          state.form.sickImmunizer = [state.form.sickImmunizer];
        }
      } else {
        if (state.form.sickImmunizer && Array.isArray(state.form.sickImmunizer)) {
          state.form.sickImmunizer = state.form.sickImmunizer[0];
        } else {
          state.form.sickImmunizer = "";
        }
      }
    },
    UPDATE_TABBY(state, payload) {
      state.tabBy = Object.values(payload)[0];
    },
    SET_API(state, payload) {
      state.apiUrl = payload;
    },
    UPDATE_FROM_URL(state, payload) {
      for (let [key, value] of Object.entries(payload)) {
        state[key] = value;
      }
    },
  },
  getters: {
    mainTitle: state => {
      const main = state.tabBy === 'sicks' ? 'Contaminações por' : 'Imunização para';
      const sick = Array.isArray(state.form.sickImmunizer) ? state.form.sickImmunizer.join(", ") : state.form.sickImmunizer;
      const local = state.form.local?.length > 1 ? "Brasil" : state.form.local;
      const period = state.form.period;
      if (sick && (local && local.length) && period) {
        return `${main} ${sick}, ${local}, de ${period}`;
      }
      return;
    },
    subTitle: state => {
      let main = "Imunizações";
      let complement = ", considerando população-alvo";
      if (state.tabBy === 'sicks') {
        main = "Contaminações";
        complement = "";
      }
      const sick = Array.isArray(state.form.sickImmunizer) ? state.form.sickImmunizer.join(", ") : state.form.sickImmunizer;
      const local = state.form.local;
      const period = state.form.period;

      if (sick && (local && local.length) && period) {
        return `${main} estimadas de ${sick} ${complement}`;
      }
      return;
    }
  }
})

