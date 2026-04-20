import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/nuqs.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
});
