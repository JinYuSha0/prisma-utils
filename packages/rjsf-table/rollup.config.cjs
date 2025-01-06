import path from 'path';
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      file: path.resolve(__dirname, 'dist/index.js'),
      format: 'cjs',
    },
    plugins: [typescript()],
    external: (id) => /node_modules/.test(id),
  },
  {
    input: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      file: path.resolve(__dirname, 'dist/index.mjs'),
      format: 'esm',
    },
    plugins: [typescript()],
    external: (id) => /node_modules/.test(id),
  },
];
