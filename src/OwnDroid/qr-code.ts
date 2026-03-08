import QRCode from "qrcode"

export default class QrCodeController {
    view = document.getElementById("qr-code-view")!!
    linkTextarea = this.view.querySelector("textarea")!!
    generateBtn = this.view.querySelector("button")!!
    canvas = this.view.querySelector("canvas")!!

    constructor() {
        this.linkTextarea.addEventListener("input", () => {
            this.generateBtn.disabled = !QrCodeController.checkUrl(this.linkTextarea.value)
        })
        this.generateBtn.addEventListener("click", () => {
            const src = this.linkTextarea.value
            const testkey = (this.view.querySelector("#testkey-checkbox") as HTMLInputElement).checked
            this.generateQrCode(src, testkey)
        })
    }

    generateQrCode(apkSrc: string, testkey: boolean) {
        const signature = testkey ? "pA2oClnRcMqpUM8VwYxFTUejmyaYnYtkDs10W6cb9dw" : "5dXbF2p0LFZrpgIKwk2T-r2l9pUtf8yunjpG6YSOg7U"
        const data = {
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.bintianqi.owndroid/.Receiver",
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": signature,
            "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": apkSrc,
            "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true
        }
        const options = {
            width: 300
        }
        QRCode.toCanvas(this.canvas, JSON.stringify(data), options, (e: Error) => {
            if (e) console.error(e)
        })
        this.canvas.classList.remove("hidden")
    }

    clear() {
        this.linkTextarea.value = ""
        this.generateBtn.disabled = true
        this.canvas.classList.add("hidden")
    }

    static checkUrl(urlText: string) {
        let url;
        try {
            url = new URL(urlText);
        } catch (_) {
            return false;
        }
        return url.protocol.startsWith("http") && url.pathname.endsWith(".apk")
    }
}
