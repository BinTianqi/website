import type {Log, LogFiltersDialogView, BaseLogFilters, BaseLogsStat} from "./log-viewer-common.js"
import {LogsController, LogsView} from "./log-viewer-common.js"
import {formateTimestamp} from "../utils/index.js";
import {t} from "./i18n/index.js";

interface NetworkLogFilters extends BaseLogFilters {
    types: string[]
}

interface NetworkLogsStat extends BaseLogsStat {
    type: { [key: string]: number }
}

export default class NetworkLogsController extends LogsController {
    view = new NetworkLogsView()
    dialog = new NetworkLogsFiltersDialogView()
    defaultFilters: NetworkLogFilters = {
        columns: ["id", "time", "package", "type", "details"],
        types: ["connect", "dns"]
    }
    filters = structuredClone(this.defaultFilters)

    filterLogs() {
        return this.logs.filter(log => {
            return this.filters.types.includes(log.type)
        })
    }

    statLogs() {
        const stat: NetworkLogsStat = {
            type: {
                connect: 0,
                dns: 0
            }
        }
        for (const log of this.logs) {
            stat.type[log.type as keyof typeof stat.type]++
        }
        return stat
    }
}

class NetworkLogsView extends LogsView {
    view = document.getElementById("network-logs-view")!!
    thead = this.view.querySelector("thead")!!
    tbody = this.view.querySelector("tbody")!!

    renderThead(columns: string[]) {
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
        if (columns.includes("package")) {
            const tPackage = document.createElement("th")
            tPackage.textContent = t("th_package")
            row.append(tPackage)
        }
        if (columns.includes("type")) {
            const tType = document.createElement("th")
            tType.textContent = t("th_type")
            row.append(tType)
        }
        if (columns.includes("details")) {
            const tDetails = document.createElement("th")
            tDetails.textContent = t("th_details")
            row.append(tDetails)
        }
        return row
    }

    renderRow(log: Log, columns: string[]) {
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
        if (columns.includes("package")) {
            const tPackage = document.createElement("td")
            tPackage.textContent = log.package
            row.append(tPackage)
        }
        if (columns.includes("type")) {
            const tType = document.createElement("td")
            tType.textContent = log.type
            row.append(tType)
        }
        if (columns.includes("details")) {
            const tDetails = document.createElement("td")
            tDetails.classList.add("details")
            let details
            if (log.type == "connect") details = `Address: ${log.address}\nPort: ${log.port}`
            else details = `Host: ${log.host}\nAddresses:\n` + log.addresses.join("\n")
            tDetails.textContent = details
            row.append(tDetails)
        }
        return row
    }
}

class NetworkLogsFiltersDialogView implements LogFiltersDialogView {
    dialog = document.querySelector("#network-logs-view > dialog") as HTMLDialogElement
    applyBtn = this.dialog.querySelector("button.apply") as HTMLButtonElement

    constructor() {
        this.dialog.querySelector("button.close")!!.addEventListener("click", () => {
            this.dialog.close()
        })
    }

    open(filters: NetworkLogFilters) {
        this.dialog.querySelectorAll<HTMLInputElement>(".columns input").forEach(it => {
            it.checked = filters.columns.includes(it.dataset.column!!)
        })
        this.dialog.querySelectorAll<HTMLInputElement>(".types input").forEach(it => {
            it.checked = filters.types.includes(it.dataset.type!!)
        })
        this.dialog.showModal()
    }

    renderStat(stat: NetworkLogsStat) {
        this.dialog.querySelectorAll<HTMLInputElement>(".types input").forEach(it => {
            const count = stat.type[it.dataset.type as keyof NetworkLogsStat["type"]]
            it.nextElementSibling!!.lastElementChild!!.textContent = `(${count})`
        })
    }

    bindApply(action: (f: NetworkLogFilters) => void) {
        this.applyBtn.addEventListener("click", () => {
            const checkedColumns = this.dialog.querySelectorAll<HTMLInputElement>(".columns input:checked")
            const columnFilters = [...checkedColumns].map(it => it.dataset.column!!)
            const checkedTypes = document.querySelectorAll<HTMLInputElement>(".types input:checked")
            const typeFilters = [...checkedTypes].map(it => it.dataset.type!!)
            this.dialog.close()
            action({
                columns: columnFilters,
                types: typeFilters
            })
        })
    }
}
