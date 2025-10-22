import { applyLang, getStr } from "./i18n"
import { formateTimestamp } from "../utils"

let str = {}

let mode = 0 // 1: security logs, 2: network logs
let language = null
const Logs = []
const defaultFilters = {
    security: {
        levels: [1, 2, 3],
        columns: ["id", "time", "level", "event", "details"]
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
    document.getElementById("home-btn").addEventListener("click", switchToHomeScreen)
    document.querySelectorAll(".close-dialog-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.parentNode.parentNode.parentNode.close()
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
    greeting.querySelector(".security-logs > button").addEventListener("click", () => {
        mode = 1
        input.click()
    })
    greeting.querySelector(".network-logs button").addEventListener("click", () => {
        mode = 2
        input.click()
    })
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
    function checkValidity() {
        applyBtn.disabled =
            mode == 1 ?
            securityLogsFilters.querySelectorAll(".columns input:checked").length == 0 ||
            securityLogsFilters.querySelectorAll(".levels input:checked").length == 0 :
            networkLogsFilters.querySelectorAll(".columns input:checked").length == 0 ||
            networkLogsFilters.querySelectorAll(".types input:checked").length == 0
    }
    document.getElementById("open-filters-btn").addEventListener("click", () => {
        if (mode == 1) {
            securityLogsFilters.querySelectorAll(".columns input").forEach(it => {
                it.checked = filters.security.columns.includes(it.name)
            })
            securityLogsFilters.querySelectorAll(".levels input").forEach(it => {
                it.checked = filters.security.levels.includes(parseInt(it.name))
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
        document.querySelector("#filters .security-logs").classList.add("hidden")
    }
    if (mode == 2) {
        document.querySelector("table.network-logs").classList.add("hidden")
        document.querySelector("table.network-logs tbody").replaceChildren()
        document.querySelector("#filters .network-logs").classList.add("hidden")
    }
    document.querySelector("title").innerText = "OwnDroid"
    filters = structuredClone(defaultFilters)
    mode = 0
}

function switchToLogsViewerScreen() {
    document.getElementById("home-btn").classList.remove("hidden")
    document.querySelector("#topbar > a").classList.add("hidden")
    document.getElementById("greeting").classList.add("hidden")
    document.getElementById("open-filters-btn").classList.remove("hidden")
    if (mode == 1) {
        document.querySelector("table.security-logs").classList.remove("hidden")
        document.querySelectorAll("table.security-logs th").forEach(it => it.classList.remove("hidden"))
        document.querySelector("#filters .security-logs").classList.remove("hidden")
        loadSecurityLogs()
    }
    if (mode == 2) {
        document.querySelector("table.network-logs").classList.remove("hidden")
        document.querySelectorAll("table.network-logs th").forEach(it => it.classList.remove("hidden"))
        document.querySelector("title").innerText = str.network_logs_viewer
        document.querySelector("#filters .network-logs").classList.remove("hidden")
        loadNetworkLogs()
    }
}

function loadSecurityLogs() {
    const tbody = document.querySelector("table.security-logs tbody")
    tbody.replaceChildren()
    for (const log of Logs) {
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.classList.add("id")
        tId.innerText = log.id
        const tTime = document.createElement("td")
        tTime.classList.add("time")
        tTime.innerText = formateTimestamp(log.time)
        const tLevel = document.createElement("td")
        tLevel.classList.add("level")
        tLevel.innerText = mapSecurityLogsLevel(log.level)
        const tEvent = document.createElement("td")
        tEvent.classList.add("event")
        tEvent.innerText = str[`t${log.tag}`]
        const tDetails = document.createElement("td")
        tDetails.classList.add("details")
        parseSecurityLogData(log.tag, log.data, tDetails)
        row.append(tId, tTime, tLevel, tEvent, tDetails)
        row.classList.add(`l${log.level}`)
        tbody.append(row)
    }
}

function parseSecurityLogData(tag, data, container) {
    if (tag == 210002) {
        const code = document.createElement("code")
        code.innerText = data.command
        const pre = document.createElement("pre")
        pre.append(code)
        container.append(pre)
        return
    }
    if (tag == 210003 || tag == 210004) {
        const pre = document.createElement("pre")
        pre.innerText = data.path
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
        container.innerText = r
    }
}

function loadNetworkLogs() {
    const tbody = document.querySelector("table.network-logs tbody")
    tbody.replaceChildren()
    for (const log of Logs) {
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.classList.add("id")
        tId.innerText = log.id
        const tTime = document.createElement("td")
        tTime.classList.add("time")
        tTime.innerText = log.time
        const tPackage = document.createElement("td")
        tPackage.classList.add("package")
        tPackage.innerText = log.package
        const tType = document.createElement("td")
        tType.classList.add("type")
        tType.innerText = log.type
        const tDetails = document.createElement("td")
        tDetails.classList.add("details")
        let details
        if (log.type == "connect") details = `Address: ${log.address}\nPort: ${log.port}`
        else details = `Host: ${log.host}\nAddresses:\n` + log.addresses.join("\n")
        tDetails.innerText = details
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
