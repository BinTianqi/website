import QrCodeController from "./qr-code.js"
import SecurityLogsController from "./security-logs.js"
import NetworkLogsController from "./network-logs.js"
import {t, applyLang} from "./i18n/index.js"

class PageController {
    mode = 0
    language = localStorage.getItem("language")
    securityLogsController = new SecurityLogsController()
    networkLogsController = new NetworkLogsController()
    qrCodeController = new QrCodeController()
    settingsDialog = new SettingsDialogView()

    pageTitle = document.querySelector("title")!!
    topBarTitle = document.querySelector("#topbar > a")!!
    homeBtn = document.getElementById("home-btn")!!
    openFiltersBtn = document.getElementById("open-filters-btn")!!
    openSettingsBtn = document.getElementById("open-settings-btn")!!
    greetingView = document.getElementById("greeting-view")!!
    securityLogsView = document.getElementById("security-logs-view")!!
    networkLogsView = document.getElementById("network-logs-view")!!
    qrCodeView = document.getElementById("qr-code-view")!!

    constructor() {
        applyLang(this.language)
        this.settingsDialog.bindApply((l) => {
            if (this.language != l) {
                this.language = l
                if (l == null) {
                    localStorage.removeItem("language")
                } else {
                    localStorage.setItem("language", l)
                }
                applyLang(l)
                if (this.mode == 1) {
                    this.securityLogsController.reload()
                } else if (this.mode == 2) {
                    this.networkLogsController.reload()
                }
            }
        })
        this.openSettingsBtn.addEventListener("click", () => {
            this.settingsDialog.open(this.language)
        })
        this.openFiltersBtn.addEventListener("click", () => {
            if (this.mode == 1) {
                this.securityLogsController.openFiltersDialog()
            } else {
                this.networkLogsController.openFiltersDialog()
            }
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
                const logs = JSON.parse(await files[0].text())
                if (this.mode == 1) {
                    this.securityLogsController.loadLogs(logs)
                } else {
                    this.networkLogsController.loadLogs(logs)
                }
                this.switchScreen(this.mode)
            }
        })
        greeting.querySelector(".security-logs button")!!.addEventListener("click", () => {
            this.mode = 1
            input.click()
        })
        greeting.querySelector(".network-logs button")!!.addEventListener("click", () => {
            this.mode = 2
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
            if (this.mode == 1) {
                this.securityLogsController.clear()
            } else if (this.mode == 2) {
                this.networkLogsController.clear()
            } else if (this.mode == 3) {
                this.qrCodeController.clear()
            }
            this.homeBtn.classList.add("hidden")
            this.pageTitle.textContent = "OwnDroid"
            this.greetingView.classList.add("active")
            this.topBarTitle.classList.remove("hidden")
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

document.addEventListener("DOMContentLoaded", () => {
    new PageController()
})
