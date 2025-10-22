import fs from "fs"
import path from "path"

const cache = new Map()

export default function myVitePlugin(srcPath) {
    return {
        name: "my-vite-plugin",
        enforce: "pre",
        transformIndexHtml(html) {
            return html.replace(/<icon name="(.*)"\s*\/>/g, (match, name) => {
                const cachedIcon = cache.get(name)
                if (!cachedIcon) {
                    const iconPath = path.join(srcPath, `icons/svgs/${name}.svg`)
                    const icon = fs.readFileSync(iconPath, { encoding: "utf-8" })
                    cache.set(name, icon)
                    return icon
                }
                return cachedIcon
            })
        }
    }
}