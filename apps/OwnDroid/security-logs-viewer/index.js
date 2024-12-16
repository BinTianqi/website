import str from "./i18n"
import { applyLang } from "./i18n"
import { esc } from "/utils.js"

var page = 1
var securityLogs = []
const logFilters = {
    columns: ["id", "time", "level", "event", "details"]
}

async function initializePage() {
    const tbody = document.querySelector("tbody")
    initializeOpenFileDialog()
    initializeSettingsDialog()
    initializeFiltersDialog()
    initializePager()
    document.querySelectorAll(".close-dialog-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.parentNode.parentNode.parentNode.close()
        })
    })
}

function initializeOpenFileDialog() {
    const dialog = document.querySelector("#open-file")
    document.querySelector("#open-file-btn").addEventListener("click", () => {
        dialog.showModal()
    })
    const fileInput = dialog.querySelector("input[type=file]")
    fileInput.addEventListener("change", async () => {
        const [file] = fileInput.files
        securityLogs = JSON.parse(await file.text())
        await loadSecurityLogs()
        fileInput.value = ""
        dialog.close()
    })
}

function initializeFiltersDialog() {
    const dialog = document.getElementById("filters")
    const displayedColumns = document.getElementById("displayed-columns")
    const applyBtn = dialog.querySelector(".apply-btn")
    function checkValidity() {
        const atLeastOneColumn = displayedColumns.querySelectorAll("input:checked").length > 0
        applyBtn.disabled = !atLeastOneColumn
    }
    document.getElementById("open-filters-btn").addEventListener("click", () => {
        displayedColumns.querySelectorAll("input").forEach((checkbox) => {
            checkbox.checked = logFilters.columns.includes(checkbox.id.split("-")[0])
        })
        checkValidity()
        dialog.showModal()
    })
    displayedColumns.querySelectorAll("input").forEach(checkbox => {
        checkbox.addEventListener("input", () => {checkValidity()})
    })
    applyBtn.addEventListener("click", () => {
        logFilters.columns = []
        displayedColumns.querySelectorAll("input:checked").forEach((checkbox) => {
            logFilters.columns.push(checkbox.id.split("-")[0])
        })
        applyFilters()
        dialog.close()
    })
}

function applyFilters() {
    document.querySelectorAll("th, td").forEach(item => {
        item.classList.add("hidden")
    })
    logFilters.columns.forEach((columnName) => {
        document.querySelectorAll(`.t-${columnName}`).forEach(item => {
            item.classList.remove("hidden")
        })
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
        localStorage.setItem("per_page", inputItemsPerPage.value)
        if(selectLang.value == "default"){
            localStorage.removeItem("lang")
        } else {
            localStorage.setItem("lang", selectLang.value)
        }
        applyLang()
        if(securityLogs.length > 0) {
            page = 1
            loadSecurityLogs()
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
        loadSecurityLogs()
    })
    document.getElementById("next-page").addEventListener("click", () => {
        page += 1
        loadSecurityLogs()
    })
    inputPageNumber.addEventListener("input", () => {
        document.querySelector("#pager-dialog .apply-btn").disabled = !inputPageNumber.checkValidity()
    })
    dialog.querySelector(".apply-btn").addEventListener("click", () => {
        page = inputPageNumber.value
        loadSecurityLogs()
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
    const maxPage = Math.ceil(securityLogs.length / rowsPerPage)
    pager.classList.remove("hidden")
    previous.disabled = page == 1
    next.disabled = page == maxPage
    document.querySelector("#pager > a").innerText = `${page} / ${maxPage}`
    const jumpToPageInput = dialog.querySelector("input")
    jumpToPageInput.placeholder = `1~${maxPage}`
    jumpToPageInput.max = maxPage
}

function loadSecurityLogs() {
    document.querySelectorAll("tbody > tr").forEach(tr=>{tr.remove()})
    const levelMap = new Map()
    levelMap.set(1, "info")
    levelMap.set(2, "warning")
    levelMap.set(3, "error")
    const tbody = document.querySelector("tbody")
    const perPage = localStorage.getItem("per_page")
    const rowsPerPage = perPage != null ? JSON.parse(perPage) : 100
    reloadPager()
    for(let i = (page - 1) * rowsPerPage; i < page * rowsPerPage; i++) {
        const log = securityLogs[i]
        if(typeof(log) == "undefined") break
        const row = document.createElement("tr")
        row.innerHTML = 
        `<td class="t-id">${log.id}</td>` +
        `<td class="t-time">${log.time_nanos}</td>` +
        `<td class="t-level">${levelMap.get(log.level)}</td>` +
        `<td class="t-event">` + str[`t${log.tag}`] + "</td>" +
        `<td class="t-details">${parseEventData(log.tag, log.data)}</td>`
        tbody.appendChild(row)
    }
    document.querySelector("table").classList.remove("hidden")
    applyFilters()
    document.querySelector("html").scrollTop = 0
    document.getElementById("table-box").scrollLeft = 0
}

async function getSecurityLog() {
    const response = await fetch("SecurityLogs.json")
    return await response.json()
}

function parseEventData(tag, data) {
    const br = "<br>"
    var r = ""
    if(tag == 210002) r = str.command + br + data
    else if(tag == 210005) r =
        str.process_name + esc(data.name) + br +
        str.start_time + data.time.toString() + br +
        "UID: " + data.uid.toString() + br +
        "PID: " + data.pid.toString() + br +
        "SELinux: " + esc(data.seinfo) + br +
        "APK hash: " + data.apk_hash
    else if(tag == 210044) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id.toString() + br +
        str.backup_service_state + data.state.toString()
    else if(tag == 210039) r =
        str.mac_address + data.mac + br +
        str.successful + data.successful +
        (data.failure_reason ? br + data.failure_reason : "")
    else if(tag == 210040) r =
        "MAC address: " + data.mac +
        (data.reason ? br + data.reason : "")
    else if(tag == 210034) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.camera_state + (data.state == 1 ? str.disabled : str.enabled)
    else if(tag == 210029 || tag == 210030) r =
        str.result + (data.result == 0 ? str.failed : str.succeeded) + br +
        str.cert_subject + data.subject + br +
        data.user ? str.user + data.user : ""
    else if(tag == 210033) r = str.reason + data
    else if(tag == 210031) r = str.result + data == 0 ? str.failed : str.succeeded
    else if(tag == 210021) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.disabled_keyguard_feature_mask + data.mask
    else if(tag == 210007) r =
        (data.result == 1 ? str.succeeded : str.failed) + br +
        (data.strength == 1 ? str.strong_auth_method_used : "")
    else if(tag == 210024 || tag == 210025 || tag == 210026) r =
        (data.result == 0 ? str.failed : str.succeeded) + br +
        str.alias + esc(data.alias) + br +
        str.requesting_process_uid + data.uid
    else if(tag == 210032) r =
        str.alias + esc(data.alias) + br +
        str.owner_app_uid + data.uid
    else if(tag == 210020) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.max_failed_password_attempts + data.value
    else if(tag == 210019) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.screen_lock_timeout + data.timeout
    else if(tag == 210013 || tag == 210014) r =
        str.mount_point + data.mount_point + br +
        str.volume_label + data.volume_label
    else if(tag == 210009) r =
        "Verified boot state: " + data.verified_boot_state + br +
        "dm-verity mode: " + data.dm_verity_mode
    else if(tag == 210041 || tag == 210042 || tag == 210043) r =
        str.package_name + data.name + br +
        str.version_code + data.version + br +
        str.user_id + data.user_id
    else if(tag == 210036) r =
        str.password_complexity + data.complexity + br +
        str.target_user_id + data.target_user_id
    else if(tag == 210035) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.password_complexity + data.complexity
    else if(tag == 210017) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id
    else if(tag == 210016) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.password_expiration_timeout + data.timeout
    else if(tag == 210018) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id + br +
        str.password_history_length + data.length
    else if(tag == 210022) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.target_user_id + data.target_user_id
    else if(tag == 210003 || tag == 210004) r = "File path: " + data
    else if(tag == 210027 || tag == 210028) r =
        str.admin + data.admin + br +
        str.admin_user_id + data.admin_user_id + br +
        str.user_restriction + data.restriction
    else if(tag == 210037) r =
        "BSSID: " + data.bssid + br +
        str.event + data.event +
        (data.failure_reason ? br + data.failure_reason : "")
    else if(tag == 2100038) r =
        "BSSID: " + data.bssid +
        (data.reason ? br + data.reason : "")
    else r = ""
    return r
}

document.addEventListener("DOMContentLoaded", async () => {
    await initializePage()
})
