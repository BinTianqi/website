import enString from "./en.js"
import zhCnString from "./zh-CN.js"

let strMap = enString

export function applyLang(language: string | null) {
    const lang = language == null ? navigator.language : language
    if (lang.startsWith("zh")) {
        strMap = zhCnString
    } else {
        strMap = enString
    }
    renderPage()
}

function renderPage() {
    document.querySelectorAll("[data-i18n]").forEach(it => {
        it.textContent = strMap[it.getAttribute("data-i18n") as keyof typeof strMap] as string
    })
}

export function t2(id: string) {
    return strMap[id as keyof typeof strMap]
}

export function t(id: keyof typeof strMap) {
    return strMap[id]
}
