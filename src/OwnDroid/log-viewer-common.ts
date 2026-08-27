import { t2 } from "./i18n/index.js"
import { MyScreen } from "./common.js"

export interface Log {
    id: number
    time: number

    tag: number
    level: number
    data: { [key: string]: string | number }

    package: string
    type: string
    host: string
    count: number
    addresses: string[]
    address: string
    port: number
}

export interface BaseLogFilters {
    columns: string[]
}

export interface BaseLogsStat {
}

export interface LogColumn {
    id: string
    name?: string,
    i18n?: string
}

export abstract class LogsScreen extends MyScreen {
    logs: Log[] = []
    filteredLogs: Log[] = []
    protected abstract defaultFilters: BaseLogFilters
    abstract filters: BaseLogFilters

    loadLogs(data: Log[]) {
        this.logs.push(...data)
        this.filteredLogs.push(...data)
        this.dialog.renderStat(this.statLogs())
    }

    abstract filterLogs(): Log[]

    abstract statLogs(): BaseLogsStat

    table = this.querySelector("table")!
    tbody = this.querySelector("tbody")!
    abstract dialog: LogsFilterDialog

    connectedCallback() {
        this.addEventListener("filters-updated", (e) => {
            this.filters = (e as CustomEvent).detail.filters
            this.filteredLogs = this.filterLogs()
            this.setVisibleColumns(this.filters.columns)
        })
    }

    renderThead(columns: LogColumn[]) {
        const tr = document.createElement("tr")
        for (const col of columns) {
            const th = document.createElement("th")
            th.classList.add(col.id)
            if (col.i18n) {
                th.dataset.i18n = col.i18n
                th.textContent = t2(col.i18n)
            } else {
                th.textContent = col.name!
            }
            tr.append(th)
        }
        this.table.querySelector("thead")!.append(tr)
    }

    render(start: number, length: number) {
        this.clearTable()
        const logs = this.filteredLogs.slice(start, start + length)
        for (const log of logs) {
            this.tbody.append(this.renderRow(log))
        }
    }

    abstract renderRow(log: Log): HTMLTableRowElement

    private setVisibleColumns(columns: string[]) {
        for (const col of this.defaultFilters.columns) {
            if (columns.includes(col)) {
                this.table.classList.remove(`hide-${col}`)
            } else {
                this.table.classList.add(`hide-${col}`)
            }
        }
    }

    openFiltersDialog() {
        this.dialog.open(this.filters)
    }

    clearTable() {
        this.tbody.replaceChildren()
    }

    override clear() {
        this.logs.length = 0
        this.filteredLogs.length = 0
        this.filters = structuredClone(this.defaultFilters)
        this.clearTable()
    }
}

export abstract class LogsFilterDialog extends HTMLElement {
    dialog = this.querySelector("dialog")!
    columnsDiv = this.querySelector("div.columns")!
    cancelButton = this.querySelector("button.cancel")!
    applyButton = this.querySelector("button.apply")!

    connectedCallback() {
        this.cancelButton.addEventListener("click", () => {
            this.dialog.close()
        })
        this.applyButton.addEventListener("click", () => {
            this.updateFilters()
            this.dialog.close()
        })
    }

    protected abstract updateFilters(): void

    protected renderColumns(columns: LogColumn[], idPrefix: string) {
        for (const col of columns) {
            const div = document.createElement("div")
            const id = `${idPrefix}-${col.id}`
            const input = document.createElement("input")
            input.type = "checkbox"
            input.classList.add("m3")
            input.id = id
            input.value = col.id
            const label = document.createElement("label")
            label.setAttribute("for", id)
            if (col.i18n) {
                label.dataset.i18n = col.i18n
                label.textContent = t2(col.i18n)
            } else {
                label.textContent = col.name!
            }
            div.append(input, label)
            this.columnsDiv.append(div)
        }
    }

    open(filters: BaseLogFilters) {
        this.dialog.querySelectorAll<HTMLInputElement>(".columns input").forEach(it => {
            it.checked = filters.columns.includes(it.value)
        })
        this.dialog.showModal()
    }

    abstract renderStat(stat: BaseLogsStat): void
}
