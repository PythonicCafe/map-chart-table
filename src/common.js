export const formatToApi = ({
  form,
  tab,
  tabBy
}) => {
  const routerResult = {};
  if (form) {
    for (let formField in form) {
      switch (formField) {
        case "local":
          if (form[formField] && form[formField].length) {
            routerResult[formField] = form[formField];
          }
          break;
        case "periodEnd":
        case "periodStart":
          if (form[formField]) {
            routerResult[formField] = form[formField];
          }
          break;
        case "doses":
        case "granularities":
        case "immunizers":
        case "locals":
        case "sicks":
        case "types":
        case "years":
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
  } else {
    delete routerResult.tab
  }

  if (tabBy) {
    routerResult.tabBy = tabBy;
  } else {
    delete routerResult.tabBy
  }

  return routerResult;
};

