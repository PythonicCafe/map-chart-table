import { defineConfig } from "cypress";

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1920,
    viewportHeight: 1080,
    setupNodeEvents(on, config) {
      const envUrl = config.env.baseUrl;
      if (envUrl) {
        config.baseUrl = envUrl;
        const baseText = 'URL acessada: ' + config.baseUrl;

        // Print URL logs
        const lineBox = '─'.repeat(baseText.length);
        const logBoxTop = '┌─' + lineBox + '─┐';
        const logBoxBottom = '└─' + lineBox + '─┘';

        console.log('\n' + logBoxTop);
        console.log('│ ' + baseText + ' '.repeat(lineBox.length - baseText.length) + ' │');
        console.log(logBoxBottom);
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
