import { getDefaultState } from "./getDefaultState";
import { disableOptionsByTypeAndDose, disableOptionsByTab, disableOptionsByDoseOrSick } from "../../../utils";

export default {
  CLEAR_STATE(state) {
    state.tab = "map";
    state.tabBy = "sicks";
    state.disableMap = false;
    state.disableChart = false;
    const defaultState = getDefaultState();
    Object.keys(defaultState.form).forEach(key => {
      // Reset only default select fields not options comming from api
      if (!key.endsWith('s')) {
        state.form[key] = defaultState.form[key]
      }
    })
    disableOptionsByTypeAndDose(state);
    disableOptionsByTab(state);
    disableOptionsByDoseOrSick(state);
  },
  UPDATE_FORM(state, payload) {
    for (let [key, value] of Object.entries(payload)){
      if (key === "periodStart") {
        if (!value && state.form.periodEnd) {
          state.form.period = state.form.periodEnd;
        } else {
          state.form.period = value;
        }
      } else if (key === "periodEnd" && !state.form.periodStart) {
        // If update and not periodStart, set period as periodEnd value
        state.form.period = value;
      } else if (key === "sickImmunizer" || key === "dose") {
        disableOptionsByDoseOrSick(state, payload)
      }
      disableOptionsByTypeAndDose(state, key, value);

      state.form[key] = value;
    }

    this.commit("content/CHECK_GRAN_WITH_LOCAL");
  },
  CHECK_GRAN_WITH_LOCAL(state, payload) {
    // Granularities logic
    if (
      state.form.granularity === "Municípios" &&
      state.form.local.length > 1
    ) {
      if (["map", "chart"].includes(state.tab)) {
        this.commit("content/UPDATE_TAB", { tab: "table" });
      }
      state.disableMap = true;
      state.disableChart = true;
    } else if (
      state.form.granularity === "Municípios" ||
      state.form.type === "Meta atingida"
    ) {
      if (state.tab === "chart") {
        this.commit("content/UPDATE_TAB", { tab: "table" });
      }
      state.disableMap = false;
      state.disableChart = true;
    } else {
      state.disableMap = false;
      state.disableChart = false;
    }
  },
  UPDATE_TITLES(state, payload) {
    state.titles = payload;
  },
  UPDATE_FORM_SELECTS(state, payload) {
    for (let [key, value] of Object.entries(payload)) {
      state.form[key] = value;
    }
    disableOptionsByTab(state, payload);
  },
  UPDATE_ABOUT(state, payload) {
    state.about = payload;
  },
  UPDATE_ABOUT_VACCINES(state, payload) {
    state.aboutVaccines = payload;
  },
  UPDATE_LAST_UPDATE_DATE(state, payload) {
    state.lastUpdateDate = payload;
  },
  UPDATE_LINK_CSV(state, payload) {
    state.csvAllDataLink = payload;
  },
  UPDATE_DOSE_BLOCKS_CSV(state, payload) {
    state.csvDoseBlocks = payload;
  },
  UPDATE_LOADING(state, payload) {
    state.loading = payload;
  },
  UPDATE_GLOSSARY(state, payload) {
    state.glossary = payload;
  },
  UPDATE_TAB(state, payload) {
    state.loading = true;
    state.tab = Object.values(payload)[0];
    if (["table", "chart"].includes(Object.values(payload)[0])) {
      if (!state.form.sickImmunizer) {
        state.form.sickImmunizer = [];
      } else if (!Array.isArray(state.form.sickImmunizer)) {
        state.form.sickImmunizer = [state.form.sickImmunizer];
        this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
      }
    } else if (
      state.form.sickImmunizer &&
      Array.isArray(state.form.sickImmunizer) &&
      state.form.sickImmunizer.length > 0
    ) {
      state.form.sickImmunizer = state.form.sickImmunizer[0];
      this.commit("message/INFO", "Seletores atualizados para tipo de exibição selecionada", { root: true });
    } else {
      state.form.sickImmunizer = null;
    }

    this.commit("content/CHECK_GRAN_WITH_LOCAL");
    state.loading = false;
  },
  UPDATE_TABBY(state, payload) {
    disableOptionsByTab(state, payload);
    state.tabBy = Object.values(payload)[0];
    state.form.sickImmunizer = Array.isArray(state.form.sickImmunizer) ? [] : null;
    state.form.dose = null;
    disableOptionsByTypeAndDose(state);
    disableOptionsByDoseOrSick(state);
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
          } else if (formKey === "sickImmunizer" && state.tab !== "map") {
            state.form[formKey] =  Array.isArray(formValue) ? formValue : [formValue];
          } else {
            state.form[formKey] = formValue;
          }
          disableOptionsByTypeAndDose(state, formKey, formValue);
          disableOptionsByDoseOrSick(state, { [formKey]: formValue });
        }
      } else if (key === "tabBy") {
        disableOptionsByTab(state, payload);
        state[key] = value;
        disableOptionsByTab(state, payload);
      } else {
        state[key] = value;
      }
    }
    this.commit("content/CHECK_GRAN_WITH_LOCAL");
  }
}
