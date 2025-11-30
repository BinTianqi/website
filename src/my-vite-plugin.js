import fs from "fs"
import path from "path"

const cache = new Map()

export default function myVitePlugin(iconDirs) {
    return {
        name: "my-vite-plugin",
        enforce: "pre",
        transformIndexHtml(html) {
            return html.replace(/<icon name="(.*)"\s*\/>/g, (match, name) => {
                const cachedIcon = cache.get(name)
                if (!cachedIcon) {
                    for (const iconDir of iconDirs) {
                        const iconPath = path.join(iconDir, `${name}.svg`)
                        if (fs.existsSync(iconPath)) {
                            const icon = fs.readFileSync(iconPath, { encoding: "utf-8" })
                            cache.set(name, icon)
                            return icon
                        }
                    }
                }
                return cachedIcon
            })
        }
    }
}