import { NConfigProvider, ptBR } from "naive-ui";

export const config = {
  components:  {
    NConfigProvider,
  },
  setup () {
    const lightThemeOverrides = {
      common: {
        primaryColor: "#e96f5f",
        primaryColorHover: "#e96f5f",
        primaryColorPressed: "#e96f5f",
      },
      DataTable: {
        thColorHover: "#e96f5f",
        thColor: "#ececec",
        tdColorStriped: "#ececec",
        thFontWeight:  "500",
        thIconColor: "#e96f5f",
      },
      Slider: {
        indicatorColor: "#e96f5f"
      },
      Pagination: {
        itemBorderRadius: "50%"
      }
    };
    return {
      // Config-provider setup
      ptBR: ptBR,
      lightThemeOverrides,
    }
  },
  template: `
    <NConfigProvider
      :locale="ptBR"
      :theme-overrides="lightThemeOverrides"
    >
      <slot />
    </NConfigProvider>
  `,
}
