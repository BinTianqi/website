import * as l from "./log-viewer-common.js"
import {formatTimestamp} from "../utils/index.js"

interface NetworkLogFilters extends l.BaseLogFilters {
    types: string[]
}

interface NetworkLogsStat extends l.BaseLogsStat {
    type: { [key: string]: number }
}

const networkLogColumns: l.LogColumn[] = [
    { id: "id", name: "ID" },
    { id: "time", i18n: "th_time" },
    { id: "package", i18n: "th_package" },
    { id: "type", i18n: "th_type" },
    { id: "details", i18n: "th_details" }
]

export class NetworkLogsScreen extends l.LogsScreen {
    protected defaultFilters: NetworkLogFilters = {
        columns: networkLogColumns.map(it => it.id),
        types: ["connect", "dns"]
    }
    filters = structuredClone(this.defaultFilters)

    filterLogs() {
        return this.logs.filter(log => {
            return this.filters.types.includes(log.type)
        })
    }

    override statLogs() {
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

    override dialog = this.querySelector("network-logs-filter") as NetworkLogsFiltersDialog

    override connectedCallback() {
        super.connectedCallback()
        this.renderThead(networkLogColumns)
    }

    renderRow(log: l.Log) {
        const row = document.createElement("tr")
        const tId = document.createElement("td")
        tId.textContent = log.id.toString()
        tId.classList.add("id")
        const tTime = document.createElement("td")
        tTime.textContent = formatTimestamp(log.time)
        tTime.classList.add("time")
        const tPackage = document.createElement("td")
        tPackage.textContent = log.package
        tPackage.classList.add("package")
        const tType = document.createElement("td")
        tType.textContent = log.type
        tType.classList.add("type")
        const tDetails = document.createElement("td")
        tDetails.classList.add("details")
        let details
        if (log.type == "connect") details = `Address: ${log.address}\nPort: ${log.port}`
        else details = `Host: ${log.host}\nAddresses:\n` + log.addresses.join("\n")
        tDetails.textContent = details
        row.append(tId, tTime, tPackage, tType, tDetails)
        return row
    }
}

export class NetworkLogsFiltersDialog extends l.LogsFilterDialog {
    override connectedCallback() {
        super.connectedCallback()
        this.renderColumns(networkLogColumns, "n-f-col")
    }

    protected override updateFilters() {
        const checkedColumns = this.querySelectorAll<HTMLInputElement>(".columns input:checked")
        const checkedTypes = this.querySelectorAll<HTMLInputElement>(".types input:checked")
        const filters = {
            columns: [...checkedColumns].map(it => it.value),
            types: [...checkedTypes].map(it => it.value)
        } satisfies NetworkLogFilters
        this.dispatchEvent(
            new CustomEvent("filters-updated", {detail: {filters: filters}, bubbles: true})
        )
    }

    override open(filters: NetworkLogFilters) {
        super.open(filters)
        this.dialog.querySelectorAll<HTMLInputElement>(".types input").forEach(it => {
            it.checked = filters.types.includes(it.value)
        })
    }

    renderStat(stat: NetworkLogsStat) {
        this.dialog.querySelectorAll<HTMLInputElement>(".types input").forEach(it => {
            const count = stat.type[it.value as keyof NetworkLogsStat["type"]]
            it.nextElementSibling!.lastElementChild!.textContent = `(${count})`
        })
    }
}
