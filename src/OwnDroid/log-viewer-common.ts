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

export abstract class LogsController {
    abstract view: LogsView
    abstract dialog: LogFiltersDialogView
    abstract defaultFilters: BaseLogFilters
    abstract filters: BaseLogFilters
    logs: Log[] = []
    filteredLogs: Log[] = []

    bindApplyFilters(setLogsCount: (p: number) => void) {
        this.dialog.bindApply((f) => {
            this.filters = f
            this.filteredLogs = this.filterLogs()
            setLogsCount(this.filteredLogs.length)
        })
    }

    loadLogs(data: Log[]) {
        this.logs.push(...data)
        this.filteredLogs.push(...data)
        this.dialog.renderStat(this.statLogs())
    }

    render(start: number, length: number) {
        const logs = this.filteredLogs.slice(start, start + length)
        this.view.clearTable()
        this.view.render(logs, this.filters)
    }

    abstract filterLogs(): Log[]

    openFiltersDialog() {
        this.dialog.open(this.filters)
    }

    abstract statLogs(): BaseLogsStat

    clear() {
        this.logs.length = 0
        this.filteredLogs.length = 0
        this.filters = structuredClone(this.defaultFilters)
        this.view.clearTable()
    }
}

export abstract class LogsView {
    abstract thead: HTMLTableSectionElement
    abstract tbody: HTMLTableSectionElement

    render(logs: Log[], filters: BaseLogFilters) {
        this.thead.append(this.renderThead(filters.columns))
        for (const log of logs) {
            this.tbody.append(this.renderRow(log, filters.columns))
        }
    }

    abstract renderThead(columns: string[]): HTMLTableRowElement

    abstract renderRow(log: Log, columns: string[]): HTMLTableRowElement

    clearTable() {
        this.thead.replaceChildren()
        this.tbody.replaceChildren()
    }
}

export interface LogFiltersDialogView {
    open(filters: BaseLogFilters): void

    renderStat(stat: BaseLogsStat): void

    bindApply(action: (f: BaseLogFilters) => void): void
}
