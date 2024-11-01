import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      'chartjs': 'chart.js',
    }
  },
  build: {
    minify: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      name: "MCT",
      fileName: () => `mct.js`,

      formats: ['umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: "mct.[ext]",
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    '__VUE_OPTIONS_API__': true,
    '__VUE_PROD_DEVTOOLS__': true,
    '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': true
  },
});
