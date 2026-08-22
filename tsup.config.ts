import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/utils/*.ts", "src/browser/*.ts", "src/node/*.ts", "src/echarts/index.ts"],
    dts: true,
    treeshake: true,
    format: ["esm", "cjs"],
    outDir: "dist",
    clean: true,
    minify: true,
    sourcemap: false,
    external: ["react", "react-dom"],
    splitting: false,
});
