import { timestampToYear, formatDate } from "../../utils";
import { DataFetcher } from "../../data-fetcher";

// TODO: Detect if url is setted before set default state app to avoid unecessary API requests
const getDefaultState = () => {
  return {
    apiUrl: "",
    tab: "map",
    tabBy: "sicks",
    legend: "Fonte: Programa Nacional de Imunização (PNI), disponibilizadas no TabNet-DATASUS",
    form: {
      sickImmunizer: null,
      sicks: [],
      immunizers: [],
      type: null,
      types: [],
      local: [],
      locals: [],
      dose: null,
      doses: [],
      period: null,
      periods: null,
      periodStart: null,
      periodEnd: null,
      granularity: null,
      granularities: [],
    }
  }
}

export default {
  namespaced: true,
  state () {
    return getDefaultState();
  },
  actions: {
    async updateFormSelect(
      { commit, state }
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = {};
      for (let [key, value] of Object.entries(await api.request("options"))) {
        value.sort();
        payload[key] = value.map(x => { return { label: x, value: x } });
      }
      // Select all in locals select
      payload.locals.unshift({ label: "Todos", value: "Todos" });
      commit("UPDATE_FORM_SELECTS", payload);
    },
    async requestData(
      { state },
      {
        detail = false,
        stateNameAsCode = true,
        stateTotal = false
      } = {}
    ) {
      const api = new DataFetcher(state.apiUrl);
      const form = state.form;

      // Return null if form fields not filled
      if (
        !form.type ||
        !form.granularity ||
        !form.sickImmunizer ||
        !form.periodStart ||
        !form.periodEnd ||
        !form.local
      ) {
        return;
      }

      let request ="?tabBy=" + state.tabBy + "&type=" + form.type + "&granularity=" + form.granularity +
        "&sickImmunizer=" + form.sickImmunizer + "&dose=" + form.dose + "&periodStart=" +
        formatDate(form.periodStart) + "&periodEnd=" + formatDate(form.periodEnd) + "&local=" + form.local;
      if (detail) {
        request += "&detail=true";
      }
      if (stateTotal) {
        request += "&stateTotal=true";
      }

      const isStateData = form.local.length > 1;
      const [result, localNames] = await Promise.all([
        api.requestQs(request),
        api.request(isStateData ? "statesNames" : "citiesNames")
      ]);

      if (!result) {
        return { result: {}, localNames: {} }
      }

      if (form.type !== "Doses aplicadas" && state.tab !== "chart") {
        result.data.forEach((x, i) => x[2] = i > 0 ? (x[2] + "%") : x[2])
      } else if (form.type === "Doses aplicadas") {
        result.data.forEach((x, i) => {
          let number = x[2];
          return x[2] = i > 0 ? number.toLocaleString('pt-BR') : x[2];
        })
      }

      // Fix data to display state names as code
      if (result && isStateData && stateNameAsCode) {
        const newResult = [];
        const data = result.data;
        for (let i=1; i < data.length; i++) {
          const currentData = data[i];
          const code = Object.entries(localNames).find(x => x[1].acronym === currentData[1])[0];
          currentData[1] = code;
          newResult.push(currentData);
        }
        // Add header
        newResult.unshift(data[0]);
        result.data = newResult;
      }
      return { ...result, localNames };
    },
  },
  mutations: {
    UPDATE_FORM(state, payload) {
      for (let [key, value] of Object.entries(payload)){
        if (key === "periodStart" && value) {
          state.form.period = timestampToYear(value);
          if (!state.form.periodEnd) {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 1)
            state.form.periodEnd = Number(date);
          }
        } else if (key === "periodEnd" && value ) {
          state.form.period = state.form.periodStart ? timestampToYear(state.form.periodStart) : timestampToYear(value);
        }
        state.form[key] = value;
      }
    },
    UPDATE_FORM_SELECTS(state, payload) {
      state.form = { ...state.form, ...payload };
    },
    UPDATE_TAB(state, payload) {
      state.tab = Object.values(payload)[0];
      if (["table", "chart"].includes(Object.values(payload)[0])) {
        if (!state.form.sickImmunizer) {
          state.form.sickImmunizer = [];
        } else if (!Array.isArray(state.form.sickImmunizer)) {
          state.form.sickImmunizer = [state.form.sickImmunizer];
          this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
        }
      } else {
        if (
          state.form.sickImmunizer &&
          Array.isArray(state.form.sickImmunizer) &&
          state.form.sickImmunizer.length > 0
        ) {
          state.form.sickImmunizer = state.form.sickImmunizer[0];
          this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
        } else {
          state.form.sickImmunizer = null;
        }
      }
    },
    UPDATE_TABBY(state, payload) {
      state.tabBy = Object.values(payload)[0];
      state.form.sickImmunizer = null;
    },
    SET_API(state, payload) {
      state.apiUrl = payload;
    },
    UPDATE_FROM_URL(state, payload) {
      for (let [key, value] of Object.entries(payload)) {
        if (key === "form") {
          for (let [formKey, formValue] of Object.entries(value)) {
            if (Array.isArray(state.form[formKey])) {
              state.form[formKey] = state.form[formKey].concat( ...state.form[formKey], formValue );
            } else {
              if (formKey === "sickImmunizer" && state.tab !== "map") {
                state.form[formKey] =  Array.isArray(formValue) ? formValue : [formValue];
              } else {
                state.form[formKey] = formValue;
              }
            }
          }
        } else {
          state[key] = value;
        }
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
}


