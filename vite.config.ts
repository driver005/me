import { paraglideVitePlugin } from "@inlang/paraglide-js";
import devtoolsJson from "vite-plugin-devtools-json";
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    devtoolsJson(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
      strategy: ["url", "baseLocale"],
    }),
    glsl({
      include: [
        "**/*.glsl",
        "**/*.wgsl",
        "**/*.vert",
        "**/*.frag",
        "**/*.vs",
        "**/*.fs",
      ],

      // This allows Vite to resolve the $lib alias inside your shaders
      root: "src/lib",
      defaultExtension: "glsl",
    }),
  ],
  optimizeDeps: { esbuildOptions: { target: "esnext" } },
  build: { target: "esnext" },
  ssr: {
    noExternal: ["three", "postprocessing"],
  },
});
