import { defineConfig } from "vite";
import path from "path";
import { version } from "./package.json";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build';
  return {
    resolve: {
      alias: {
        'chartjs': 'chart.js',
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      }
    },
    build: {
      minify: true,
      lib: {
        entry: path.resolve(__dirname, "src/main.js"),
        name: "MCT",
        fileName: () => `mct-${version}.js`,

        formats: ['umd']
      },
      rollupOptions: {
        output: {
          assetFileNames: `mct-${version}.[ext]`,
        },
      },
    },
    define: {
      'process.env.NODE_ENV': isBuild ? '"production"' : '"development"',
      '__VUE_OPTIONS_API__': !isBuild,
      '__VUE_PROD_DEVTOOLS__': !isBuild,
      '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': !isBuild
    }
  }
});
