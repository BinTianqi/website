import * as l from "./log-viewer-common.js"
import {t2, tSpan, tSpanElem} from "./i18n/index.js"
import {formatTimestamp} from "../utils/index.js"

interface SecurityLogFilters extends l.BaseLogFilters {
    levels: number[]
    tags: number[]
}

interface SecurityLogsStat extends l.BaseLogsStat {
    levels: { [key: number]: number }
    tags: { [key: number]: number }
}

const securityLogColumns: l.LogColumn[] = [
    { id: "id", name: "ID" },
    { id: "time", i18n: "th_time" },
    { id: "level", i18n: "th_level" },
    { id: "event", i18n: "th_event" },
    { id: "details", i18n: "th_details" }
]

const securityLogTags = [
    210002, 210001, 210005, 210044, 210039, 210040, 210034, 210029, 210030,
    210033, 210031, 210021, 210006, 210007, 210008, 210026, 210024, 210025,
    210032, 210011, 210012, 210015, 210020, 210019, 210013, 210014, 210010,
    210009, 210041, 210043, 210042, 210036, 210035, 210017, 210016, 210018,
    210022, 210003, 210004, 210027, 210028, 210037, 210038, 210023
]

export class SecurityLogsScreen extends l.LogsScreen {
    protected defaultFilters: SecurityLogFilters = {
        levels: [1, 2, 3],
        columns: securityLogColumns.map(it => it.id),
        tags: securityLogTags
    }
    filters = structuredClone(this.defaultFilters)

    filterLogs(): l.Log[] {
        return this.logs.filter((log) => {
            return this.filters.levels.includes(log.level) && this.filters.tags.includes(log.tag)
        })
    }

    statLogs(): SecurityLogsStat {
        const stat: SecurityLogsStat = {
            levels: {1: 0, 2: 0, 3: 0},
            tags: {}
        }
        this.defaultFilters.tags.forEach(tag => {
            stat.tags[tag] = 0
        })
        for (const log of this.logs) {
            stat.levels[log.level]++
            stat.tags[log.tag]++
        }
        return stat
    }

    dialog = this.querySelector("security-logs-filter") as SecurityLogsFilterDialog

    override connectedCallback() {
        super.connectedCallback()
        this.renderThead(securityLogColumns)
    }

    renderRow(log: l.Log) {
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.textContent = log.id.toString()
        tId.classList.add("id")
        const tTime = document.createElement("td")
        tTime.textContent = formatTimestamp(log.time)
        tTime.classList.add("time")
        const tLevel = document.createElement("td")
        tLevel.textContent = SecurityLogsScreen.levelToString(log.level)
        tLevel.classList.add("level")
        const tEvent = document.createElement("td")
        tEvent.dataset.i18n = `t${log.tag}`
        tEvent.textContent = t2(`t${log.tag}`)
        tEvent.classList.add("event")
        const tDetails = SecurityLogsScreen.renderDetails(log)
        tDetails.classList.add("details")
        row.append(tId, tTime, tLevel, tEvent, tDetails)
        return row
    }

    private static levelToString(l: number) {
        if (l == 1) return "info"
        else if (l == 2) return "warning"
        else return "error"
    }

    private static renderDetails(log: l.Log) {
        const tag = log.tag
        const d = log.data
        const td = document.createElement("td")
        // Possible unsafe content that breaks HTML parsing, use DOM API instead
        if (tag == 210002) {
            const code = document.createElement("code")
            code.textContent = d.command as string
            const pre = document.createElement("pre")
            pre.append(code)
            td.append(pre)
            return td
        } else if (tag == 210003 || tag == 210004) {
            const pre = document.createElement("pre")
            pre.textContent = d.path as string
            td.append(pre)
            return td
        } else if (tag == 210005) {
            td.append(
                tSpanElem("process_name"), `${d.name}\n`,
                tSpanElem("start_time"), formatTimestamp(d.time as number), "\n",
                `UID: ${d.uid}\n`,
                `PID: ${d.pid}\n`,
                `SELinux: ${d.seinfo}\n`,
                `APK hash: ${d.hash}`
            )
            return td
        }
        function adminInfoBlock() {
            return `${tSpan("admin")}${d.admin}\n` +
            `${tSpan("admin_user_id")}${d.admin_user}\n` +
            `${tSpan("target_user_id")}${d.target_user}`
        }
        let r
        if (tag == 210044) {
            r = `${tSpan("admin")}${d.admin}\n` +
            `${tSpan("user")}${d.user}\n` +
            `${tSpan("backup_service_state")}${d.state == 1 ? tSpan("enabled") : tSpan("disabled")}`
        } else if (tag == 210039) {
            r = `${tSpan("mac_address")}${d.mac}\n` +
            `${tSpan("successful")}${d.successful}` +
            (d.failure_reason ? "\n" + d.failure_reason : "")
        } else if (tag == 210040) {
            r = `${tSpan("mac_address")}${d.mac}` +
            (d.reason ? "\n" + d.reason : "")
        } else if (tag == 210034) {
            r = adminInfoBlock() + "\n" +
            `${tSpan("camera_state")}${d.state == 1 ? tSpan("disabled") : tSpan("enabled")}`
        } else if (tag == 210029 || tag == 210030) {
            r = `${tSpan("result")}${d.result == 0 ? tSpan("failed") : tSpan("succeeded")}\n` +
            `${tSpan("cert_subject")}${d.subject}\n` +
            (d.user ? tSpan("user") + d.user : "")
        } else if (tag == 210033) {
            r = `${tSpan("reason")}${d.reason}`
        } else if (tag == 210031) {
            r = tSpan("result") + (d.result == 0 ? tSpan("failed") : tSpan("succeeded"))
        } else if (tag == 210021) {
            r = adminInfoBlock() + "\n" +
            `${tSpan("disabled_keyguard_feature_mask")}${d.mask}`
        } else if (tag == 210007) {
            r = (d.result == 1 ? tSpan("succeeded") : tSpan("failed")) +
            (d.strength == 1 ? "\n" + tSpan("strong_auth_method_used") : "")
        } else if (tag == 210024 || tag == 210025 || tag == 210026) {
            r = (d.result == 0 ? tSpan("failed") : tSpan("succeeded")) + "\n" +
            `${tSpan("alias")}${d.alias}\n` +
            `${tSpan("requesting_process_uid")}${d.uid}`
        } else if (tag == 210032) {
            r = `${tSpan("alias")}${d.alias}\n` +
            `UID: ${d.uid}`
        } else if (tag == 210020) {
            r = `${tSpan("admin")}${d.admin}\n` +
            `${tSpan("admin_user_id")}${d.user}\n` +
            `${tSpan("target_user_id")}${d.target_user}\n` +
            `${tSpan("max_failed_password_attempts")}${d.value}`
        } else if (tag == 210019) {
            r = adminInfoBlock() + "\n" +
            tSpan("screen_lock_timeout") + d.timeout
        } else if (tag == 210013 || tag == 210014) {
            r = `${tSpan("mount_point")}${d.mount_point}\n` +
            `${tSpan("volume_label")}${d.label}`
        } else if (tag == 210009) {
            r = `Verified boot state: ${d.verified_boot_state}\n` +
            `dm-verity mode: ${d.dm_verity_mode}`
        } else if (tag == 210041 || tag == 210042 || tag == 210043) {
            r = `${tSpan("package_name")}${d.name}\n` +
            `${tSpan("version_code")}${d.version}\n` +
            `${tSpan("user_id")}${d.user}`
        } else if (tag == 210036) {
            r = `${tSpan("password_complexity")}${d.complexity}\n` +
            `${tSpan("target_user_id")}${d.user}`
        } else if (tag == 210035) {
            r = adminInfoBlock() + "\n" +
            `${tSpan("password_complexity")}${d.complexity}`
        } else if (tag == 210017) {
            r = adminInfoBlock()
        } else if (tag == 210016) {
            r = adminInfoBlock() + "\n" +
            `${tSpan("password_expiration_timeout")}${d.expiration}`
        } else if (tag == 210018) {
            r = adminInfoBlock() + "\n" +
            `${tSpan("password_history_length")}${d.length}`
        } else if (tag == 210022) {
            r = adminInfoBlock()
        } else if (tag == 210027 || tag == 210028) {
            r = `${tSpan("admin")}${d.admin}\n` +
            `${tSpan("admin_user_id")}${d.admin_user}\n` +
            `${tSpan("user_restriction")}${d.restriction}`
        } else if (tag == 210037) {
            r = `BSSID: ${d.bssid}\n` +
            `${tSpan("event")}${d.type}` +
            (d.failure_reason ? "\n" + d.failure_reason : "")
        } else if (tag == 2100038) {
            r = `BSSID: ${d.bssid}\n` +
            (d.reason ? "\n" + d.reason : "")
        } else r = null
        if (r != null) {
            td.innerHTML = r
        }
        return td
    }
}

export class SecurityLogsFilterDialog extends l.LogsFilterDialog {
    tagsDiv = this.querySelector("div.tags")!

    override connectedCallback() {
        super.connectedCallback()
        this.renderColumns(securityLogColumns, "s-f-col")
        this.createTagCheckboxes(securityLogTags)
    }

    protected override updateFilters() {
        const checkedColumns = this.querySelectorAll<HTMLInputElement>(".columns input:checked")
        const checkedLevels = this.querySelectorAll<HTMLInputElement>(".levels input:checked")
        const checkedTags = this.querySelectorAll<HTMLInputElement>(".tags input:checked")
        const filters = {
            columns: [...checkedColumns].map(it => it.value),
            levels: [...checkedLevels].map(it => parseInt(it.value)),
            tags: [...checkedTags].map(it => parseInt(it.value))
        } satisfies SecurityLogFilters
        this.dispatchEvent(
            new CustomEvent("filters-updated", {detail: {filters: filters}, bubbles: true})
        )
    }

    private createTagCheckboxes(tags: number[]) {
        for (const tag of tags) {
            const div = document.createElement("div")
            div.classList.add("checkbox")
            const input = document.createElement("input")
            const id = `s-tag${tag}-checkbox`
            input.type = "checkbox"
            input.classList.add("m3")
            input.value = tag.toString()
            input.id = id
            const label = document.createElement("label")
            label.setAttribute("for", id)
            const span1 = document.createElement("span")
            span1.dataset.i18n = `t${tag}`
            span1.textContent = t2(`t${tag}`)
            const span2 = document.createElement("span")
            label.append(span1, span2)
            div.append(input, label)
            this.tagsDiv.append(div)
        }
    }

    renderStat(stat: SecurityLogsStat) {
        this.dialog.querySelectorAll<HTMLInputElement>(".levels input").forEach(it => {
            const count = stat.levels[parseInt(it.value)]
            it.nextElementSibling!.lastElementChild!.textContent = `(${count})`
        })
        this.dialog.querySelectorAll<HTMLInputElement>(".tags input").forEach(it => {
            const count = stat.tags[parseInt(it.value)]
            it.nextElementSibling!.lastElementChild!.textContent = `(${count})`
        })
    }

    override open(filters: SecurityLogFilters) {
        super.open(filters)
        this.dialog.querySelectorAll<HTMLInputElement>(".levels input").forEach(it => {
            it.checked = filters.levels.includes(parseInt(it.value))
        })
        this.dialog.querySelectorAll<HTMLInputElement>(".tags input").forEach(it => {
            it.checked = filters.tags.includes(parseInt(it.value))
        })
    }
}
