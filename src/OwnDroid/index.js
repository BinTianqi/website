import { applyLang, getStr } from "./i18n"
import { formateTimestamp } from "../utils"
import OwnDroidVersion from "./version.json"
import QRCode from "qrcode"

let str = {}

let mode = 0 // 1: security logs, 2: network logs
let language = null
const Logs = []
const defaultFilters = {
    security: {
        levels: [1, 2, 3],
        columns: ["id", "time", "level", "event", "details"],
        tags: [210002, 210001, 210005, 210044, 210039, 210040, 210034, 210029, 210030, 210033, 210031, 210021, 210006,
            210007, 210008, 210026, 210024, 210025, 210032, 210011, 210012, 210015, 210020, 210019, 210013, 210014,
            210010, 210009, 210041, 210043, 210042, 210036, 210035, 210017, 210016, 210018, 210022, 210003, 210004,
            210027, 210028, 210037, 210038, 210023]
    },
    network: {
        columns: ["id", "time", "package", "type", "details"],
        types: ["connect", "dns"]
    }
}
let filters = structuredClone(defaultFilters)

function initializePage() {
    language = localStorage.getItem("language")
    applyLang(language)
    str = getStr()
    initializeGreeting()
    initializeSettingsDialog()
    initializeFiltersDialog()
    initializeQrCodeScreen()
    document.getElementById("home-btn").addEventListener("click", switchToHomeScreen)
    document.querySelectorAll(".close-dialog-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.parentNode.parentNode.close()
        })
    })
}

function initializeGreeting() {
    const greeting = document.getElementById("greeting")
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.addEventListener("input", async () => {
        const [file] = input.files
        Logs.push(...JSON.parse(await file.text()))
        input.value = ""
        switchToLogsViewerScreen()
    })
    greeting.querySelector(".security-logs button").addEventListener("click", () => {
        mode = 1
        input.click()
    })
    greeting.querySelector(".network-logs button").addEventListener("click", () => {
        mode = 2
        input.click()
    })
    greeting.querySelector(".qr-code button").addEventListener("click", () => {
        switchToQrCodeScreen()
    })
}

function initializeQrCodeScreen() {
    const container = document.querySelector("#content > .qr-code")
    container.querySelectorAll(".apk-src input").forEach(it => {
        it.addEventListener("change", () => {
            if (it.value == "izzy") {
                container.querySelector(".testkey").classList.add("hidden")
            } else {
                container.querySelector(".testkey").classList.remove("hidden")
            }
        })
    })
    container.querySelector("button.generate").addEventListener("click", () => {
        const src = container.querySelector("input[name=apk-src]:checked").value
        const testkey = src != "izzy" && container.querySelector("#testkey-checkbox").checked
        generateQrCode(src, testkey)
    })
}

function generateQrCode(apkSrc, testkey) {
    const signature = testkey ? "pA2oClnRcMqpUM8VwYxFTUejmyaYnYtkDs10W6cb9dw" : "5dXbF2p0LFZrpgIKwk2T-r2l9pUtf8yunjpG6YSOg7U"
    let srcUrl
    if (apkSrc == "github") {
        const v = OwnDroidVersion.name
        const testkeyString = testkey ? "-testkey" : ""
        srcUrl = `https://github.com/BinTianqi/OwnDroid/releases/download/${v}/OwnDroid-${v}${testkeyString}.apk`
    } else if (apkSrc == "izzy") srcUrl = `https://apt.izzysoft.de/fdroid/repo/com.bintianqi.owndroid_${OwnDroidVersion.number}.apk`
    const data = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.bintianqi.owndroid/.Receiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": signature,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": srcUrl,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true
    }
    const canvas = document.querySelector("canvas")
    const options = {
        width: 300
    }
    QRCode.toCanvas(canvas, JSON.stringify(data), options, (e) => {
        if (e) console.error(e)
    })
    canvas.classList.remove("hidden")
}

function mapSecurityLogsLevel(l) {
    if (l == 1) return "info"
    else if (l == 2) return "warning"
    else return "error"
}

function initializeFiltersDialog() {
    const dialog = document.getElementById("filters")
    const securityLogsFilters = dialog.querySelector(".security-logs")
    const networkLogsFilters = dialog.querySelector(".network-logs")
    const applyBtn = dialog.querySelector(".apply-btn")
    const tagsDiv = securityLogsFilters.querySelector(".tags")
    for (const tag of defaultFilters.security.tags) {
        const div = document.createElement("div")
        div.classList.add("checkbox")
        const input = document.createElement("input")
        const id = `s-tag${tag}-checkbox`
        input.type = "checkbox"
        input.classList.add("m3")
        input.name = tag.toString()
        input.id = id
        const label = document.createElement("label")
        label.setAttribute("for", id)
        const span1 = document.createElement("span")
        span1.textContent = str["t" + tag.toString()]
        const span2 = document.createElement("span")
        label.append(span1, span2)
        div.append(input, label)
        tagsDiv.append(div)
    }
    function checkValidity() {
        if (mode == 1) {
            const selectedColumns = securityLogsFilters.querySelectorAll(".columns div:not(.hidden) input:checked")
            const selectedLevels = securityLogsFilters.querySelectorAll(".levels div:not(.hidden) input:checked")
            const selectedTags = securityLogsFilters.querySelectorAll(".tags div:not(.hidden) input:checked")
            applyBtn.disabled = selectedColumns.length == 0 || selectedLevels.length == 0 || selectedTags.length == 0
        } else {
            const selectedColumns = networkLogsFilters.querySelectorAll(".columns div:not(.hidden) input:checked")
            const selectedTypes = networkLogsFilters.querySelectorAll(".types div:not(.hidden) input:checked")
            applyBtn.disabled = selectedColumns.length == 0 || selectedTypes.length == 0
        }
    }
    document.getElementById("open-filters-btn").addEventListener("click", () => {
        if (mode == 1) {
            securityLogsFilters.querySelectorAll(".columns input").forEach(it => {
                it.checked = filters.security.columns.includes(it.name)
            })
            securityLogsFilters.querySelectorAll(".levels input").forEach(it => {
                it.checked = filters.security.levels.includes(parseInt(it.name))
            })
            securityLogsFilters.querySelectorAll(".tags input").forEach(it => {
                it.checked = filters.security.tags.includes(parseInt(it.name))
            })
        }
        if (mode == 2) {
            networkLogsFilters.querySelectorAll(".columns input").forEach(it => {
                it.checked = filters.network.columns.includes(it.name)
            })
            networkLogsFilters.querySelectorAll(".types input").forEach(it => {
                it.checked = filters.network.types.includes(it.name)
            })
        }
        dialog.showModal()
    })
    dialog.querySelectorAll("input").forEach(it => {
        it.addEventListener("input", checkValidity)
    })
    applyBtn.addEventListener("click", () => {
        updateFilters()
        dialog.close()
    })
}

function updateFilters() {
    if (mode == 1) {
        const checkedColumns = document.querySelectorAll("#filters .security-logs .columns input:checked")
        const newColumnFilters = [...checkedColumns].map(it => it.name)
        if (!compareArrays(newColumnFilters, filters.security.columns)) {
            filters.security.columns = newColumnFilters
            defaultFilters.security.columns.forEach(column => {
                if (filters.security.columns.includes(column)) {
                    document.querySelectorAll(`table.security-logs :is(th, td).${column}.hidden`).forEach(it => {
                        it.classList.remove("hidden")
                    })
                } else {
                    document.querySelectorAll(`table.security-logs :is(th, td).${column}`).forEach(it => {
                        it.classList.add("hidden")
                    })
                }
            })
        }
        const checkedLevels = document.querySelectorAll("#filters .security-logs .levels input:checked")
        const newLevelFilters = [...checkedLevels].map(it => parseInt(it.name))
        if (!compareArrays(newLevelFilters, filters.security.levels)) {
            filters.security.levels = newLevelFilters
            defaultFilters.security.levels.forEach(level => {
                if (filters.security.levels.includes(level)) {
                    document.querySelectorAll(`table.security-logs tr.l${level}.hidden`).forEach(it => {
                        it.classList.remove("hidden")
                    })
                } else {
                    document.querySelectorAll(`table.security-logs tr.l${level}`).forEach(it => {
                        it.classList.add("hidden")
                    })
                }
            })
        }
        const checkedTags = document.querySelectorAll("#filters .security-logs .tags input:checked")
        const newTagFilters = [...checkedTags].map(it => parseInt(it.name))
        if (!compareArrays(newTagFilters, filters.security.tags)) {
            filters.security.tags = newTagFilters
            defaultFilters.security.tags.forEach(tag => {
                if (filters.security.tags.includes(tag)) {
                    document.querySelectorAll(`table.security-logs tr.t${tag}.hidden`).forEach(it => {
                        it.classList.remove("hidden")
                    })
                } else {
                    document.querySelectorAll(`table.security-logs tr.t${tag}`).forEach(it => {
                        it.classList.add("hidden")
                    })
                }
            })
        }
    }
    if (mode == 2) {
        const checkedColumns = document.querySelectorAll("#filters .network-logs .columns input:checked")
        const newColumnFilters = [...checkedColumns].map(it => it.name)
        if (!compareArrays(newColumnFilters, filters.network.columns)) {
            filters.network.columns = newColumnFilters
            defaultFilters.network.columns.forEach(column => {
                if (filters.network.columns.includes(column)) {
                    document.querySelectorAll(`table.network-logs :is(th, td).${column}.hidden`).forEach(it => {
                        it.classList.remove("hidden")
                    })
                } else {
                    document.querySelectorAll(`table.network-logs :is(th, td).${column}`).forEach(it => {
                        it.classList.add("hidden")
                    })
                }
            })
        }
        const checkedTypes = document.querySelectorAll("#filters .network-logs .types input:checked")
        const newTypeFilters = [...checkedTypes].map(it => it.name)
        if (!compareArrays(newTypeFilters, filters.network.types)) {
            filters.network.types = newTypeFilters
            defaultFilters.network.types.forEach(type => {
                if (filters.network.types.includes(type)) {
                    document.querySelectorAll(`table.network-logs tr.${type}.hidden`).forEach(it => {
                        it.classList.remove("hidden")
                    })
                } else {
                    document.querySelectorAll(`table.network-logs tr.${type}`).forEach(it => {
                        it.classList.add("hidden")
                    })
                }
            })
        }
    }
}

function initializeSettingsDialog() {
    const dialog = document.getElementById("settings")
    const selectLang = document.getElementById("select-lang")
    const applyBtn = dialog.querySelector(".apply-btn")
    document.getElementById("open-settings-btn").addEventListener("click", () => {
        if (language == null) selectLang.value = "default"
        else selectLang.value = language
        applyBtn.disabled = false
        dialog.showModal()
    })
    applyBtn.addEventListener("click", () => {
        const newLang = selectLang.value
        if (newLang != language) {
            if (newLang == "default") {
                language = null
                localStorage.removeItem("language")
            } else {
                language = newLang
                localStorage.setItem("language", language)
            }
            applyLang(language)
            str = getStr()
        }
        dialog.close()
    })
}

function switchToHomeScreen() {
    document.getElementById("home-btn").classList.add("hidden")
    document.querySelector("#topbar > a").classList.remove("hidden")
    document.getElementById("greeting").classList.remove("hidden")
    document.getElementById("open-filters-btn").classList.add("hidden")
    Logs.length = 0
    if (mode == 1) {
        document.querySelector("table.security-logs").classList.add("hidden")
        document.querySelector("table.security-logs tbody").replaceChildren()
        document.querySelectorAll("#filters .security-logs div.hidden").forEach(it => {
            it.classList.remove("hidden")
        })
        document.querySelector("#filters .security-logs").classList.add("hidden")
    }
    if (mode == 2) {
        document.querySelector("table.network-logs").classList.add("hidden")
        document.querySelector("table.network-logs tbody").replaceChildren()
        document.querySelectorAll("#filters .network-logs div.hidden").forEach(it => {
            it.classList.remove("hidden")
        })
        document.querySelector("#filters .network-logs").classList.add("hidden")
    }
    if (mode == 3) {
        document.querySelector("canvas").classList.add("hidden")
        document.querySelector("#content > .qr-code").classList.add("hidden")
    }
    document.querySelector("title").textContent = "OwnDroid"
    filters = structuredClone(defaultFilters)
    mode = 0
}

function switchToLogsViewerScreen() {
    document.getElementById("open-filters-btn").classList.remove("hidden")
    if (mode == 1) {
        document.querySelector("table.security-logs").classList.remove("hidden")
        document.querySelectorAll("table.security-logs th").forEach(it => it.classList.remove("hidden"))
        document.querySelector("#filters .security-logs").classList.remove("hidden")
        loadSecurityLogs()
        statSecurityLogs()
    }
    if (mode == 2) {
        document.querySelector("table.network-logs").classList.remove("hidden")
        document.querySelectorAll("table.network-logs th").forEach(it => it.classList.remove("hidden"))
        document.querySelector("title").textContent = str.network_logs_viewer
        document.querySelector("#filters .network-logs").classList.remove("hidden")
        loadNetworkLogs()
        statNetworkLogs()
    }
}

function switchToQrCodeScreen() {
    mode = 3
    document.getElementById("home-btn").classList.remove("hidden")
    document.querySelector("#topbar > a").classList.add("hidden")
    document.getElementById("greeting").classList.add("hidden")
    document.querySelector("#content > .qr-code").classList.remove("hidden")
}

function statSecurityLogs() {
    const levels = { 1: 0, 2: 0, 3: 0 }
    const tags = {}
    defaultFilters.security.tags.forEach(tag => {
        tags[tag] = 0
    })
    for (const log of Logs) {
        levels[log.level]++
        tags[log.tag]++
    }
    document.querySelectorAll("#filters .security-logs .levels input").forEach(it => {
        const count = levels[it.name]
        if (count == 0) {
            it.parentElement.classList.add("hidden")
        } else {
            it.nextElementSibling.lastElementChild.textContent = `(${count})`
        }
    })
    document.querySelectorAll("#filters .security-logs .tags input").forEach(it => {
        const count = tags[it.name]
        if (count == 0) {
            it.parentElement.classList.add("hidden")
        } else {
            it.nextElementSibling.lastElementChild.textContent = `(${count})`
        }
    })
}

function statNetworkLogs() {
    const types = {
        connect: 0,
        dns: 0
    }
    for (const log of Logs) {
        types[log.type]++
    }
    document.querySelectorAll("#filters .network-logs .types input").forEach(it => {
        const count = types[it.name]
        if (count == 0) {
            it.parentElement.classList.add("hidden")
        } else {
            it.nextElementSibling.lastElementChild.textContent = `(${count})`
        }
    })
}

function loadSecurityLogs() {
    const tbody = document.querySelector("table.security-logs tbody")
    tbody.replaceChildren()
    for (const log of Logs) {
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.classList.add("id")
        tId.textContent = log.id
        const tTime = document.createElement("td")
        tTime.classList.add("time")
        tTime.textContent = formateTimestamp(log.time)
        const tLevel = document.createElement("td")
        tLevel.classList.add("level")
        tLevel.textContent = mapSecurityLogsLevel(log.level)
        const tEvent = document.createElement("td")
        tEvent.classList.add("event")
        tEvent.textContent = str[`t${log.tag}`]
        const tDetails = document.createElement("td")
        tDetails.classList.add("details")
        try {
            parseSecurityLogData(log.tag, log.data, tDetails)
        } catch (e) {
            console.error(e)
        }
        row.append(tId, tTime, tLevel, tEvent, tDetails)
        row.classList.add(`l${log.level}`, `t${log.tag}`)
        tbody.append(row)
    }
}

function parseSecurityLogData(tag, data, container) {
    if (tag == 210002) {
        const code = document.createElement("code")
        code.textContent = data.command
        const pre = document.createElement("pre")
        pre.append(code)
        container.append(pre)
        return
    }
    if (tag == 210003 || tag == 210004) {
        const pre = document.createElement("pre")
        pre.textContent = data.path
        container.append(pre)
        return
    }
    let r
    if (tag == 210005) r =
        str.process_name + data.name + "\n" +
        str.start_time + formateTimestamp(data.time) + "\n" +
        "UID: " + data.uid.toString() + "\n" +
        "PID: " + data.pid.toString() + "\n" +
        "SELinux: " + data.seinfo + "\n" +
        "APK hash: " + data.hash
    else if (tag == 210044) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.user.toString() + "\n" +
        str.backup_service_state + (data.state == 1 ? str.enabled : str.disabled)
    else if (tag == 210039) r =
        str.mac_address + data.mac + "\n" +
        str.successful + data.successful +
        (data.failure_reason ? "\n" + data.failure_reason : "")
    else if (tag == 210040) r =
        "MAC address: " + data.mac +
        (data.reason ? "\n" + data.reason : "")
    else if (tag == 210034) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.camera_state + (data.state == 1 ? str.disabled : str.enabled)
    else if (tag == 210029 || tag == 210030) r =
        str.result + (data.result == 0 ? str.failed : str.succeeded) + "\n" +
        str.cert_subject + data.subject + "\n" +
        (data.user ? str.user + data.user : "")
    else if (tag == 210033) r = str.reason + data.reason
    else if (tag == 210031) r = str.result + data.result == 0 ? str.failed : str.succeeded
    else if (tag == 210021) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.disabled_keyguard_feature_mask + data.mask
    else if (tag == 210007) r =
        (data.result == 1 ? str.succeeded : str.failed) +
        (data.strength == 1 ? "\n" + str.strong_auth_method_used : "")
    else if (tag == 210024 || tag == 210025 || tag == 210026) r =
        (data.result == 0 ? str.failed : str.succeeded) + "\n" +
        str.alias + data.alias + "\n" +
        str.requesting_process_uid + data.uid
    else if (tag == 210032) r =
        str.alias + data.alias + "\n" +
        str.uid + data.uid
    else if (tag == 210020) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.max_failed_password_attempts + data.value
    else if (tag == 210019) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.screen_lock_timeout + data.timeout
    else if (tag == 210013 || tag == 210014) r =
        str.mount_point + data.mount_point + "\n" +
        str.volume_label + data.label
    else if (tag == 210009) r =
        "Verified boot state: " + data.verified_boot_state + "\n" +
        "dm-verity mode: " + data.dm_verity_mode
    else if (tag == 210041 || tag == 210042 || tag == 210043) r =
        str.package_name + data.name + "\n" +
        str.version_code + data.version + "\n" +
        str.user_id + data.user
    else if (tag == 210036) r =
        str.password_complexity + data.complexity + "\n" +
        str.target_user_id + data.user
    else if (tag == 210035) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.password_complexity + data.complexity
    else if (tag == 210017) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user
    else if (tag == 210016) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.password_expiration_timeout + data.expiration
    else if (tag == 210018) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user + "\n" +
        str.password_history_length + data.length
    else if (tag == 210022) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.target_user_id + data.target_user
    else if (tag == 210027 || tag == 210028) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user + "\n" +
        str.user_restriction + data.restriction
    else if (tag == 210037) r =
        "BSSID: " + data.bssid + "\n" +
        str.event + data.type +
        (data.failure_reason ? "\n" + data.failure_reason : "")
    else if (tag == 2100038) r =
        "BSSID: " + data.bssid +
        (data.reason ? "\n" + data.reason : "")
    else r = null
    if (r != null) {
        container.textContent = r
    }
}

function loadNetworkLogs() {
    const tbody = document.querySelector("table.network-logs tbody")
    tbody.replaceChildren()
    for (const log of Logs) {
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.classList.add("id")
        tId.textContent = log.id
        const tTime = document.createElement("td")
        tTime.classList.add("time")
        tTime.textContent = formateTimestamp(log.time)
        const tPackage = document.createElement("td")
        tPackage.classList.add("package")
        tPackage.textContent = log.package
        const tType = document.createElement("td")
        tType.classList.add("type")
        tType.textContent = log.type
        const tDetails = document.createElement("td")
        tDetails.classList.add("details")
        let details
        if (log.type == "connect") details = `Address: ${log.address}\nPort: ${log.port}`
        else details = `Host: ${log.host}\nAddresses:\n` + log.addresses.join("\n")
        tDetails.textContent = details
        row.append(tId, tTime, tPackage, tType, tDetails)
        row.classList.add(log.type)
        tbody.appendChild(row)
    }
}

document.addEventListener("DOMContentLoaded", initializePage)

function compareArrays(array1, array2) {
    if (array1.length != array2.length) return false
    return array1.every((value, index) => array2[index] == value)
}
