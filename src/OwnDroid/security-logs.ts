import type {Log} from "./log-viewer-common.js"
import {t, t2} from "./i18n/index.js"
import {formateTimestamp} from "../utils/index.js"

interface SecurityLogFilters {
    levels: number[]
    columns: string[]
    tags: number[]
}

interface SecurityLogsStat {
    levels: { [key: number]: number }
    tags: { [key: number]: number }
}

export default class SecurityLogsController {
    defaultFilters: SecurityLogFilters = {
        levels: [1, 2, 3],
        columns: ["id", "time", "level", "event", "details"],
        tags: [210002, 210001, 210005, 210044, 210039, 210040, 210034, 210029, 210030, 210033, 210031, 210021, 210006,
            210007, 210008, 210026, 210024, 210025, 210032, 210011, 210012, 210015, 210020, 210019, 210013, 210014,
            210010, 210009, 210041, 210043, 210042, 210036, 210035, 210017, 210016, 210018, 210022, 210003, 210004,
            210027, 210028, 210037, 210038, 210023]
    }
    filters = structuredClone(this.defaultFilters)
    securityLogs: Log[] = []
    view = new SecurityLogsView()
    dialog = new SecurityLogsFiltersDialogView(this.defaultFilters.tags)

    constructor() {
        this.dialog.bindApply((f) => {
            this.filters = f
            this.view.clearTable()
            this.view.render(this.filterLogs(), this.filters)
        })
    }

    loadLogs(data: Log[]) {
        this.securityLogs.push(...data)
        this.view.render(this.securityLogs, this.filters)
        this.dialog.renderStat(this.statSecurityLogs())
    }

    reload() {
        this.view.clearTable()
        this.view.render(this.filterLogs(), this.filters)
    }

    filterLogs(): Log[] {
        return this.securityLogs.filter((log) => {
            return this.filters.levels.includes(log.level) && this.filters.tags.includes(log.tag)
        })
    }

    openFiltersDialog() {
        this.dialog.open(this.filters)
    }

    statSecurityLogs(): SecurityLogsStat {
        const stat: SecurityLogsStat = {
            levels: {1: 0, 2: 0, 3: 0},
            tags: {}
        }
        this.defaultFilters.tags.forEach(tag => {
            stat.tags[tag] = 0
        })
        for (const log of this.securityLogs) {
            stat.levels[log.level]++
            stat.tags[log.tag]++
        }
        return stat
    }

    clear() {
        this.view.clearTable()
        this.filters = structuredClone(this.defaultFilters)
    }
}

class SecurityLogsView {
    view = document.querySelector("#security-logs-view")!!
    thead = this.view.querySelector("thead")!!
    tbody = this.view.querySelector("tbody")!!

    render(logs: Log[], filters: SecurityLogFilters) {
        this.thead.append(SecurityLogsView.renderThead(filters.columns))
        for (const log of logs) {
            this.tbody.append(SecurityLogsView.renderRow(log, filters.columns))
        }
    }

    static renderThead(columns: string[]) {
        const row = document.createElement("tr")
        if (columns.includes("id")) {
            const tId = document.createElement("th")
            tId.textContent = "ID"
            row.append(tId)
        }
        if (columns.includes("time")) {
            const tTime = document.createElement("th")
            tTime.textContent = t("th_time")
            row.append(tTime)
        }
        if (columns.includes("level")) {
            const tLevel = document.createElement("th")
            tLevel.textContent = t("th_level")
            row.append(tLevel)
        }
        if (columns.includes("event")) {
            const tEvent = document.createElement("th")
            tEvent.textContent = t("th_event")
            row.append(tEvent)
        }
        if (columns.includes("details")) {
            const tDetails = document.createElement("th")
            tDetails.textContent = t("th_details")
            row.append(tDetails)
        }
        return row
    }

    static renderRow(log: Log, columns: string[]) {
        const row = document.createElement("tr")
        if (columns.includes("id")) {
            const tId = document.createElement("td")
            tId.textContent = log.id.toString()
            row.append(tId)
        }
        if (columns.includes("time")) {
            const tTime = document.createElement("td")
            tTime.textContent = formateTimestamp(log.time)
            row.append(tTime)
        }
        if (columns.includes("level")) {
            const tLevel = document.createElement("td")
            tLevel.textContent = this.levelToString(log.level)
            row.append(tLevel)
        }
        if (columns.includes("event")) {
            const tEvent = document.createElement("td")
            tEvent.textContent = t2(`t${log.tag}`)
            row.append(tEvent)
        }
        if (columns.includes("details")) {
            const tDetails = SecurityLogsView.renderDetails(log)
            tDetails.classList.add("details")
            row.append(tDetails)
        }
        return row
    }

    static levelToString(l: number) {
        if (l == 1) return "info"
        else if (l == 2) return "warning"
        else return "error"
    }

    static renderDetails(log: Log) {
        const tag = log.tag
        const data = log.data
        const td = document.createElement("td")
        if (tag == 210002) {
            const code = document.createElement("code")
            code.textContent = data.command as string
            const pre = document.createElement("pre")
            pre.append(code)
            td.append(pre)
            return td
        }
        if (tag == 210003 || tag == 210004) {
            const pre = document.createElement("pre")
            pre.textContent = data.path as string
            td.append(pre)
            return td
        }
        let r
        if (tag == 210005) r =
            t("process_name") + data.name + "\n" +
            t("start_time") + formateTimestamp(data.time as number) + "\n" +
            "UID: " + data.uid.toString() + "\n" +
            "PID: " + data.pid.toString() + "\n" +
            "SELinux: " + data.seinfo + "\n" +
            "APK hash: " + data.hash
        else if (tag == 210044) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.user.toString() + "\n" +
            t("backup_service_state") + (data.state == 1 ? t("enabled") : t("disabled"))
        else if (tag == 210039) r =
            t("mac_address") + data.mac + "\n" +
            t("successful") + data.successful +
            (data.failure_reason ? "\n" + data.failure_reason : "")
        else if (tag == 210040) r =
            "MAC address: " + data.mac +
            (data.reason ? "\n" + data.reason : "")
        else if (tag == 210034) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("camera_state") + (data.state == 1 ? t("disabled") : t("enabled"))
        else if (tag == 210029 || tag == 210030) r =
            t("result") + (data.result == 0 ? t("failed") : t("succeeded")) + "\n" +
            t("cert_subject") + data.subject + "\n" +
            (data.user ? t("user") + data.user : "")
        else if (tag == 210033) r = t("reason") + data.reason
        else if (tag == 210031) r = t("result") + (data.result == 0 ? t("failed") : t("succeeded"))
        else if (tag == 210021) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("disabled_keyguard_feature_mask") + data.mask
        else if (tag == 210007) r =
            (data.result == 1 ? t("succeeded") : t("failed")) +
            (data.strength == 1 ? "\n" + t("strong_auth_method_used") : "")
        else if (tag == 210024 || tag == 210025 || tag == 210026) r =
            (data.result == 0 ? t("failed") : t("succeeded")) + "\n" +
            t("alias") + data.alias + "\n" +
            t("requesting_process_uid") + data.uid
        else if (tag == 210032) r =
            t("alias") + data.alias + "\n" +
            "UID: " + data.uid
        else if (tag == 210020) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("max_failed_password_attempts") + data.value
        else if (tag == 210019) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("screen_lock_timeout") + data.timeout
        else if (tag == 210013 || tag == 210014) r =
            t("mount_point") + data.mount_point + "\n" +
            t("volume_label") + data.label
        else if (tag == 210009) r =
            "Verified boot state: " + data.verified_boot_state + "\n" +
            "dm-verity mode: " + data.dm_verity_mode
        else if (tag == 210041 || tag == 210042 || tag == 210043) r =
            t("package_name") + data.name + "\n" +
            t("version_code") + data.version + "\n" +
            t("user_id") + data.user
        else if (tag == 210036) r =
            t("password_complexity") + data.complexity + "\n" +
            t("target_user_id") + data.user
        else if (tag == 210035) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("password_complexity") + data.complexity
        else if (tag == 210017) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user
        else if (tag == 210016) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("password_expiration_timeout") + data.expiration
        else if (tag == 210018) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user + "\n" +
            t("password_history_length") + data.length
        else if (tag == 210022) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("target_user_id") + data.target_user
        else if (tag == 210027 || tag == 210028) r =
            t("admin") + data.admin + "\n" +
            t("admin_user_id") + data.admin_user + "\n" +
            t("user_restriction") + data.restriction
        else if (tag == 210037) r =
            "BSSID: " + data.bssid + "\n" +
            t("event") + data.type +
            (data.failure_reason ? "\n" + data.failure_reason : "")
        else if (tag == 2100038) r =
            "BSSID: " + data.bssid +
            (data.reason ? "\n" + data.reason : "")
        else r = null
        if (r != null) {
            td.textContent = r
        }
        return td
    }

    clearTable() {
        this.thead.replaceChildren()
        this.tbody.replaceChildren()
    }
}

class SecurityLogsFiltersDialogView {
    dialog = document.querySelector("#security-logs-view > dialog") as HTMLDialogElement
    tagsDiv = this.dialog.querySelector("div.tags")!!
    applyBtn = this.dialog.querySelector("button.apply") as HTMLButtonElement

    constructor(tags: number[]) {
        this.createTagCheckboxes(tags)
        this.dialog.querySelector("button.close")!!.addEventListener("click", () => {
            this.dialog.close()
        })
    }

    createTagCheckboxes(tags: number[]) {
        for (const tag of tags) {
            const div = document.createElement("div")
            div.classList.add("checkbox")
            const input = document.createElement("input")
            const id = `s-tag${tag}-checkbox`
            input.type = "checkbox"
            input.classList.add("m3")
            input.dataset.tag = tag.toString()
            input.id = id
            const label = document.createElement("label")
            label.setAttribute("for", id)
            const span1 = document.createElement("span")
            span1.dataset.i18n = "t" + tag.toString()
            span1.textContent = t2("t" + tag.toString())
            const span2 = document.createElement("span")
            label.append(span1, span2)
            div.append(input, label)
            this.tagsDiv.append(div)
        }
    }

    renderStat(stat: SecurityLogsStat) {
        this.dialog.querySelectorAll<HTMLInputElement>(".levels input").forEach(it => {
            const count = stat.levels[parseInt(it.dataset.level!!)]
            it.nextElementSibling!!.lastElementChild!!.textContent = `(${count})`
        })
        this.dialog.querySelectorAll<HTMLInputElement>(".tags input").forEach(it => {
            const count = stat.tags[parseInt(it.dataset.tag!!)]
            it.nextElementSibling!!.lastElementChild!!.textContent = `(${count})`
        })
    }

    open(filters: SecurityLogFilters) {
        this.dialog.querySelectorAll<HTMLInputElement>(".columns input").forEach(it => {
            it.checked = filters.columns.includes(it.dataset.column!!)
        })
        this.dialog.querySelectorAll<HTMLInputElement>(".levels input").forEach(it => {
            it.checked = filters.levels.includes(parseInt(it.dataset.level!!))
        })
        this.dialog.querySelectorAll<HTMLInputElement>(".tags input").forEach(it => {
            it.checked = filters.tags.includes(parseInt(it.dataset.tag!!))
        })
        this.dialog.showModal()
    }

    bindApply(action: (f: SecurityLogFilters) => void) {
        this.applyBtn.addEventListener("click", () => {
            const checkedColumns = this.dialog.querySelectorAll<HTMLInputElement>(".columns input:checked")
            const columnFilters = [...checkedColumns].map(it => it.dataset.column!!)
            const checkedLevels = this.dialog.querySelectorAll<HTMLInputElement>(".levels input:checked")
            const levelFilters = [...checkedLevels].map(it => parseInt(it.dataset.level!!))
            const checkedTags = this.dialog.querySelectorAll<HTMLInputElement>(".tags input:checked")
            const tagFilters = [...checkedTags].map(it => parseInt(it.dataset.tag!!))
            action({
                columns: columnFilters,
                levels: levelFilters,
                tags: tagFilters
            })
            this.dialog.close()
        })
    }
}
