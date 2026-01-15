import { defineConfig } from "cypress";

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1920,
    viewportHeight: 1080,
    setupNodeEvents(on, config) {
      // listeners de eventos aqui
      const envUrl = config.env.baseUrl;
      if (envUrl) {
        config.baseUrl = envUrl;
      }
      return config;
    },
  },
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
    specPattern: "**/*.cy.{js,jsx,ts,tsx}",
  },
});
