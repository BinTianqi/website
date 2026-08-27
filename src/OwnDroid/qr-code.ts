import QRCode from "qrcode"
import { MyScreen } from "./common.js"

export default class QrCodeScreen extends MyScreen {
    linkTextarea = this.querySelector("textarea")!
    testkeyInput = this.querySelector("input.testkey") as HTMLInputElement
    generateBtn = this.querySelector("button")!
    canvas = this.querySelector("canvas")!

    connectedCallback() {
        this.linkTextarea.addEventListener("input", () => {
            this.generateBtn.disabled = !QrCodeScreen.checkUrl(this.linkTextarea.value)
        })
        this.generateBtn.addEventListener("click", () => {
            this.generateQrCode(this.linkTextarea.value, this.testkeyInput.checked)
        })
    }

    private generateQrCode(apkSrc: string, testkey: boolean) {
        const signature = testkey ? this.testkeySig : this.signedSig
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

    override clear() {
        this.linkTextarea.value = ""
        this.generateBtn.disabled = true
        this.canvas.classList.add("hidden")
    }

    private static checkUrl(urlText: string) {
        let url;
        try {
            url = new URL(urlText);
        } catch (_) {
            return false;
        }
        return url.protocol.startsWith("http") && url.pathname.endsWith(".apk")
    }

    private testkeySig = "pA2oClnRcMqpUM8VwYxFTUejmyaYnYtkDs10W6cb9dw"
    private signedSig = "5dXbF2p0LFZrpgIKwk2T-r2l9pUtf8yunjpG6YSOg7U"
}
