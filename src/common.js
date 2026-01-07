/**
 * Formats form data and tab settings into a clean object for API or Router usage.
 * This function filters the `form` object:
 * - Copies 'local' and 'city' only if they have length (are not empty strings/arrays).
 * - Copies 'periodEnd' and 'periodStart' if they exist (are truthy).
 * - Explicitly ignores list fields (e.g., 'cities', 'doses', 'years', etc).
 * - Copies any other keys if they are truthy.
 * - Adds 'tab' and 'tabBy' if provided.
 *
 * @param {Object} params - The input parameters.
 * @param {Record<string, any>} [params.form] - The source form data object containing filters.
 * @param {string|number} [params.tab] - The current active tab identifier.
 * @param {string} [params.tabBy] - The grouping criteria for the tab.
 * @returns {Record<string, any>} A new object containing only the valid/filtered properties.
 */
export const formatToApi = ({ form, tab, tabBy }) => {
    /** @type {Record<string, any>} */
    const routerResult = {}
    if (form) {
        for (let formField in form) {
            switch (formField) {
                case 'local':
                    if (form[formField] && form[formField].length) {
                        routerResult[formField] = form[formField]
                    }
                    break
                case 'city':
                    if (form[formField] && form[formField].length) {
                        routerResult[formField] = form[formField]
                    }
                    break
                case 'periodEnd':
                case 'periodStart':
                    if (form[formField]) {
                        routerResult[formField] = form[formField]
                    }
                    break
                case 'cities':
                case 'doses':
                case 'granularities':
                case 'immunizers':
                case 'locals':
                case 'sicks':
                case 'types':
                case 'years':
                    // Do Nothing
                    break
                default:
                    if (form[formField]) {
                        routerResult[formField] = form[formField]
                    }
                    break
            }
        }
    }

    if (tab) {
        routerResult.tab = tab
    } else {
        delete routerResult.tab
    }

    if (tabBy) {
        routerResult.tabBy = tabBy
    } else {
        delete routerResult.tabBy
    }

    return routerResult
}
