import path from "path";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";

export default [
  {
    input: path.resolve(__dirname, "src/index.ts"),
    output: {
      file: path.resolve(__dirname, "dist/index.js"),
      format: "esm",
    },
    plugins: [typescript(), json()],
    external: (id) => /node_modules/.test(id),
  },
  {
    input: path.resolve(__dirname, "src/cli.ts"),
    output: {
      file: path.resolve(__dirname, "dist/cli.js"),
      format: "esm",
    },
    plugins: [
      typescript({
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
          },
        },
      }),
      json(),
    ],
    external: (id) => /node_modules/.test(id),
  },
];
