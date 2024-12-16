export default {
    build: {
        rollupOptions: {
            input: {
                "security-logs-viewer": "apps/OwnDroid/security-logs-viewer/index.html"
            }
        },
        assetsInlineLimit: 0,
        sourcemap: true
    }
}
