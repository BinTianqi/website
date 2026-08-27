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
        it.textContent = t2(it.getAttribute("data-i18n")!)
    })
}

/** `t()` with type casting */
export function t2(id: string) {
    const result = strMap[id as keyof typeof strMap]
    if (!result) throw new Error(`i18n resource of ${id} not found`)
    return result
}

export function t(id: keyof typeof strMap) {
    return strMap[id]
}

export function tSpan(id: keyof typeof strMap) {
    return `<span data-i18n="${id}">${t(id)}</span>`
}

export function tSpanElem(id: keyof typeof strMap) {
    const span = document.createElement("span")
    span.dataset.i18n = id
    span.textContent = t(id)
    return span
}
