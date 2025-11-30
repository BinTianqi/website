import { defineConfig } from "vite"
import myVitePlugin from "./src/my-vite-plugin.js";

export default defineConfig({
    root: "src",
    plugins: [ myVitePlugin(["src/icons/svgs"]) ],
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                "main": "src/index.html",
                "OwnDroid": "src/OwnDroid/index.html"
            }
        },
        assetsInlineLimit: 0
    }
})
