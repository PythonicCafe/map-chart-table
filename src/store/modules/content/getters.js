export default {
  mainTitle: state => {
    let title = null;
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
      !form.period ||
      !form.local.length
    ) {
      return;
    }

    if (state.titles) {
      if (state.tab === 'map' && state.titles.map) {
        title = state.titles.map?.title + " em " + form.period;
      } else {
        title = state.titles.table.title;
      }
    }
    return title;
  },
  subTitle: state => {
    let subtitle = null;
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
      !form.period ||
      !form.local.length
    ) {
      return;
    }

    if (state.titles) {
      subtitle = state.tab === 'map' ? state.titles.map?.subtitle : state.titles.table.subtitle;
    }
    return subtitle;
  },
  selectsPopulated: state => {
    const form = state.form;
    if (
      form.sickImmunizer &&
      form.type &&
      form.local.length &&
      form.period &&
      form.granularity
    ) {
      return true;
    }
    return false;
  }
}
