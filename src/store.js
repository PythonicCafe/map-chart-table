import { createStore } from "vuex";
import { timestampToYear } from "./utils";

const getDefaultState = () => {
  return {
    tab: "map",
    tabBy: "sick",
    form: {
      sick: null,
      sicks: [],
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
  actions: {},
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
    UPDATE_TAB(state, payload) {
      state.tab = Object.values(payload)[0];
      if (["table", "chart"].includes(state.tab)) {
        if (!state.form.sick) {
          state.form.sick = [];
        } else if (!Array.isArray(state.form.sick)) {
          state.form.sick = [state.form.sick];
        }
      } else {
        if (state.form.sick && Array.isArray(state.form.sick)) {
          state.form.sick = state.form.sick[0];
        } else {
          state.form.sick = "";
        }
      }
    },
    UPDATE_TABBY(state, payload) {
      state.tabBy = Object.values(payload)[0];
    }
  },
  getters: {
    mainTitle: state => {
      const sick = state.form.sick;
      const local = state.form.local?.length > 1 ? "Brasil" : state.form.local;
      const period = state.form.period;
      if (sick && (local && local.length) && period) {
        return `Contaminações por ${sick}, ${local}, de ${period}`;
      }
      return;
    },
    subTitle: state => {
      const sick = state.form.sick;
      const local = state.form.local;
      const period = state.form.period;

      if (sick && (local && local.length) && period) {
        return `Contaminações estimadas de ${sick}, considerando população-alvo`;
      }
      return;
    }
  }
})

