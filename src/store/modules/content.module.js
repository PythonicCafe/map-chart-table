import { timestampToYear, formatDate, sickImmunizerAsText } from "../../utils";
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
      years: null,
      periodStart: null,
      periodEnd: null,
      granularity: "Municípios",
      granularities: [],
    },
    about: null
  }
}

export default {
  namespaced: true,
  state () {
    return getDefaultState();
  },
  actions: {
    async requestMap(
      { state },
      { map } = {}
    ) {
      const api = new DataFetcher(state.apiUrl);
      const result = await api.request(`map/${map}`);
      return result;
    },
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

      if (
        form.sickImmunizer &&
        Array.isArray(form.sickImmunizer) &&
        !form.sickImmunizer.length
      ) {
        return;
      }
      // Return if form fields not filled
      if (
        !form.type ||
        !form.granularity ||
        !form.sickImmunizer ||
        (!form.periodStart && !form.periodEnd) ||
        !form.local
      ) {
        return;
      }

      const sI = Array.isArray(form.sickImmunizer) ? form.sickImmunizer.join("|") : form.sickImmunizer;
      const l = Array.isArray(form.local) ? form.local.join("|") : form.local;
      let request ="?tabBy=" + state.tabBy + "&type=" + form.type + "&granularity=" + form.granularity +
        "&sickImmunizer=" + sI + "&dose=" + form.dose + "&local=" + l;

      request += form.periodStart ? "&periodStart=" + form.periodStart : "";
      request += form.periodEnd ? "&periodEnd=" + form.periodEnd : "";

      if (detail) {
        request += "&detail=true";
      }
      if (stateTotal) {
        request += "&stateTotal=true";
      }

      const isStateData = form.local.length > 1;
      const [result, localNames] = await Promise.all([
        api.request(`data/${request}`),
        api.request(isStateData ? "statesNames" : "citiesNames")
      ]);

      if (!result) {
        return { result: {}, localNames: {} }
      }

      if (form.type !== "Doses aplicadas" && state.tab !== "chart") {
        result.data.slice(1).forEach((x, i) => x[2] = (Number(x[2]).toFixed(2) + "%"))
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
    async requestAbout(
      { state, commit },
      { map } = {}
    ) {
      const api = new DataFetcher(state.apiUrl);
      const payload = await api.request(`about`);
      commit("UPDATE_ABOUT", payload);
    },
  },
  mutations: {
    UPDATE_FORM(state, payload) {
      for (let [key, value] of Object.entries(payload)){
        if (key === "periodStart") {
          state.form.period = !value && state.form.period ? state.form.periodEnd : value;
        } else if (key === "periodEnd") {
          state.form.period = state.form.periodStart ? state.form.periodStart : value;
        }
        state.form[key] = value;
      }
    },
    UPDATE_FORM_SELECTS(state, payload) {
      state.form = { ...state.form, ...payload };
    },
    UPDATE_ABOUT(state, payload) {
      state.about = payload;
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

      state.form.sickImmunizer = Array.isArray(state.form.sickImmunizer) ? [] : null;
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
      const form = state.form;

      const type = form.type;
      let [sickImmunizer, multipleSickImmunizer] = sickImmunizerAsText(form);

      const granularity = form.granularity ? form.granularity.toLowerCase() : form.granularity;
      let period = form.period ? `em ${form.period}` : null;
      if (sickImmunizer && sickImmunizer.length && period && granularity) {
        if (state.tab === "map") {
          if (state.tabBy === "sicks") {
            // TODO: add FX_ETARIA `Cobertura vacinal para ${sickImmunizer} em [faixaEtaria], por ${granularity} em ${period}`
            return `Cobertura vacinal para ${sickImmunizer} por ${granularity} ${period}`;
          } else {
            // TODO: add FX_ETARIA `Cobertura vacinal para ${sickImmunizer} em [faixaEtaria], por ${granularity} em ${period}`
            return `Cobertura de ${sickImmunizer}, por ${granularity} ${period}`;
          }
        } else if (["chart", "table"].includes(state.tab)) {
          if (state.tabBy === "sicks") {
            sickImmunizer = `de vacinas para ${sickImmunizer}`;
            return `${type} ${sickImmunizer} por ${granularity} ${period}`;
          } else {
            if (multipleSickImmunizer) {
              sickImmunizer = `das vacinas ${sickImmunizer}`;
            } else {
              sickImmunizer = `de ${sickImmunizer}`;
            }
            return `${type} ${sickImmunizer} por ${granularity} ${period}`;
          }
        }
      }

      return;
    },
    subTitle: state => {
      const form = state.form;
      let main = "Imunizações";
      let complement = ", considerando população-alvo";
      if (state.tabBy === 'sicks') {
        main = "Contaminações";
        complement = "";
      }
      let [sickImmunizer, multipleSickImmunizer] = sickImmunizerAsText(form);
      const local = form.local;
      const period = form.period;
      const dose = form.dose;
      const granularity = form.granularity ? form.granularity.toLowerCase() : form.granularity;
      const genericSickIm = `Inclui todas as ${dose}s das vacinas de calendário vacinal neste grupo alvo com componente ${sickImmunizer}`;
      if (sickImmunizer && sickImmunizer.length && period && granularity) {
        if (state.tab === "map") {
          // TODO: add fxEtaria;
          if (state.tabBy === "sicks") {
            return genericSickIm;
          } else {
            // TODO: Subtítulo: [DOSE] [CLASSE_DOSE] para [FX_ETARIA]
            return `${dose}`;
          }
        } else if (["chart", "table"].includes(state.tab)) {
          // TODO: add fxEtaria;
          if (state.tabBy === "sicks") {
            return genericSickIm;
          } else {
            // TODO: multiple dose types?
            // TODO: Subtítulo: [SICK_IMMUNIZER] ([DOSE] [CLASSE_DOSE], [FX_ETARIA])
            return `${sickImmunizer} (${dose})`;
          }
        };
      }
      return;
    }
  }
}


