import { formatDate } from "./utils";

export const formatToApi = ({
    form,
    tab,
    tabBy
}) => {
  const routerResult = {};
  for (let formField in form) {
    switch (formField) {
      case "sicksImmunizers":
      case "types":
      case "local":
      case "locals":
      case "granuralities":
        if (form[formField] && form[formField].length) {
          routerResult[formField] = form[formField];
        }
        break;
      case "start_date":
      case "end_date":
        if (form[formField]) {
          routerResult[formField] = formatDate(Number(form[formField]));
        }
        break;
      default:
        if (form[formField]) {
          routerResult[formField] = form[formField];
        }
        break;
    }
  }

  if (tab) {
    routerResult.tab = tab;
  }

  if (tabBy) {
    routerResult.tabBy = tabBy;
  }

  return routerResult;
};

