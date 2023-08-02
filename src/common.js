import { formatDate } from "./utils";

export const formatToApi = ({
  form,
  tab,
  tabBy
}) => {
  const routerResult = {};
  if (form) {
    for (let formField in form) {
      switch (formField) {
        case "types":
        case "local":
        case "granuralities":
          if (form[formField] && form[formField].length) {
            routerResult[formField] = form[formField];
          }
          break;
        case "periodStart":
        case "periodEnd":
          if (form[formField]) {
            routerResult[formField] = formatDate(form[formField]);
          }
          break;
        case "locals":
        case "sicksImmunizers":
          // Do Nothing
          break;
        default:
          if (form[formField]) {
            routerResult[formField] = form[formField];
          }
          break;
      }
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

