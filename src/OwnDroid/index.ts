import "../m3wc/components"
import "../general.css"
import "../theme/m3.css"
import "./index.css"

import QrCodeScreen from "./qr-code.js"
import { SecurityLogsScreen, SecurityLogsFilterDialog } from "./security-logs.js"
import { NetworkLogsScreen, NetworkLogsFiltersDialog } from "./network-logs.js"
import { LogsScreen } from "./log-viewer-common.js"
import { t, applyLang } from "./i18n/index.js"
import { MyScreen } from "./common.js"

function registerCustomElements() {
    customElements.define("security-logs-screen", SecurityLogsScreen)
    customElements.define("security-logs-filter", SecurityLogsFilterDialog)
    customElements.define("network-logs-screen", NetworkLogsScreen)
    customElements.define("network-logs-filter", NetworkLogsFiltersDialog)
    customElements.define("qr-code-screen", QrCodeScreen)
    customElements.define("settings-dialog", SettingsDialog)
    customElements.define("logs-pager", LogsPager)
}

class PageController {
    mode = 0

    securityLogsScreen = document.querySelector("security-logs-screen") as SecurityLogsScreen
    networkLogsScreen = document.querySelector("network-logs-screen") as NetworkLogsScreen
    qrCodeScreen = document.querySelector("qr-code-screen") as QrCodeScreen
    currentScreen: MyScreen = this.securityLogsScreen
    currentLogsScreen: LogsScreen = this.securityLogsScreen

    settingsDialog = document.querySelector("settings-dialog") as SettingsDialog
    pager = document.querySelector("logs-pager") as LogsPager

    pageTitle = document.querySelector("title")!
    topBarTitle = document.querySelector("#topbar > a")!
    homeBtn = document.getElementById("home-btn")!
    openFiltersBtn = document.getElementById("open-filters-btn")!
    openSettingsBtn = document.getElementById("open-settings-btn")!
    greetingScreen = document.getElementById("greeting-view")!

    renderLogs() {
        this.currentLogsScreen.render(
            (this.pager.page - 1) * this.pager.pageSize, this.pager.pageSize
        )
    }

    constructor() {
        applyLang(this.settingsDialog.language)
        document.addEventListener("filters-updated", () => {
            this.pager.setTotalLogs(this.currentLogsScreen.filteredLogs.length)
            // pager will dispatch "page-switched" event, which triggers rendering
        })
        this.pager.addEventListener("page-switched", () => {
            this.renderLogs()
        })
        this.openSettingsBtn.addEventListener("click", () => {
            this.settingsDialog.open()
        })
        this.openFiltersBtn.addEventListener("click", () => {
            this.currentLogsScreen.openFiltersDialog()
        })
        this.homeBtn.addEventListener("click", () => {
            this.switchScreen(0)
        })
        this.initializeGreeting()
    }

    initializeGreeting() {
        const greeting = document.getElementById("greeting-view")!
        const input = greeting.querySelector("input")!
        input.addEventListener("input", async () => {
            const files = input.files
            if (files != null) {
                const logs: any[] = JSON.parse(await files[0].text())
                this.currentLogsScreen.loadLogs(logs)
                this.pager.setTotalLogs(logs.length)
                this.switchScreen(this.mode)
            }
        })
        greeting.querySelector(".security-logs button")!.addEventListener("click", () => {
            this.mode = 1
            this.currentScreen = this.securityLogsScreen
            this.currentLogsScreen = this.securityLogsScreen
            input.click()
        })
        greeting.querySelector(".network-logs button")!.addEventListener("click", () => {
            this.mode = 2
            this.currentScreen = this.networkLogsScreen
            this.currentLogsScreen = this.networkLogsScreen
            input.click()
        })
        greeting.querySelector(".qr-code button")!.addEventListener("click", () => {
            this.currentScreen = this.qrCodeScreen
            this.switchScreen(3)
        })
    }

    switchScreen(id: number) {
        document.querySelector("body > .screen.active")!.classList.remove("active")
        if (id != 0) {
            this.topBarTitle.classList.add("hidden")
            this.homeBtn.classList.remove("hidden")
            this.currentScreen.classList.add("active")
        }
        if (id == 1 || id == 2) {
            this.openFiltersBtn.classList.remove("hidden")
            this.pager.classList.remove("hidden")
        }
        if (id == 1) {
            this.pageTitle.textContent = "OwnDroid | " + t("security_logs_viewer")
        } else if (id == 2) {
            this.pageTitle.textContent = "OwnDroid | " + t("network_logs_viewer")
        } else if (id == 3) {
            this.pageTitle.textContent = "OwnDroid | " + t("generate_qr_code")
            this.qrCodeScreen.classList.add("active")
        } else {
            this.currentScreen.clear()
            this.homeBtn.classList.add("hidden")
            this.pageTitle.textContent = "OwnDroid"
            this.greetingScreen.classList.add("active")
            this.topBarTitle.classList.remove("hidden")
            this.pager.classList.add("hidden")
            this.openFiltersBtn.classList.add("hidden")
        }
        this.mode = id
    }
}

class SettingsDialog extends HTMLElement {
    language = localStorage.getItem("language")

    dialog = this.querySelector("dialog")!
    langDiv = this.querySelector("div.lang")!
    applyBtn = this.querySelector("button.apply")!

    connectedCallback() {
        this.querySelector("button.close")!.addEventListener("click", () => {
            this.dialog.close()
        })
        this.applyBtn.addEventListener("click", () => {
            const selectedLang = this.langDiv.querySelector("input:checked") as HTMLInputElement
            const newLang = selectedLang.value == "default" ? null : selectedLang.value
            if (this.language != newLang) {
                this.language = newLang
                if (newLang == null) {
                    localStorage.removeItem("language")
                } else {
                    localStorage.setItem("language", newLang)
                }
                applyLang(newLang)
            }
            this.dialog.close()
        })
    }

    open() {
        const lang = this.language == null ? "default" : this.language
        this.langDiv.querySelector<HTMLInputElement>(`input[value=${lang}]`)!.checked = true
        this.dialog.showModal()
    }
}

class LogsPager extends HTMLElement {
    previousButton = this.querySelector("button.previous") as HTMLButtonElement
    nextButton = this.querySelector("button.next") as HTMLButtonElement
    pageButton = this.querySelector("button.page")!

    dialog = this.querySelector("dialog")!
    dPageInput = this.dialog.querySelector("input")!
    dCancelButton = this.dialog.querySelector("button.cancel")!
    dJumpButton = this.dialog.querySelector("button.jump") as HTMLButtonElement

    page = 1
    totalPages = 1
    pageSize = 100

    connectedCallback() {
        this.previousButton.addEventListener("click", () => {
            this.page -= 1
            this.switchPage()
        })
        this.nextButton.addEventListener("click", () => {
            this.page += 1
            this.switchPage()
        })
        this.pageButton.addEventListener("click", () => {
            this.dPageInput.value = ""
            this.dJumpButton.disabled = true
            this.dialog.showModal()
        })
        this.dPageInput.addEventListener("input", () => {
            this.dJumpButton.disabled = !this.dPageInput.checkValidity()
        })
        this.dCancelButton.addEventListener("click", () => {
            this.dialog.close()
        })
        this.dJumpButton.addEventListener("click", () => {
            this.page = this.dPageInput.valueAsNumber
            this.dialog.close()
            this.switchPage()
        })
    }

    private switchPage() {
        this.previousButton.disabled = this.page == 1
        this.nextButton.disabled = this.page == this.totalPages
        this.pageButton.textContent = `${this.page} / ${this.totalPages}`
        this.dispatchEvent(new CustomEvent("page-switched"))
    }

    setTotalLogs(length: number) {
        this.page = 1
        this.totalPages = Math.ceil(length / this.pageSize)
        this.dPageInput.max = this.totalPages.toString()
        this.dPageInput.placeholder = `1~${this.totalPages}`
        this.switchPage()
    }
}

registerCustomElements()

document.addEventListener("DOMContentLoaded", () => {
    new PageController()
})
