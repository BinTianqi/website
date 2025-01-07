import { applyLang, getStr } from "./i18n"
import { esc } from "../../utils.js"

let str = {}

let page = 1
let logs = []
let allLogs = []
let mode = 0 // 0:greeting, 1:security logs, 2:network logs
let filters = {
    security: {
        levels: ["info", "warning", "error"],
        columns: ["id", "time", "level", "event", "details"]
    },
    network: {
        columns: ["id", "time", "package", "type", "details"],
        types: ["connect", "dns"]
    }
}
let allFilters = {
    security: {
        levels: ["info", "warning", "error"],
        columns: ["id", "time", "level", "event", "details"]
    },
    network: {
        columns: ["id", "time", "package", "type", "details"],
        types: ["connect", "dns"]
    }
}

function initializePage() {
    str = getStr()
    initializeGreeting()
    initializeSettingsDialog()
    initializeFiltersDialog()
    initializePager()
    document.getElementById("home-btn").addEventListener("click", () => {
        reloadBodyContent(0)
    })
    document.querySelectorAll(".close-dialog-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.parentNode.parentNode.parentNode.close()
        })
    })
}

function initializeGreeting() {
    const greeting = document.getElementById("greeting")
    const inputSecurityLogs = document.getElementById("choose-security-logs-file")
    const inputNetworkLogs = document.getElementById("choose-network-logs-file")
    inputSecurityLogs.addEventListener("change", async () => {
        const [file] = inputSecurityLogs.files
        allLogs = JSON.parse(await file.text())
        logs = allLogs
        reloadBodyContent(1)
        inputSecurityLogs.value = ""
    })
    inputNetworkLogs.addEventListener("change", async () => {
        const [file] = inputNetworkLogs.files
        allLogs = JSON.parse(await file.text())
        logs = allLogs
        reloadBodyContent(2)
        inputNetworkLogs.value = ""
    })
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
        if(mode == 1) {
            securityLogsFilters.querySelectorAll(".columns input").forEach(it => {
                it.checked = filters.security.columns.includes(it.name)
            })
            securityLogsFilters.querySelectorAll(".levels input").forEach(it => {
                it.checked = filters.security.levels.includes(it.name)
            })
            securityLogsFilters.classList.remove("hidden")
            networkLogsFilters.classList.add("hidden")
        }
        if(mode == 2) {
            networkLogsFilters.querySelectorAll(".columns input").forEach(it => {
                it.checked = filters.network.columns.includes(it.name)
            })
            networkLogsFilters.querySelectorAll(".types input").forEach(it => {
                it.checked = filters.network.types.includes(it.name)
            })
            networkLogsFilters.classList.remove("hidden")
            securityLogsFilters.classList.add("hidden")
        }
        checkValidity()
        dialog.showModal()
    })
    dialog.querySelectorAll("input").forEach(it => {
        it.addEventListener("input", () => { checkValidity() })
    })
    applyBtn.addEventListener("click", () => {
        if(mode == 1) {
            filters.security.columns = [...securityLogsFilters.querySelectorAll(".columns input:checked")].map(it => it.name)
            const newSecurityLogsLevels = [...securityLogsFilters.querySelectorAll(".levels input:checked")].map(it => it.name)
            if(JSON.stringify(newSecurityLogsLevels) != JSON.stringify(filters.security.levels)) {
                filters.security.levels = newSecurityLogsLevels
                filterSecurityLogsByLevels()
                page = 1
            }
        }
        if(mode == 2) {
            filters.network.columns = [...networkLogsFilters.querySelectorAll("input:checked")].map(it => it.name)
            const newNetworkLogsTypes = [...networkLogsFilters.querySelectorAll(".types input:checked")].map(it => it.name)
            if(JSON.stringify(newNetworkLogsTypes) != JSON.stringify(filters.network.types)) {
                filters.network.types = newNetworkLogsTypes
                filterNetworkLogsByTypes()
                page = 1
            }
        }
        reloadBodyContent()
        dialog.close()
    })
}

function applyColumnFilters() {
    if(mode == 1) allFilters.security.columns.filter(it => !filters.security.columns.includes(it))
        .forEach((columnName) => {
        document.querySelectorAll(`table.security-logs .${columnName}`).forEach(item => {
            item.classList.add("hidden")
        })
    })
    if(mode == 2) allFilters.network.columns.filter(v => !filters.network.columns.includes(v))
        .forEach((columnName) => {
        document.querySelectorAll(`table.network-logs .${columnName}`).forEach(item => {
            item.classList.add("hidden")
        })
    })
}

function filterSecurityLogsByLevels() {
    logs = []
    allLogs.forEach(it => {
        if(filters.security.levels.includes(it.level)) logs.push(it)
    })
}

function filterNetworkLogsByTypes() {
    logs = []
    allLogs.forEach(it => {
        if(filters.network.types.includes(it.type)) logs.push(it)
    })
}

function initializeSettingsDialog() {
    const dialog = document.getElementById("settings")
    const inputRowsPerPage = document.getElementById("rows-per-page")
    const selectLang = document.getElementById("select-lang")
    const applyBtn = dialog.querySelector(".apply-btn")
    function checkValidity() {
        applyBtn.disabled = !inputRowsPerPage.checkValidity()
    }
    inputRowsPerPage.addEventListener("input", () => {
        checkValidity()
    })
    document.getElementById("open-settings-btn").addEventListener("click", () => {
        const perpage = localStorage.getItem("per_page")
        const rowsPerPage = perpage != null ? perpage : 500
        inputRowsPerPage.value = rowsPerPage
        const lang = localStorage.getItem("lang")
        if(lang != null) selectLang.value = lang
        checkValidity()
        dialog.showModal()
    })
    applyBtn.addEventListener("click", () => {
        localStorage.setItem("per_page", inputRowsPerPage.value)
        if(selectLang.value == "default"){
            localStorage.removeItem("lang")
        } else {
            localStorage.setItem("lang", selectLang.value)
        }
        applyLang()
        str = getStr()
        if(logs.length > 0) {
            page = 1
            reloadBodyContent()
        }
        dialog.close()
    })
}

function initializePager() {
    const dialog = document.getElementById("pager-dialog")
    const inputPageNumber = dialog.querySelector("input")
    document.querySelector("#pager a").addEventListener("click", () => {
        inputPageNumber.value = ""
        dialog.showModal()
    })
    document.getElementById("previous-page").addEventListener("click", () => {
        page -= 1
        reloadBodyContent()
    })
    document.getElementById("next-page").addEventListener("click", () => {
        page += 1
        reloadBodyContent()
    })
    inputPageNumber.addEventListener("input", () => {
        document.querySelector("#pager-dialog .apply-btn").disabled = !inputPageNumber.checkValidity()
    })
    dialog.querySelector(".apply-btn").addEventListener("click", () => {
        page = inputPageNumber.value
        reloadBodyContent()
        dialog.close()
    })
}

function reloadPager() {
    const pager = document.getElementById("pager")
    const dialog = document.getElementById("pager-dialog")
    const previous = document.getElementById("previous-page")
    const next = document.getElementById("next-page")
    const perPage = localStorage.getItem("per_page")
    const rowsPerPage = perPage != null ? JSON.parse(perPage) : 100
    const maxPage = Math.ceil(logs.length / rowsPerPage)
    previous.disabled = page <= 1
    next.disabled = page == maxPage
    document.querySelector("#pager > a").innerText = `${page} / ${maxPage}`
    const jumpToPageInput = dialog.querySelector("input")
    jumpToPageInput.placeholder = `1~${maxPage}`
    jumpToPageInput.max = maxPage
}

function reloadBodyContent(changeMode) {
    const securityLogsTable = document.querySelector("table.security-logs")
    const networkLogsTable = document.querySelector("table.network-logs")
    if(changeMode != undefined) {
        mode = changeMode
        const homeBtn = document.getElementById("home-btn")
        const topBarTitle = document.querySelector("#topbar > a")
        const greeting = document.getElementById("greeting")
        const pager = document.getElementById("pager")
        const openFiltersBtn = document.getElementById("open-filters-btn")
        const pageTitle = document.querySelector("title")
        if(mode == 0) {
            topBarTitle.classList.remove("hidden")
            homeBtn.classList.add("hidden")
            greeting.classList.remove("hidden")
            securityLogsTable.classList.add("hidden")
            networkLogsTable.classList.add("hidden")
            openFiltersBtn.classList.add("hidden")
            pager.classList.add("hidden")
            pageTitle.innerText = "OwnDroid"
            allLogs = []
            logs = []
            filters = allFilters
        }
        if(mode == 1 || mode == 2) {
            topBarTitle.classList.add("hidden")
            homeBtn.classList.remove("hidden")
            greeting.classList.add("hidden")
            openFiltersBtn.classList.remove("hidden")
            pager.classList.remove("hidden")
        }
        if(mode == 1) {
            securityLogsTable.classList.remove("hidden")
            pageTitle.innerText = str.security_logs_viewer
        }
        if(mode == 2) {
            networkLogsTable.classList.remove("hidden")
            pageTitle.innerText = str.network_logs_viewer
        }
    }
    if(mode == 1 || mode == 2) {
        reloadPager()
        document.querySelectorAll("th.hidden").forEach(it => { it.classList.remove("hidden") })
    }
    if(mode == 1) {
        securityLogsTable.querySelector("tbody").innerHTML = ""
        loadSecurityLogs()
    }
    if(mode == 2) {
        networkLogsTable.querySelector("tbody").innerHTML = ""
        loadNetworkLogs()
    }
    applyColumnFilters()
    document.querySelector("html").scrollTop = 0
    document.getElementById("content").scrollLeft = 0
}

function loadSecurityLogs() {
    const levelMap = new Map()
    levelMap.set(1, "info")
    levelMap.set(2, "warning")
    levelMap.set(3, "error")
    const tbody = document.querySelector("table.security-logs tbody")
    const perPage = localStorage.getItem("per_page")
    const rowsPerPage = perPage != null ? JSON.parse(perPage) : 100
    for(let i = (page - 1) * rowsPerPage; i < page * rowsPerPage && i < logs.length; i++) {
        const log = logs[i]
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.classList.add("id")
        tId.innerText = log.id
        const tTime = document.createElement("td")
        tTime.classList.add("time")
        tTime.innerText = log.time_nanos
        const tLevel = document.createElement("td")
        tLevel.classList.add("level")
        tLevel.innerText = levelMap.get(log.level)
        const tEvent = document.createElement("td")
        tEvent.classList.add("event")
        tEvent.innerText = str[`t${log.tag}`]
        const tDetails = document.createElement("td")
        tDetails.classList.add("details")
        tDetails.innerText = parseSecurityLogData(log.tag, log.data)
        row.append(tId, tTime, tLevel, tEvent, tDetails)
        tbody.appendChild(row)
    }
}

function parseSecurityLogData(tag, data) {
    var r = ""
    if(tag == 210002) r = str.command + "\n" + data
    else if(tag == 210005) r =
        str.process_name + esc(data.name) + "\n" +
        str.start_time + data.time.toString() + "\n" +
        "UID: " + data.uid.toString() + "\n" +
        "PID: " + data.pid.toString() + "\n" +
        "SELinux: " + esc(data.seinfo) + "\n" +
        "APK hash: " + data.apk_hash
    else if(tag == 210044) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id.toString() + "\n" +
        str.backup_service_state + data.state.toString()
    else if(tag == 210039) r =
        str.mac_address + data.mac + "\n" +
        str.successful + data.successful +
        (data.failure_reason ? br + data.failure_reason : "")
    else if(tag == 210040) r =
        "MAC address: " + data.mac +
        (data.reason ? br + data.reason : "")
    else if(tag == 210034) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.camera_state + (data.state == 1 ? str.disabled : str.enabled)
    else if(tag == 210029 || tag == 210030) r =
        str.result + (data.result == 0 ? str.failed : str.succeeded) + "\n" +
        str.cert_subject + data.subject + "\n" +
        data.user ? str.user + data.user : ""
    else if(tag == 210033) r = str.reason + data
    else if(tag == 210031) r = str.result + data == 0 ? str.failed : str.succeeded
    else if(tag == 210021) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.disabled_keyguard_feature_mask + data.mask
    else if(tag == 210007) r =
        (data.result == 1 ? str.succeeded : str.failed) +
        (data.strength == 1 ? "\n" + str.strong_auth_method_used : "")
    else if(tag == 210024 || tag == 210025 || tag == 210026) r =
        (data.result == 0 ? str.failed : str.succeeded) + "\n" +
        str.alias + esc(data.alias) + "\n" +
        str.requesting_process_uid + data.uid
    else if(tag == 210032) r =
        str.alias + esc(data.alias) + "\n" +
        str.owner_app_uid + data.uid
    else if(tag == 210020) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.max_failed_password_attempts + data.value
    else if(tag == 210019) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.screen_lock_timeout + data.timeout
    else if(tag == 210013 || tag == 210014) r =
        str.mount_point + data.mount_point + "\n" +
        str.volume_label + data.volume_label
    else if(tag == 210009) r =
        "Verified boot state: " + data.verified_boot_state + "\n" +
        "dm-verity mode: " + data.dm_verity_mode
    else if(tag == 210041 || tag == 210042 || tag == 210043) r =
        str.package_name + data.name + "\n" +
        str.version_code + data.version + "\n" +
        str.user_id + data.user_id
    else if(tag == 210036) r =
        str.password_complexity + data.complexity + "\n" +
        str.target_user_id + data.target_user_id
    else if(tag == 210035) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.password_complexity + data.complexity
    else if(tag == 210017) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id
    else if(tag == 210016) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.password_expiration_timeout + data.timeout
    else if(tag == 210018) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id + "\n" +
        str.password_history_length + data.length
    else if(tag == 210022) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.target_user_id + data.target_user_id
    else if(tag == 210003 || tag == 210004) r = str.file_path + "\n" + data
    else if(tag == 210027 || tag == 210028) r =
        str.admin + data.admin + "\n" +
        str.admin_user_id + data.admin_user_id + "\n" +
        str.user_restriction + data.restriction
    else if(tag == 210037) r =
        "BSSID: " + data.bssid + "\n" +
        str.event + data.event +
        (data.failure_reason ? br + data.failure_reason : "")
    else if(tag == 2100038) r =
        "BSSID: " + data.bssid +
        (data.reason ? br + data.reason : "")
    else r = ""
    return r
}

function loadNetworkLogs() {
    const tbody = document.querySelector("table.network-logs tbody")
    const perPage = localStorage.getItem("per_page")
    const rowsPerPage = perPage != null ? JSON.parse(perPage) : 100
    for(let i = (page - 1) * rowsPerPage; i < page * rowsPerPage && i < logs.length; i++) {
        const log = logs[i]
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
        tDetails.innerText = log.type == "connect" ? `Address: ${log.address}\nPort: ${log.port}` : `Host: ${log.host}\nAddresses:\n` + log.addresses.join("\n")
        row.append(tId, tTime, tPackage, tType, tDetails)
        tbody.appendChild(row)
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializePage()
})

