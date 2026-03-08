import QrCodeController from "./qr-code.js"
import SecurityLogsController from "./security-logs.js"
import NetworkLogsController from "./network-logs.js"
import type {LogsController} from "./log-viewer-common.js"
import {t, applyLang} from "./i18n/index.js"

class PageController {
    mode = 0
    language = localStorage.getItem("language")
    securityLogsController = new SecurityLogsController()
    networkLogsController = new NetworkLogsController()
    currentLogsController: LogsController = this.securityLogsController
    qrCodeController = new QrCodeController()
    settingsDialog = new SettingsDialogView()
    pagerController = new PagerController()
    pagerChip = document.getElementById("pager")!!

    pageTitle = document.querySelector("title")!!
    topBarTitle = document.querySelector("#topbar > a")!!
    homeBtn = document.getElementById("home-btn")!!
    openFiltersBtn = document.getElementById("open-filters-btn")!!
    openSettingsBtn = document.getElementById("open-settings-btn")!!
    greetingView = document.getElementById("greeting-view")!!
    securityLogsView = document.getElementById("security-logs-view")!!
    networkLogsView = document.getElementById("network-logs-view")!!
    qrCodeView = document.getElementById("qr-code-view")!!

    renderLogs() {
        this.currentLogsController.render(
            (this.pagerController.page - 1) * this.pagerController.pageSize, this.pagerController.pageSize
        )
    }

    constructor() {
        applyLang(this.language)
        this.securityLogsController.bindApplyFilters((l) => {
            this.pagerController.setTotalLogs(l)
            this.renderLogs()
        })
        this.networkLogsController.bindApplyFilters((l) => {
            this.pagerController.setTotalLogs(l)
            this.renderLogs()
        })
        this.pagerController.bindSwitchPage(() => {
            this.renderLogs()
        })
        this.settingsDialog.bindApply((l) => {
            if (this.language != l) {
                this.language = l
                if (l == null) {
                    localStorage.removeItem("language")
                } else {
                    localStorage.setItem("language", l)
                }
                applyLang(l)
                this.renderLogs()
            }
        })
        this.openSettingsBtn.addEventListener("click", () => {
            this.settingsDialog.open(this.language)
        })
        this.openFiltersBtn.addEventListener("click", () => {
            this.currentLogsController.openFiltersDialog()
        })
        this.homeBtn.addEventListener("click", () => {
            this.switchScreen(0)
        })
        this.initializeGreeting()
    }

    initializeGreeting() {
        const greeting = document.getElementById("greeting-view")!!
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "application/json"
        input.addEventListener("input", async () => {
            const files = input.files
            if (files != null) {
                const logs: any[] = JSON.parse(await files[0].text())
                this.currentLogsController.loadLogs(logs)
                this.pagerController.setTotalLogs(logs.length)
                this.renderLogs()
                this.switchScreen(this.mode)
            }
        })
        greeting.querySelector(".security-logs button")!!.addEventListener("click", () => {
            this.mode = 1
            this.currentLogsController = this.securityLogsController
            input.click()
        })
        greeting.querySelector(".network-logs button")!!.addEventListener("click", () => {
            this.mode = 2
            this.currentLogsController = this.networkLogsController
            input.click()
        })
        greeting.querySelector(".qr-code button")!!.addEventListener("click", () => {
            this.switchScreen(3)
        })
    }

    switchScreen(id: number) {
        document.querySelector("body > .content.active")!!.classList.remove("active")
        if (id != 0) {
            this.topBarTitle.classList.add("hidden")
            this.homeBtn.classList.remove("hidden")
        }
        if (id == 1 || id == 2) {
            this.openFiltersBtn.classList.remove("hidden")
            this.pagerChip.classList.remove("hidden")
        }
        if (id == 1) {
            this.pageTitle.textContent = t("security_logs_viewer")
            this.securityLogsView.classList.add("active")
        } else if (id == 2) {
            this.pageTitle.textContent = t("network_logs_viewer")
            this.networkLogsView.classList.add("active")
        } else if (id == 3) {
            this.pageTitle.textContent = t("generate_qr_code")
            this.qrCodeView.classList.add("active")
        } else {
            if (this.mode == 1 || this.mode == 2) {
                this.currentLogsController.clear()
            } else if (this.mode == 3) {
                this.qrCodeController.clear()
            }
            this.homeBtn.classList.add("hidden")
            this.pageTitle.textContent = "OwnDroid"
            this.greetingView.classList.add("active")
            this.topBarTitle.classList.remove("hidden")
            this.pagerChip.classList.add("hidden")
            this.openFiltersBtn.classList.add("hidden")
        }
        this.mode = id
    }
}

class SettingsDialogView {
    dialog = document.getElementById("settings") as HTMLDialogElement
    selectLang = document.getElementById("select-lang") as HTMLInputElement
    applyBtn = this.dialog.querySelector("button.apply")!!

    constructor() {
        this.dialog.querySelector("button.close")!!.addEventListener("click", () => {
            this.dialog.close()
        })
    }

    open(lang: string | null) {
        if (lang == null) this.selectLang.value = "default"
        else this.selectLang.value = lang
        this.dialog.showModal()
    }

    bindApply(action: (l: string | null) => void) {
        this.applyBtn.addEventListener("click", () => {
            const newLang = this.selectLang.value
            action(newLang == "default" ? null : newLang)
            this.dialog.close()
        })
    }
}

class PagerController {
    dialog = new PagerDialog()
    pager = document.getElementById("pager")!!
    previousButton = this.pager.querySelector("button.previous") as HTMLButtonElement
    nextButton = this.pager.querySelector("button.next") as HTMLButtonElement
    span = this.pager.querySelector("span")!!
    page = 1
    totalPages = 1
    pageSize = 100

    constructor() {
        this.span.addEventListener("click", () => {
            this.dialog.open()
        })
    }

    updateState() {
        this.previousButton.disabled = this.page == 1
        this.nextButton.disabled = this.page == this.totalPages
        this.renderSpan()
    }

    bindSwitchPage(switchPage: () => void) {
        this.previousButton.addEventListener("click", () => {
            this.page -= 1
            this.updateState()
            switchPage()
        })
        this.nextButton.addEventListener("click", () => {
            this.page += 1
            this.updateState()
            switchPage()
        })
        this.dialog.bindJump((p) => {
            this.page = p
            this.updateState()
            switchPage()
        })
    }

    setTotalLogs(length: number) {
        this.page = 1
        this.totalPages = Math.ceil(length / this.pageSize)
        this.dialog.setMaxPage(this.totalPages)
        this.updateState()
    }

    renderSpan() {
        this.span.textContent = `${this.page} / ${this.totalPages}`
    }
}

class PagerDialog {
    dialog = document.getElementById("pager-dialog") as HTMLDialogElement
    input = this.dialog.querySelector("input") as HTMLInputElement
    closeBtn = this.dialog.querySelector("button.close")!
    jumpBtn = this.dialog.querySelector("button.jump") as HTMLButtonElement

    constructor() {
        this.closeBtn.addEventListener("click", () => {
            this.dialog.close()
        })
        this.input.addEventListener("input", () => {
            this.jumpBtn.disabled = !this.input.checkValidity()
        })
    }

    open() {
        this.input.value = ""
        this.jumpBtn.disabled = true
        this.dialog.showModal()
    }

    setMaxPage(max: number) {
        this.input.max = max.toString()
        this.input.placeholder = `1~${max}`
    }

    bindJump(action: (p: number) => void) {
        this.jumpBtn.addEventListener("click", () => {
            action(this.input.valueAsNumber)
            this.dialog.close()
        })
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new PageController()
})
