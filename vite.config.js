export default {
    build: {
        rollupOptions: {
            input: {
                "Home": "index.html",
                "OwnDroid": "apps/OwnDroid/index.html"
            }
        },
        assetsInlineLimit: 0,
        sourcemap: true
    }
}
