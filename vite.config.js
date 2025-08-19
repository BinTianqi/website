import { defineConfig } from "vite"

export default defineConfig({
    root: "src",
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
