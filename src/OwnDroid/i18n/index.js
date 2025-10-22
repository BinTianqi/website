import en from "./en.js"
import zhCn from "./zh-CN.js"

let str

export function applyLang(language) {
    const lang = language == null ? navigator.language : language
    if (lang.startsWith("zh")) {
        str = zhCn
    } else {
        str = en
    }
    document.querySelectorAll("[str]").forEach(it => {
        it.innerText = str[it.getAttribute("str")]
    })
}

export function getStr() {
    return str
}

