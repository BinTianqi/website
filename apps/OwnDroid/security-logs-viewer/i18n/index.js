import en from "./en.js"
import zhCn from "./zh-CN.js"
let str
export function applyLang() {
    const langPreference = localStorage.getItem("lang")
    const lang = langPreference == null ? navigator.language : langPreference
    if(lang.split('-')[0] == "zh") {
        str = zhCn
    } else {
        str = en
    }
    document.querySelectorAll("[str]").forEach(it => {
        it.innerText = str[it.getAttribute("str")]
    })
}
applyLang()
export default str

